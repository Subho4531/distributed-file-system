# COSMEON Distributed Storage API Endpoints

## 🚀 Overview
The COSMEON API provides intelligent distributed file storage with erasure coding and replication across multiple storage nodes.

**Base URL:** `http://localhost:8000`

---

## 📋 API Endpoints

### Health & System Status

#### `GET /`
**Health Check & Service Information**
- **Description:** Get API status and system information
- **Tags:** Health
- **Response:**
```json
{
  "service": "COSMEON Distributed Storage API",
  "version": "1.0.0", 
  "status": "operational",
  "storage_nodes": 5,
  "algorithms": ["replication", "reed-solomon"],
  "policies": ["balanced", "cost", "reliability", "eco"]
}
```

#### `GET /nodes/status`
**Storage Node Status**
- **Description:** Get health and status of all storage nodes
- **Tags:** Nodes
- **Response:**
```json
{
  "total_nodes": 5,
  "online_nodes": 5,
  "nodes": [
    {
      "node_id": "node-1",
      "status": "online",
      "files_count": 12,
      "capacity": "50GB",
      "last_checked": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

### File Operations

#### `POST /upload`
**Upload File with Intelligent Distribution**
- **Description:** Upload a file with automatic or manual algorithm selection
- **Tags:** Files
- **Parameters:**
  - `file` (required): File to upload (multipart/form-data)
  - `algorithm` (optional): Storage algorithm ("replication", "reed-solomon", "auto")
  - `policy` (optional): Selection policy ("balanced", "cost", "reliability", "eco")
- **Response:**
```json
{
  "file_id": "uuid-string",
  "algorithm": "reed-solomon",
  "shards": [
    {
      "bucket": "node-1",
      "filename": "uuid_shard_000.cosm",
      "url": "https://...",
      "size": 1024,
      "shard_index": 0
    }
  ],
  "storage_cost": 1.67,
  "can_survive_failures": 2
}
```

#### `GET /files`
**List All Files**
- **Description:** Get metadata for all uploaded files
- **Tags:** Files
- **Response:**
```json
[
  {
    "id": "file-uuid",
    "filename": "document.pdf",
    "original_size": 2048576,
    "algorithm": "reed-solomon",
    "config": {"k": 4, "m": 2},
    "shards": [...],
    "cost_estimate": 1.67,
    "uploaded_at": "2024-01-15T10:30:00Z"
  }
]
```

#### `GET /file/{file_id}/status`
**File Health Status**
- **Description:** Get detailed health and shard status for a specific file
- **Tags:** Files
- **Parameters:**
  - `file_id` (path): File UUID
- **Response:**
```json
{
  "file_id": "uuid-string",
  "filename": "document.pdf",
  "algorithm": "reed-solomon",
  "shard_status": [
    {
      "shard_index": 0,
      "bucket": "node-1", 
      "status": "online",
      "size": 1024
    }
  ],
  "online_shards": 6,
  "needed_shards": 4,
  "reconstructable": true,
  "health": "healthy"
}
```

#### `GET /file/{file_id}/reconstruct`
**Reconstruct File**
- **Description:** Reconstruct and prepare file for download from distributed shards
- **Tags:** Files
- **Parameters:**
  - `file_id` (path): File UUID
- **Response:**
```json
{
  "file_id": "uuid-string",
  "filename": "document.pdf",
  "reconstructed_size": 2048576,
  "missing_shards": [2, 5],
  "reconstruction_time": "2024-01-15T10:35:00Z",
  "temp_path": "/tmp/reconstructed_uuid_document.pdf"
}
```

#### `DELETE /file/{file_id}`
**Delete Specific File**
- **Description:** Delete a file and all its distributed shards
- **Tags:** Files
- **Parameters:**
  - `file_id` (path): File UUID
- **Response:**
```json
{
  "file_id": "uuid-string",
  "status": "deleted",
  "shards_deleted": 6,
  "errors": null
}
```

#### `DELETE /files`
**Delete All Files**
- **Description:** Delete all files and shards from the storage cluster
- **Tags:** Files
- **Response:**
```json
{
  "total_files": 25,
  "deleted_files": 25,
  "shards_deleted": 150,
  "errors": []
}
```

---

## 🔧 Storage Algorithms

### Replication
- **Description:** Simple data replication across multiple nodes
- **Overhead:** 3-4x storage space
- **Failure Tolerance:** Can survive (replication_factor - 1) node failures
- **Best For:** Small critical files, high availability requirements

### Reed-Solomon Erasure Coding
- **Description:** Advanced erasure coding with k data blocks + m parity blocks
- **Overhead:** ~1.67-2x storage space (depending on k/m ratio)
- **Failure Tolerance:** Can survive up to m node failures
- **Best For:** Large files, balanced cost/reliability

---

## 📊 Storage Policies

### Balanced (Default)
- **Small files (<10MB):** Replication
- **Medium files (<1GB):** Reed-Solomon (k=4, m=2)
- **Large files (>1GB):** Reed-Solomon with compression

### Cost/Eco
- **Focus:** Minimize storage costs
- **Strategy:** Aggressive compression, efficient algorithms
- **Trade-off:** Slightly higher CPU usage for compression

### Reliability
- **Focus:** Maximum data protection
- **Strategy:** Higher replication factors, more parity blocks
- **Trade-off:** Higher storage costs

---

## 🚨 Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request (invalid algorithm, empty file) |
| 404 | File Not Found |
| 500 | Internal Server Error (reconstruction failed, storage error) |

---

## 📝 Usage Examples

### Upload with Auto Algorithm Selection
```bash
curl -X POST "http://localhost:8000/upload" \
  -F "file=@document.pdf" \
  -F "policy=balanced"
```

### Upload with Specific Algorithm
```bash
curl -X POST "http://localhost:8000/upload" \
  -F "file=@video.mp4" \
  -F "algorithm=reed-solomon" \
  -F "policy=reliability"
```

### Check File Status
```bash
curl "http://localhost:8000/file/uuid-string/status"
```

### List All Files
```bash
curl "http://localhost:8000/files"
```

### Reconstruct File
```bash
curl "http://localhost:8000/file/uuid-string/reconstruct"
```

---

## 🎯 Key Features

- **Intelligent Algorithm Selection:** Automatic choice based on file characteristics
- **Multiple Storage Policies:** Balanced, cost-optimized, reliability-focused
- **Real-time Health Monitoring:** Track shard availability and file reconstructability
- **Failure Tolerance:** Survive multiple node failures depending on algorithm
- **Compression Support:** Optional compression for storage efficiency
- **Clean API Design:** RESTful endpoints with comprehensive error handling

The API is designed for high availability distributed storage with intelligent data placement and robust failure recovery capabilities.