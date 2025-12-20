from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uuid
import asyncio
from datetime import datetime

from storage_manager import SupabaseStorageManager
from smart_engine import SmartStorageEngine  # Your earlier implementation
from algorithms import (  # We'll create this next
    encode_with_replication,
    encode_with_reed_solomon,
    encode_with_xor_parity,
    decode_file
)

app = FastAPI(title="COSMEON Storage API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize managers
storage = SupabaseStorageManager()
engine = SmartStorageEngine()

class UploadResponse(BaseModel):
    file_id: str
    algorithm: str
    shards: List[dict]
    storage_cost: float
    can_survive_failures: int

class NodeStatus(BaseModel):
    node_id: str
    status: str
    files_count: int
    last_checked: datetime

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "service": "COSMEON Storage API",
        "version": "1.0.0",
        "status": "operational",
        "nodes": len(storage.buckets)
    }

@app.get("/nodes/status")
async def get_nodes_status():
    """Get status of all storage nodes"""
    status = storage.get_bucket_status()
    
    # Format response
    nodes = []
    for bucket_name, info in status.items():
        nodes.append({
            "node_id": bucket_name,
            "status": info["status"],
            "files_count": info["file_count"],
            "capacity": info.get("capacity", "unlimited"),
            "last_checked": datetime.utcnow().isoformat()
        })
    
    return {
        "total_nodes": len(nodes),
        "online_nodes": sum(1 for n in nodes if n["status"] == "online"),
        "nodes": nodes
    }

@app.post("/upload", response_model=UploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    algorithm: Optional[str] = None,
    policy: str = "balanced"
):
    """
    Upload a file with intelligent storage selection
    
    - If algorithm is specified, use it
    - Otherwise, use smart engine to choose best algorithm
    """
    # Read file
    contents = await file.read()
    file_size = len(contents)
    
    # Generate unique file ID
    file_id = str(uuid.uuid4())
    
    # Analyze file metadata
    metadata = engine.analyze_file(file.filename)
    metadata.size = file_size
    
    # Determine algorithm
    if algorithm:
        # Use specified algorithm
        decision = {
            "algorithm": algorithm,
            "config": engine._configure_algorithm(algorithm, metadata),
            "reasoning": f"User specified {algorithm}",
            "cost_estimate": engine._estimate_cost(algorithm, metadata)
        }
    else:
        # Use smart selection
        decision = engine.select_algorithm(metadata, policy)
    
    # Encode file based on algorithm
    if decision["algorithm"] == "replication":
        shard_data_list = encode_with_replication(
            contents, 
            decision["config"].get("replication_factor", 3)
        )
    elif decision["algorithm"] == "reed-solomon":
        k = decision["config"].get("k", 3)
        m = decision["config"].get("m", 2)
        shard_data_list = encode_with_reed_solomon(contents, k, m)
    elif decision["algorithm"] == "xor-parity":
        shard_data_list = encode_with_xor_parity(
            contents,
            decision["config"].get("parity_disks", 2)
        )
    else:
        raise HTTPException(400, f"Unknown algorithm: {decision['algorithm']}")
    
    # Upload shards to distributed nodes
    shard_metadata = []
    for i, shard_data in enumerate(shard_data_list):
        # Distribute across buckets (round-robin)
        bucket_index = i % len(storage.buckets)
        bucket_name = storage.buckets[bucket_index]
        
        # Upload shard
        shard_info = storage.upload_shard(
            bucket_name=bucket_name,
            shard_data=shard_data,
            file_id=file_id,
            shard_index=i
        )
        
        shard_metadata.append(shard_info)
    
    # Store file metadata
    full_metadata = {
        "filename": file.filename,
        "original_size": file_size,
        "algorithm": decision["algorithm"],
        "config": decision["config"],
        "shards": shard_metadata,
        "cost_estimate": decision["cost_estimate"],
        "policy_used": policy,
        "uploaded_at": datetime.utcnow().isoformat()
    }
    
    storage.store_metadata(file_id, full_metadata)
    
    # Calculate survivability
    if decision["algorithm"] == "replication":
        factor = decision["config"].get("replication_factor", 3)
        can_survive = factor - 1
    elif decision["algorithm"] == "reed-solomon":
        m = decision["config"].get("m", 2)
        can_survive = m
    else:  # xor-parity
        can_survive = decision["config"].get("parity_disks", 2)
    
    return UploadResponse(
        file_id=file_id,
        algorithm=decision["algorithm"],
        shards=shard_metadata,
        storage_cost=decision["cost_estimate"],
        can_survive_failures=can_survive
    )

@app.get("/file/{file_id}/reconstruct")
async def reconstruct_file(file_id: str, background_tasks: BackgroundTasks):
    """Reconstruct a file from distributed shards"""
    
    # Get file metadata
    metadata = storage.get_metadata(file_id)
    if not metadata:
        raise HTTPException(404, f"File {file_id} not found")
    
    # Download all available shards
    shard_data_list = []
    missing_indices = []
    
    for i, shard_info in enumerate(metadata["shards"]):
        try:
            shard_data = storage.download_shard(shard_info["url"])
            shard_data_list.append((i, shard_data))
        except:
            missing_indices.append(i)
            shard_data_list.append((i, None))
    
    # Reconstruct file
    try:
        if metadata["algorithm"] == "replication":
            # For replication, any shard has full data
            for idx, data in shard_data_list:
                if data:
                    reconstructed = data  # All shards have full file
                    break
        elif metadata["algorithm"] == "reed-solomon":
            k = metadata["config"].get("k", 3)
            m = metadata["config"].get("m", 2)
            reconstructed = decode_file(
                shard_data_list, 
                algorithm="reed-solomon",
                k=k, m=m
            )
        elif metadata["algorithm"] == "xor-parity":
            reconstructed = decode_file(
                shard_data_list,
                algorithm="xor-parity"
            )
        else:
            raise HTTPException(400, f"Unknown algorithm: {metadata['algorithm']}")
        
        # Store reconstructed file temporarily (in production, use S3 presigned URL)
        temp_filename = f"/tmp/reconstructed_{file_id}_{metadata['filename']}"
        with open(temp_filename, "wb") as f:
            f.write(reconstructed)
        
        # Schedule cleanup
        background_tasks.add_task(cleanup_temp_file, temp_filename)
        
        return {
            "file_id": file_id,
            "filename": metadata["filename"],
            "reconstructed_size": len(reconstructed),
            "missing_shards": missing_indices,
            "reconstruction_time": datetime.utcnow().isoformat(),
            "download_url": f"/download/{file_id}"  # You'd implement this separately
        }
        
    except Exception as e:
        raise HTTPException(500, f"Reconstruction failed: {str(e)}")

async def cleanup_temp_file(filepath: str):
    """Clean up temporary file after delay"""
    await asyncio.sleep(300)  # 5 minutes
    import os
    if os.path.exists(filepath):
        os.remove(filepath)

@app.get("/files")
async def list_files():
    """List all uploaded files"""
    files = storage.list_files_metadata()
    return files

@app.get("/file/{file_id}/status")
async def get_file_status(file_id: str):
    """Check status of a file's shards"""
    
    metadata = storage.get_metadata(file_id)
    if not metadata:
        raise HTTPException(404, f"File {file_id} not found")
    
    # Check each shard
    shard_status = []
    for shard in metadata["shards"]:
        try:
            # Try to download a small portion
            import httpx
            async with httpx.AsyncClient() as client:
                response = await client.head(shard["url"])
                status = "online" if response.status_code == 200 else "offline"
        except:
            status = "offline"
        
        shard_status.append({
            "shard_index": shard["shard_index"],
            "bucket": shard["bucket"],
            "url": shard["url"],
            "status": status,
            "size": shard.get("size", 0)
        })
    
    # Calculate survivability
    online_shards = sum(1 for s in shard_status if s["status"] == "online")
    algorithm = metadata["algorithm"]
    config = metadata["config"]
    
    if algorithm == "replication":
        needed = 1
        can_survive = config.get("replication_factor", 3) - 1
    elif algorithm == "reed-solomon":
        needed = config.get("k", 3)
        can_survive = config.get("m", 2)
    else:  # xor-parity
        needed = len(shard_status) - config.get("parity_disks", 2)
        can_survive = config.get("parity_disks", 2)
    
    return {
        "file_id": file_id,
        "filename": metadata["filename"],
        "algorithm": algorithm,
        "shard_status": shard_status,
        "online_shards": online_shards,
        "needed_shards": needed,
        "can_survive_more": max(0, online_shards - needed),
        "reconstructable": online_shards >= needed,
        "health": "healthy" if online_shards >= needed else "degraded" if online_shards >= needed - can_survive else "critical"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)