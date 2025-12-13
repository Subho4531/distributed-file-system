# COSMEON Orbital Data Layer 🌌

**A Fault-Tolerant Distributed Storage System with Intelligent Erasure Coding**

[![Python](https://img.shields.io/badge/Python-3.9+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104-green.svg)](https://fastapi.tiangolo.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Storage-purple.svg)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 🎯 Overview

COSMEON is a distributed storage system that splits files into encoded shards and distributes them across multiple storage nodes. Even if some nodes fail, the original file can be completely reconstructed from the remaining shards. This system implements **erasure coding** with intelligent algorithm selection to balance storage efficiency, performance, and cost.

## ✨ Features

- **🧩 Intelligent Erasure Coding**: Automatically selects between Reed-Solomon, XOR-Parity, or Replication based on file characteristics
- **🛡️ Fault Tolerance**: Files can survive node failures (configurable from 1 to n nodes)
- **📊 Smart Analytics**: Analyzes files to choose optimal storage strategy
- **🌐 Distributed Storage**: Uses Supabase Storage as distributed nodes
- **🚀 FastAPI Backend**: RESTful API for all operations
- **🖥️ Rich CLI**: Beautiful terminal interface with progress bars and color-coded status
- **📈 Cost Optimization**: Estimates storage costs and suggests optimizations

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    CLI Client   │────▶│  FastAPI Engine │────▶│  Storage Grid   │
│  (Typer/Rich)   │◀────│  (Python)       │◀────│  (5 Supabase    │
│                 │     │                 │     │    Buckets)     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
       │                         │                         │
       │                         │                         │
       ▼                         ▼                         ▼
 User Commands          Algorithm Selection          Shard Distribution
   • upload             • File Analysis              • node-1
   • reconstruct        • Reed-Solomon               • node-2  
   • status             • XOR-Parity                 • node-3
   • simulate-failure   • Replication                • node-4
                                                 • node-5
```

## 📦 Storage Nodes Configuration

The system uses **5 Supabase Storage buckets** to simulate a distributed storage grid:

| Node | Bucket Name | Role | Purpose |
|------|-------------|------|---------|
| 🟢 Node 1 | `node-1` | Primary | Stores data shards |
| 🟢 Node 2 | `node-2` | Primary | Stores data shards |
| 🟢 Node 3 | `node-3` | Primary | Stores data shards |
| 🟡 Node 4 | `node-4` | Parity | Stores parity/backup shards |
| 🟡 Node 5 | `node-5` | Parity | Stores parity/backup shards |

**Default Encoding**: Reed-Solomon (3,2) scheme:
- **3 data shards** (minimum needed for reconstruction)
- **2 parity shards** (can lose any 2 nodes)
- **Storage overhead**: 167% (5/3 = 1.67x original size)

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- [Supabase](https://supabase.com) account (free tier)
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/cosmeon.git
cd cosmeon
```

### 2. Set Up Supabase
1. Create a new project at [supabase.com](https://supabase.com)
2. Create 5 storage buckets: `node-1`, `node-2`, `node-3`, `node-4`, `node-5`
3. Make all buckets **public** (for demo purposes)
4. Copy your project credentials

### 3. Configure Environment
```bash
# Copy the example env file
cp .env.example .env

# Edit .env with your Supabase credentials
nano .env
```

Your `.env` should contain:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Storage configuration
STORAGE_BUCKETS=node-1,node-2,node-3,node-4,node-5
DEFAULT_ALGORITHM=reed-solomon
```

### 4. Install Dependencies
```bash
pip install -r requirements.txt
```

### 5. Initialize Storage
```bash
python setup_supabase.py
```

### 6. Start the Server
```bash
uvicorn main:app --reload
```
The API will be available at `http://localhost:8000`

### 7. Use the CLI
```bash
# Upload a file
cosmeon upload sample.jpg

# Upload with specific algorithm
cosmeon upload backup.zip --algorithm=reed-solomon

# Check file status
cosmeon status <file_id>

# Reconstruct a file
cosmeon reconstruct <file_id> --output=recovered.jpg

# Simulate node failure (demo)
cosmeon simulate-failure node-2
```

## 📖 API Reference

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Health check and system info |
| `GET` | `/nodes/status` | Check status of all storage nodes |
| `POST` | `/upload` | Upload a file with smart encoding |
| `GET` | `/file/{file_id}/status` | Check reconstruction status of a file |
| `GET` | `/file/{file_id}/reconstruct` | Reconstruct file from shards |
| `GET` | `/analytics` | System analytics and cost breakdown |

### Upload a File
```bash
curl -X POST \
  -F "file=@document.pdf" \
  -F "algorithm=reed-solomon" \
  http://localhost:8000/upload
```

Response:
```json
{
  "file_id": "550e8400-e29b-41d4-a716-446655440000",
  "algorithm": "reed-solomon",
  "shards": [
    {"bucket": "node-1", "url": "...", "size": 10240},
    {"bucket": "node-2", "url": "...", "size": 10240},
    {"bucket": "node-3", "url": "...", "size": 10240},
    {"bucket": "node-4", "url": "...", "size": 10240},
    {"bucket": "node-5", "url": "...", "size": 10240}
  ],
  "storage_cost": 0.00045,
  "can_survive_failures": 2
}
```

## 🧠 Smart Algorithm Selection

COSMEON analyzes each file to choose the optimal storage strategy:

### Algorithms Available

| Algorithm | Use Case | Overhead | Fault Tolerance | Best For |
|-----------|----------|----------|-----------------|----------|
| **Replication** | Hot data, small files | 300% (3x) | 2/5 nodes | Logs, databases, temp files |
| **Reed-Solomon** | Cold data, large files | 167% (1.67x) | ANY 2 nodes | Backups, archives, videos |
| **XOR-Parity** | Balanced needs | 200% (2x) | SOME 2 nodes | Images, documents, mixed use |

### Decision Factors
- **File size**: Small → Replication, Large → Reed-Solomon
- **File type**: Media → XOR-Parity, Archives → Reed-Solomon
- **Access pattern**: Hot → Replication, Cold → Reed-Solomon
- **Criticality**: High → Replication, Low → Reed-Solomon

## 🔧 Advanced Usage

### Custom Algorithm Parameters
```bash
# Reed-Solomon with custom parameters (k=4, m=3)
cosmeon upload data.bin --algorithm=reed-solomon --k=4 --m=3

# Replication with 5 copies
cosmeon upload critical.log --algorithm=replication --factor=5

# XOR-Parity with 4 data + 3 parity shards
cosmeon upload dataset.csv --algorithm=xor-parity --data=4 --parity=3
```

### Policy-Based Upload
```bash
# Use cost-optimization policy
cosmeon upload archive.tar.gz --policy=cost

# Use performance-optimization policy  
cosmeon upload video.mp4 --policy=performance

# Use balanced policy (default)
cosmeon upload document.pdf --policy=balanced
```

### System Analytics
```bash
# Get storage analytics
cosmeon analytics

# Check individual file efficiency
cosmeon analyze <file_id>
```

## 🧪 Demonstration: Fault Tolerance

1. **Upload a file:**
```bash
cosmeon upload important_document.pdf
```

2. **Check where shards are stored:**
```bash
cosmeon status <file_id>
```
Output shows shards distributed across 5 nodes.

3. **Simulate node failures:**
```bash
# Simulate node-2 going offline
cosmeon simulate-failure node-2

# Simulate another failure
cosmeon simulate-failure node-5
```

4. **Reconstruct the file:**
```bash
# Even with 2 nodes down, we can reconstruct!
cosmeon reconstruct <file_id> --output=recovered.pdf
```

The system successfully reconstructs the file using the remaining 3 shards!

## 📊 Performance Characteristics

| Operation | Replication | Reed-Solomon | XOR-Parity |
|-----------|-------------|--------------|------------|
| **Upload Speed** | ⚡⚡⚡⚡⚡ | ⚡⚡⚡ | ⚡⚡⚡⚡ |
| **Download Speed** | ⚡⚡⚡⚡⚡ | ⚡⚡ | ⚡⚡⚡⚡ |
| **Reconstruction** | ⚡⚡⚡⚡⚡ | ⚡ | ⚡⚡⚡ |
| **Storage Efficiency** | ⚡ | ⚡⚡⚡⚡⚡ | ⚡⚡⚡ |
| **Fault Tolerance** | ⚡⚡⚡⚡ | ⚡⚡⚡⚡⚡ | ⚡⚡⚡⚡ |

## 🗂️ Project Structure

```
cosmeon/
├── main.py                 # FastAPI server
├── cli.py                  # Command-line interface
├── storage_manager.py      # Supabase storage operations
├── smart_engine.py         # Intelligent algorithm selection
├── algorithms.py           # Encoding/decoding implementations
├── setup_supabase.py       # Initialization script
├── requirements.txt        # Python dependencies
├── .env.example           # Environment template
├── config.yaml            # System configuration
└── README.md              # This file
```

## 🔐 Security Considerations

> **Note**: This is a demonstration system. For production use:

1. **Don't use public buckets** - Implement signed URLs
2. **Add authentication** - Use Supabase Auth or JWT
3. **Encrypt sensitive data** - Encrypt before encoding
4. **Implement rate limiting** - Prevent abuse
5. **Use private endpoints** - Don't expose admin functions

## 🚧 Limitations

- **File Size**: Supabase free tier limits files to 50MB
- **Total Storage**: 5GB limit on free tier
- **Public Access**: Buckets are public for demo purposes
- **Node Count**: Fixed at 5 nodes in this implementation

## 📈 Scaling Beyond 5 Nodes

For production with more nodes, see our [Scaling Guide](docs/SCALING.md) which covers:
- Dynamic node allocation (10-100+ nodes)
- Multiple storage providers
- Geographic distribution
- Cost-tiered storage
- Automatic rebalancing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Reed-Solomon implementation: `reedsolo` library
- Storage: Supabase
- CLI: Typer + Rich
- API Framework: FastAPI
- Inspired by: RAID systems, Erasure Coding in distributed storage
