import os
from typing import List, Dict, Optional
from supabase import create_client, Client
from dotenv import load_dotenv
import httpx
from datetime import datetime

load_dotenv()

class SupabaseStorageManager:
    """Manages file storage across Supabase buckets"""
    
    def __init__(self):
        self.url = os.getenv("SUPABASE_URL")
        self.key = os.getenv("SUPABASE_KEY")
        self.service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        
        if not all([self.url, self.key]):
            raise ValueError("Missing Supabase credentials in .env")
        
        # Initialize clients
        self.client = create_client(self.url, self.key)
        self.admin_client = create_client(self.url, self.service_key) if self.service_key else self.client
        
        # Bucket configuration
        self.buckets = os.getenv("STORAGE_BUCKETS", "node-1,node-2,node-3,node-4,node-5").split(",")
        
        # Ensure buckets exist
        self._initialize_buckets()
    
    def _initialize_buckets(self):
        """Create buckets if they don't exist"""
        existing_buckets = self.client.storage.list_buckets()
        existing_names = [b.name for b in existing_buckets]
        
        for bucket_name in self.buckets:
            if bucket_name not in existing_names:
                print(f"Creating bucket: {bucket_name}")
                try:
                    # Note: Using admin client for bucket creation
                    self.admin_client.storage.create_bucket(
                        bucket_name,
                        options={
                            "public": True,
                            "file_size_limit": 52428800,  # 50MB limit per file
                            "allowed_mime_types": ["image/*", "video/*", "application/*", "text/*"]
                        }
                    )
                    print(f"Created bucket: {bucket_name}")
                except Exception as e:
                    print(f"Could not create bucket {bucket_name}: {e}")

    def upload_shard(self, bucket_name: str, shard_data: bytes, 
                    file_id: str, shard_index: int) -> Dict:
        """
        Upload a shard to specific bucket
        
        Returns: Dict with URL and metadata
        """
        # Generate unique filename
        filename = f"{file_id}_shard_{shard_index:03d}.cosm"
        filepath = f"shards/{filename}"
        
        try:
            # Upload to Supabase Storage
            response = self.client.storage.from_(bucket_name).upload(
                filepath,
                shard_data,
                file_options={"content-type": "application/octet-stream"}
            )
            
            # Get public URL
            url = self.client.storage.from_(bucket_name).get_public_url(filepath)
            
            return {
                "bucket": bucket_name,
                "filename": filename,
                "url": url,
                "size": len(shard_data),
                "uploaded_at": datetime.utcnow().isoformat(),
                "shard_index": shard_index
            }
            
        except Exception as e:
            print(f"Error uploading to {bucket_name}: {e}")
            # Try with admin client if regular fails
            try:
                response = self.admin_client.storage.from_(bucket_name).upload(
                    filepath,
                    shard_data
                )
                url = self.admin_client.storage.from_(bucket_name).get_public_url(filepath)
                
                return {
                    "bucket": bucket_name,
                    "filename": filename,
                    "url": url,
                    "size": len(shard_data),
                    "uploaded_at": datetime.utcnow().isoformat(),
                    "shard_index": shard_index
                }
            except Exception as e2:
                raise Exception(f"Failed to upload to {bucket_name}: {e2}")
    
    def download_shard(self, shard_url: str) -> bytes:
        """Download a shard from its URL"""
        try:
            response = httpx.get(shard_url)
            response.raise_for_status()
            return response.content
        except Exception as e:
            print(f"Error downloading shard: {e}")
            raise
    
    def delete_shard(self, bucket_name: str, filepath: str):
        """Delete a shard from storage"""
        try:
            self.client.storage.from_(bucket_name).remove([filepath])
            return True
        except Exception as e:
            print(f"Error deleting shard: {e}")
            return False
    
    def get_bucket_status(self) -> Dict:
        """Check status of all buckets"""
        status = {}
        
        for bucket_name in self.buckets:
            try:
                # Try to list files to check if bucket is accessible
                files = self.client.storage.from_(bucket_name).list()
                status[bucket_name] = {
                    "status": "online",
                    "file_count": len(files),
                    "capacity": "unknown"  # Supabase doesn't expose this
                }
            except Exception as e:
                status[bucket_name] = {
                    "status": "offline",
                    "error": str(e),
                    "file_count": 0
                }
        
        return status
    
    def store_metadata(self, file_id: str, metadata: Dict) -> bool:
        """Store file metadata in database"""
        try:
            data = {
                "id": file_id,
                "filename": metadata.get("filename", ""),
                "original_size": metadata.get("original_size", 0),
                "algorithm_used": metadata.get("algorithm", ""),
                "algorithm_config": metadata.get("config", {}),
                "shards": metadata.get("shards", []),
                "cost_estimate": metadata.get("cost_estimate", 0),
                "user_id": metadata.get("user_id", "demo")
            }
            self.client.table("files").insert(data).execute()
            return True
        except Exception as e:
            print(f"Error storing metadata: {e}")
            return False
    
    def get_metadata(self, file_id: str) -> Optional[Dict]:
        """Retrieve file metadata from database"""
        try:
            response = self.client.table("files").select("*").eq("id", file_id).execute()
            if response.data:
                return response.data[0]
        except Exception:
            pass
        
        # Try admin client if regular client fails
        try:
            response = self.admin_client.table("files").select("*").eq("id", file_id).execute()
            if response.data:
                return response.data[0]
        except Exception:
            pass
        
        return None

    def list_files_metadata(self) -> List[Dict]:
        """Fetch all file metadata from the database"""
        try:
            response = self.client.table("files").select("*").execute()
            if response.data:
                return self._normalize_file_records(response.data)
        except Exception:
            pass
        
        # Try admin client if regular client fails
        try:
            response = self.admin_client.table("files").select("*").execute()
            if response.data:
                return self._normalize_file_records(response.data)
        except Exception:
            pass
        
        return []
    
    def _normalize_file_records(self, records: List[Dict]) -> List[Dict]:
        """Normalize file records to consistent format"""
        normalized = []
        for rec in records:
            algo = rec.get("algorithm") or rec.get("algorithm_used")
            
            # Handle config data - it might be stored as JSON string
            cfg = rec.get("config") or rec.get("algorithm_config") or {}
            if isinstance(cfg, str):
                try:
                    import json
                    cfg = json.loads(cfg)
                except:
                    cfg = {}
            elif not isinstance(cfg, dict):
                cfg = {}
            
            # Handle shards data - it might be stored as JSON string
            shards = rec.get("shards") or []
            if isinstance(shards, str):
                try:
                    import json
                    shards = json.loads(shards)
                except:
                    shards = []
            elif not isinstance(shards, list):
                shards = []
            
            # Ensure each shard has the required fields
            processed_shards = []
            for shard in shards:
                if isinstance(shard, dict):
                    processed_shards.append({
                        "bucket": shard.get("bucket", ""),
                        "filename": shard.get("filename", ""),
                        "url": shard.get("url", ""),
                        "size": shard.get("size", 0),
                        "shard_index": shard.get("shard_index", 0),
                        "uploaded_at": shard.get("uploaded_at", "")
                    })
            
            normalized.append({
                "id": rec.get("id"),
                "filename": rec.get("filename") or rec.get("id"),
                "original_size": rec.get("original_size") or rec.get("size") or 0,
                "algorithm": algo,
                "config": cfg,
                "shards": processed_shards,
                "cost_estimate": rec.get("cost_estimate"),
                "uploaded_at": rec.get("created_at") or rec.get("uploaded_at")
            })
        return normalized

    def delete_metadata(self, file_id: str):
        """Delete file metadata from the database"""
        try:
            self.client.table("files").delete().eq("id", file_id).execute()
        except Exception as e:
            # Try admin client if regular client fails
            try:
                self.admin_client.table("files").delete().eq("id", file_id).execute()
            except Exception as e2:
                raise Exception(f"Failed to delete metadata: {e2}")

    def delete_shards_by_file_id(self, file_id: str) -> int:
        """Delete all shards across buckets matching a given file_id. Returns number deleted."""
        deleted = 0
        for bucket in self.buckets:
            try:
                # list files under shards/ and delete those that match the file_id prefix
                files = self.client.storage.from_(bucket).list(path="shards")
                if not files:
                    files = self.client.storage.from_(bucket).list()
                # files may be list of objects with 'name' or simple strings depending on SDK
                names = []
                for f in files:
                    if isinstance(f, dict) and f.get("name"):
                        names.append(f.get("name"))
                    elif hasattr(f, "name"):
                        names.append(getattr(f, "name"))
                    elif isinstance(f, str):
                        names.append(f)

                targets = [n for n in names if n.startswith(f"{file_id}_shard_")]
                # Prepend path if the list returns base names
                targets = ["shards/" + t if not t.startswith("shards/") else t for t in targets]
                if targets:
                    # remove expects list of paths relative to bucket root
                    self.client.storage.from_(bucket).remove(targets)
                    deleted += len(targets)
            except Exception as e:
                print(f"Error while deleting shards in {bucket}: {e}")
                # try admin client fallback
                try:
                    files = self.admin_client.storage.from_(bucket).list(path="shards")
                    if not files:
                        files = self.admin_client.storage.from_(bucket).list()
                    names = []
                    for f in files:
                        if isinstance(f, dict) and f.get("name"):
                            names.append(f.get("name"))
                        elif hasattr(f, "name"):
                            names.append(getattr(f, "name"))
                        elif isinstance(f, str):
                            names.append(f)
                    targets = [n for n in names if n.startswith(f"{file_id}_shard_")]
                    targets = ["shards/" + t if not t.startswith("shards/") else t for t in targets]
                    if targets:
                        self.admin_client.storage.from_(bucket).remove(targets)
                        deleted += len(targets)
                except Exception as e2:
                    print(f"Admin fallback failed for {bucket}: {e2}")
        return deleted