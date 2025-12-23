from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional
import uuid
import asyncio
from datetime import datetime
import tempfile
import os
import zlib
import io

from storage_manager import SupabaseStorageManager
from smart_engine import SmartStorageEngine
from node_simulator import node_simulator
from algorithms import (
    encode_with_replication,
    encode_with_reed_solomon,
    decode_file,
    decompress_bytes
)

app = FastAPI(
    title="COSMEON Distributed Storage API",
    version="1.0.0",
    description="Intelligent distributed file storage with erasure coding and replication"
)

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

# Response models
class UploadResponse(BaseModel):
    file_id: str
    algorithm: str
    shards: List[dict]
    storage_cost: float
    can_survive_failures: int

class FileStatusResponse(BaseModel):
    file_id: str
    filename: str
    algorithm: str
    shard_status: List[dict]
    online_shards: int
    needed_shards: int
    reconstructable: bool
    health: str

class NodeStatusResponse(BaseModel):
    total_nodes: int
    online_nodes: int
    nodes: List[dict]

@app.get("/", tags=["Health"])
async def health_check():
    """API health check and service information"""
    return {
        "service": "COSMEON Distributed Storage API",
        "version": "1.0.0",
        "status": "operational",
        "storage_nodes": len(storage.buckets),
        "algorithms": ["replication", "reed-solomon"],
        "policies": ["balanced", "cost", "reliability", "eco"]
    }

@app.get("/nodes/status", response_model=NodeStatusResponse, tags=["Nodes"])
async def get_nodes_status():
    """Get status and health of all storage nodes"""
    status = storage.get_bucket_status()
    
    # Get all files to calculate actual usage
    all_files = storage.list_files_metadata()
    
    nodes = []
    
    for i, (bucket_name, info) in enumerate(status.items()):
        # Calculate actual storage usage for this node
        used_bytes = 0
        files_on_node = set()  # Use set to count unique files
        
        for file_data in all_files:
            file_id = file_data.get("id", "unknown")
            shards = file_data.get("shards", [])
            
            # Ensure shards is a list
            if not isinstance(shards, list):
                continue
            
            for shard in shards:
                if not isinstance(shard, dict):
                    continue
                    
                shard_bucket = shard.get("bucket", "")
                
                if shard_bucket == bucket_name:
                    shard_size = shard.get("size", 0)
                    if isinstance(shard_size, (int, float)) and shard_size > 0:
                        used_bytes += int(shard_size)
                        files_on_node.add(file_id)
        
        # Simulate different capacity sizes for variety
        capacity_gb = [45, 50, 55, 60, 48][i % 5]  # Different capacities per node
        capacity_bytes = capacity_gb * 1024 * 1024 * 1024
        
        # Calculate utilization percentage with better precision for small values
        utilization_percent = (used_bytes / capacity_bytes * 100) if capacity_bytes > 0 else 0
        
        # Use more decimal places for small utilization values
        if utilization_percent < 0.1:
            utilization_display = round(utilization_percent, 3)  # 3 decimal places for small values
        elif utilization_percent < 1.0:
            utilization_display = round(utilization_percent, 2)  # 2 decimal places for medium values
        else:
            utilization_display = round(utilization_percent, 1)  # 1 decimal place for larger values
        
        nodes.append({
            "node_id": bucket_name,
            "status": "offline" if node_simulator.is_node_failed(bucket_name) else info["status"],
            "files_count": len(files_on_node) if not node_simulator.is_node_failed(bucket_name) else 0,
            "capacity_gb": capacity_gb,
            "capacity_bytes": capacity_bytes,
            "used_bytes": used_bytes if not node_simulator.is_node_failed(bucket_name) else 0,
            "utilization_percent": utilization_display if not node_simulator.is_node_failed(bucket_name) else 0,
            "available_bytes": capacity_bytes if node_simulator.is_node_failed(bucket_name) else capacity_bytes - used_bytes,
            "last_checked": datetime.utcnow().isoformat(),
            "simulated_failure": node_simulator.is_node_failed(bucket_name)
        })
    
    return NodeStatusResponse(
        total_nodes=len(nodes),
        online_nodes=sum(1 for n in nodes if n["status"] == "online"),
        nodes=nodes
    )

@app.post("/nodes/{node_id}/simulate-failure", tags=["Nodes"])
async def simulate_node_failure(node_id: str):
    """Simulate a node failure"""
    success = node_simulator.simulate_failure(node_id)
    if success:
        return {"message": f"Node {node_id} failure simulated", "status": "failed"}
    else:
        return {"message": f"Node {node_id} already failed", "status": "already_failed"}

@app.post("/nodes/{node_id}/restore", tags=["Nodes"])
async def restore_node(node_id: str):
    """Restore a failed node"""
    success = node_simulator.restore_node(node_id)
    if success:
        return {"message": f"Node {node_id} restored", "status": "online"}
    else:
        return {"message": f"Node {node_id} was not failed", "status": "already_online"}

@app.get("/nodes/failures", tags=["Nodes"])
async def get_failure_status():
    """Get current node failure simulation status"""
    return node_simulator.get_failure_info()

@app.post("/upload", response_model=UploadResponse, tags=["Files"])
async def upload_file(
    request: Request,
    file: UploadFile = File(...),
    algorithm: Optional[str] = None,
    policy: str = "balanced"
):
    """
    Upload a file with intelligent storage distribution
    
    **Parameters:**
    - **file**: File to upload (multipart/form-data)
    - **algorithm**: Storage algorithm ("replication", "reed-solomon", or "auto")
    - **policy**: Selection policy ("balanced", "cost", "reliability", "eco")
    
    **Returns:**
    - File ID, algorithm used, shard information, and failure tolerance
    """
    # Parse form data for additional parameters
    try:
        form = await request.form()
        algorithm = form.get("algorithm", algorithm)
        policy = form.get("policy", policy)
    except Exception:
        pass

    # Read and validate file
    contents = await file.read()
    if not contents:
        raise HTTPException(400, "Empty file uploaded")
    
    file_size = len(contents)
    file_id = str(uuid.uuid4())
    
    # Analyze file characteristics
    metadata = engine.analyze_file(file.filename or "unknown")
    metadata.size = file_size
    
    # Process algorithm selection
    decision = _process_algorithm_selection(algorithm, metadata, policy)
    
    # Apply compression if needed
    if decision["config"].get("compress"):
        contents = zlib.compress(contents)
        file_size = len(contents)

    # Encode file into shards
    shard_data_list = _encode_file(contents, decision)
    
    # Distribute shards across storage nodes
    shard_metadata = _distribute_shards(shard_data_list, file_id)
    
    # Store metadata in database
    full_metadata = {
        "filename": file.filename,
        "original_size": file_size,
        "algorithm": decision["algorithm"],
        "config": decision["config"],
        "shards": shard_metadata,
        "cost_estimate": decision["cost_estimate"],
        "policy_used": policy
    }
    
    if not storage.store_metadata(file_id, full_metadata):
        raise HTTPException(500, "Failed to store file metadata")
    
    # Calculate failure tolerance
    can_survive = _calculate_failure_tolerance(decision)
    
    return UploadResponse(
        file_id=file_id,
        algorithm=decision["algorithm"],
        shards=shard_metadata,
        storage_cost=decision["cost_estimate"],
        can_survive_failures=can_survive
    )

def _process_algorithm_selection(algorithm: Optional[str], metadata, policy: str) -> dict:
    """Process algorithm selection and return decision"""
    compress_flag = False
    
    if algorithm:
        alg_raw = algorithm.lower()
        if "+compress" in alg_raw:
            compress_flag = True
            alg_raw = alg_raw.replace("+compress", "")

        if alg_raw in ("auto", "none", ""):
            algorithm = None
        elif "reed" in alg_raw and ("solomon" in alg_raw or "solo" in alg_raw):
            algorithm = "reed-solomon"
        elif alg_raw in ("replication", "replicate"):
            algorithm = "replication"

    if algorithm:
        config = engine._configure_algorithm(algorithm, metadata)
        if compress_flag:
            config["compress"] = True
        
        return {
            "algorithm": algorithm,
            "config": config,
            "reasoning": f"User specified {algorithm}",
            "cost_estimate": engine._estimate_cost(algorithm, metadata, compress=config.get("compress", False))
        }
    else:
        return engine.select_algorithm(metadata, policy)

def _encode_file(contents: bytes, decision: dict) -> List[bytes]:
    """Encode file into shards based on algorithm"""
    algorithm = decision["algorithm"]
    config = decision["config"]
    
    if algorithm == "replication":
        return encode_with_replication(contents, config.get("replication_factor", 3))
    elif algorithm == "reed-solomon":
        k = config.get("k", 3)
        m = config.get("m", 2)
        return encode_with_reed_solomon(contents, k, m)
    else:
        raise HTTPException(400, f"Unknown algorithm: {algorithm}")

def _distribute_shards(shard_data_list: List[bytes], file_id: str) -> List[dict]:
    """Distribute shards across storage nodes (one shard per node for Reed-Solomon)"""
    shard_metadata = []
    
    # For Reed-Solomon (3,2), we should have exactly 5 shards
    if len(shard_data_list) == 5 and len(storage.buckets) >= 5:
        # Distribute one shard per node for optimal fault tolerance
        for i, shard_data in enumerate(shard_data_list):
            bucket_name = storage.buckets[i]  # Use node i for shard i
            
            shard_info = storage.upload_shard(
                bucket_name=bucket_name,
                shard_data=shard_data,
                file_id=file_id,
                shard_index=i
            )
            shard_metadata.append(shard_info)
    else:
        # Fallback to round-robin distribution for other cases
        for i, shard_data in enumerate(shard_data_list):
            bucket_index = i % len(storage.buckets)
            bucket_name = storage.buckets[bucket_index]
            
            shard_info = storage.upload_shard(
                bucket_name=bucket_name,
                shard_data=shard_data,
                file_id=file_id,
                shard_index=i
            )
            shard_metadata.append(shard_info)
    
    return shard_metadata

def _calculate_failure_tolerance(decision: dict) -> int:
    """Calculate how many node failures the file can survive"""
    algorithm = decision["algorithm"]
    config = decision["config"]
    
    if algorithm == "replication":
        return config.get("replication_factor", 3) - 1
    elif algorithm == "reed-solomon":
        return config.get("m", 2)
    else:
        return 0

@app.get("/files", tags=["Files"])
async def list_files():
    """List all uploaded files with metadata"""
    return storage.list_files_metadata()

@app.get("/file/{file_id}/status", response_model=FileStatusResponse, tags=["Files"])
async def get_file_status(file_id: str):
    """Get detailed status and health of a specific file"""
    metadata = storage.get_metadata(file_id)
    if not metadata:
        raise HTTPException(404, f"File {file_id} not found")
    
    # Check shard availability (considering simulated failures)
    shard_status = []
    for shard in metadata["shards"]:
        shard_bucket = shard.get("bucket", "")
        
        # Check if node is simulated as failed
        if node_simulator.is_node_failed(shard_bucket):
            status = "offline"
        else:
            try:
                import httpx
                async with httpx.AsyncClient(timeout=5.0) as client:
                    response = await client.head(shard["url"])
                    status = "online" if response.status_code == 200 else "offline"
            except:
                status = "offline"
        
        shard_status.append({
            "shard_index": shard["shard_index"],
            "bucket": shard["bucket"],
            "status": status,
            "size": shard.get("size", 0),
            "simulated_failure": node_simulator.is_node_failed(shard_bucket)
        })
    
    # Calculate health metrics
    online_shards = sum(1 for s in shard_status if s["status"] == "online")
    algorithm = metadata.get("algorithm_used") or metadata.get("algorithm")
    config = metadata.get("algorithm_config") or metadata.get("config", {})
    
    if algorithm == "replication":
        needed = 1
    elif algorithm == "reed-solomon":
        needed = config.get("k", 3)
    else:
        needed = 1
    
    reconstructable = online_shards >= needed
    if reconstructable:
        health = "healthy"
    elif online_shards > 0:
        health = "degraded"
    else:
        health = "critical"
    
    return FileStatusResponse(
        file_id=file_id,
        filename=metadata.get("filename", "unknown"),
        algorithm=algorithm,
        shard_status=shard_status,
        online_shards=online_shards,
        needed_shards=needed,
        reconstructable=reconstructable,
        health=health
    )
@app.get("/file/{file_id}/reconstruct", tags=["Files"])
async def reconstruct_file(file_id: str, background_tasks: BackgroundTasks):
    """Reconstruct and download a file from distributed shards"""
    from fastapi.responses import StreamingResponse
    import io
    
    metadata = storage.get_metadata(file_id)
    if not metadata:
        raise HTTPException(404, f"File {file_id} not found")
    
    # Download available shards (skip failed nodes)
    shard_data_list = []
    missing_indices = []
    
    for i, shard_info in enumerate(metadata["shards"]):
        shard_bucket = shard_info.get("bucket", "")
        
        # Check if this shard's node is simulated as failed
        if node_simulator.is_node_failed(shard_bucket):
            missing_indices.append(i)
            shard_data_list.append((i, None))
            print(f"[SIMULATOR] Skipping shard {i} - node {shard_bucket} is simulated as failed")
            continue
        
        try:
            shard_data = storage.download_shard(shard_info["url"])
            shard_data_list.append((i, shard_data))
        except Exception as e:
            print(f"[ERROR] Failed to download shard {i} from {shard_bucket}: {e}")
            missing_indices.append(i)
            shard_data_list.append((i, None))
    
    # Reconstruct file
    try:
        algorithm = metadata.get("algorithm_used") or metadata.get("algorithm")
        config = metadata.get("algorithm_config") or metadata.get("config", {})
        
        if algorithm == "replication":
            # Use any available shard
            reconstructed = None
            for idx, data in shard_data_list:
                if data:
                    reconstructed = data
                    break
            if not reconstructed:
                raise HTTPException(500, "No valid shards available")
                
        elif algorithm == "reed-solomon":
            k = config.get("k", 3)
            m = config.get("m", 2)
            original_size = metadata.get("original_size", 0)
            reconstructed = decode_file(
                shard_data_list, 
                algorithm="reed-solomon", 
                k=k, m=m, 
                original_size=original_size
            )
        else:
            raise HTTPException(500, f"Unknown algorithm: {algorithm}")
        
        # Decompress if needed
        if config.get("compress"):
            reconstructed = decompress_bytes(reconstructed)

        # Create a file-like object from the reconstructed data
        file_like = io.BytesIO(reconstructed)
        
        # Get the original filename
        filename = metadata.get("filename", f"reconstructed_{file_id}")
        
        # Return the file as a streaming download
        return StreamingResponse(
            io.BytesIO(reconstructed),
            media_type="application/octet-stream",
            headers={
                "Content-Disposition": f"attachment; filename=\"{filename}\"",
                "Content-Length": str(len(reconstructed))
            }
        )
        
    except Exception as e:
        raise HTTPException(500, f"Reconstruction failed: {str(e)}")

@app.get("/file/{file_id}/reconstruct-info", tags=["Files"])
async def get_reconstruct_info(file_id: str):
    """Get reconstruction information without downloading the file"""
    metadata = storage.get_metadata(file_id)
    if not metadata:
        raise HTTPException(404, f"File {file_id} not found")
    
    # Check shard availability
    missing_indices = []
    available_shards = 0
    
    for i, shard_info in enumerate(metadata["shards"]):
        shard_bucket = shard_info.get("bucket", "")
        
        # Check if this shard's node is simulated as failed
        if node_simulator.is_node_failed(shard_bucket):
            missing_indices.append(i)
        else:
            try:
                # Quick check if shard is accessible
                import httpx
                async with httpx.AsyncClient(timeout=5.0) as client:
                    response = await client.head(shard_info["url"])
                    if response.status_code == 200:
                        available_shards += 1
                    else:
                        missing_indices.append(i)
            except:
                missing_indices.append(i)
    
    # Determine if reconstruction is possible
    algorithm = metadata.get("algorithm_used") or metadata.get("algorithm")
    config = metadata.get("algorithm_config") or metadata.get("config", {})
    
    if algorithm == "replication":
        needed_shards = 1
    elif algorithm == "reed-solomon":
        needed_shards = config.get("k", 3)
    else:
        needed_shards = 1
    
    can_reconstruct = available_shards >= needed_shards
    
    return {
        "file_id": file_id,
        "filename": metadata.get("filename", "unknown"),
        "algorithm": algorithm,
        "total_shards": len(metadata["shards"]),
        "available_shards": available_shards,
        "missing_shards": missing_indices,
        "needed_shards": needed_shards,
        "can_reconstruct": can_reconstruct,
        "original_size": metadata.get("original_size", 0),
        "download_url": f"/file/{file_id}/reconstruct"
    }

@app.delete("/file/{file_id}", tags=["Files"])
async def delete_file(file_id: str):
    """Delete a specific file and all its shards"""
    metadata = storage.get_metadata(file_id)
    if not metadata:
        raise HTTPException(404, f"File {file_id} not found")
    
    deleted_count = 0
    errors = []

    # Delete shards
    for shard in metadata.get("shards", []):
        try:
            bucket = shard.get("bucket")
            filename = shard.get("filename")
            if bucket and filename:
                success = storage.delete_shard(bucket, f"shards/{filename}")
                if success:
                    deleted_count += 1
                else:
                    errors.append(f"Failed to delete shard {filename}")
        except Exception as e:
            errors.append(f"Error deleting shard: {str(e)}")

    # Delete any remaining shards
    try:
        extra_deleted = storage.delete_shards_by_file_id(file_id)
        deleted_count += extra_deleted
    except Exception as e:
        errors.append(f"Error in cleanup: {str(e)}")

    # Delete metadata
    try:
        storage.delete_metadata(file_id)
    except Exception as e:
        errors.append(f"Error deleting metadata: {str(e)}")

    return {
        "file_id": file_id,
        "status": "deleted",
        "shards_deleted": deleted_count,
        "errors": errors if errors else None
    }

@app.delete("/files", tags=["Files"])
async def delete_all_files():
    """Delete all files and shards from the storage cluster"""
    all_files = storage.list_files_metadata()
    report = {
        "total_files": len(all_files),
        "deleted_files": 0,
        "shards_deleted": 0,
        "errors": []
    }

    for file_entry in all_files:
        try:
            file_id = file_entry.get("id")
            if not file_id:
                continue

            # Delete shards
            deleted_shards = 0
            for shard in file_entry.get("shards", []):
                try:
                    bucket = shard.get("bucket")
                    filename = shard.get("filename")
                    if bucket and filename:
                        success = storage.delete_shard(bucket, f"shards/{filename}")
                        if success:
                            deleted_shards += 1
                except Exception as e:
                    report["errors"].append({"file_id": file_id, "error": str(e)})

            # Cleanup any remaining shards
            try:
                extra_deleted = storage.delete_shards_by_file_id(file_id)
                deleted_shards += extra_deleted
            except Exception as e:
                report["errors"].append({"file_id": file_id, "error": str(e)})

            # Delete metadata
            try:
                storage.delete_metadata(file_id)
            except Exception as e:
                report["errors"].append({"file_id": file_id, "error": str(e)})

            report["deleted_files"] += 1
            report["shards_deleted"] += deleted_shards

        except Exception as e:
            report["errors"].append({"file_entry": file_entry, "error": str(e)})

    return report

async def cleanup_temp_file(filepath: str):
    """Clean up temporary file after delay"""
    await asyncio.sleep(300)  # 5 minutes
    try:
        if os.path.exists(filepath):
            os.remove(filepath)
    except Exception:
        pass

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)