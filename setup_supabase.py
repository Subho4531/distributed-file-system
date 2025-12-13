#!/usr/bin/env python3
"""
Setup script for COSMEON Supabase Storage
Run this first to initialize your buckets
"""
import os
from storage_manager import SupabaseStorageManager
from dotenv import load_dotenv

load_dotenv()

def main():
    print("🚀 COSMEON Supabase Storage Setup")
    print("=" * 50)
    
    # Check environment variables
    required_vars = ["SUPABASE_URL", "SUPABASE_KEY"]
    missing = [var for var in required_vars if not os.getenv(var)]
    
    if missing:
        print("❌ Missing environment variables:")
        for var in missing:
            print(f"  - {var}")
        print("\nPlease create a .env file with:")
        print("SUPABASE_URL=your-project-url")
        print("SUPABASE_KEY=your-anon-key")
        return
    
    print("✓ Environment variables loaded")
    
    # Initialize storage manager (will create buckets)
    try:
        storage = SupabaseStorageManager()
        print("✓ Storage manager initialized")
        
        # Check bucket status
        print("\n📦 Bucket Status:")
        print("-" * 30)
        
        status = storage.get_bucket_status()
        for bucket, info in status.items():
            status_icon = "🟢" if info["status"] == "online" else "🔴"
            print(f"{status_icon} {bucket}: {info['status']} ({info['file_count']} files)")
        
        print("\n✅ Setup complete!")
        print(f"\n🎯 Your API will use {len(storage.buckets)} storage nodes")
        print("🔗 Start your FastAPI server with: uvicorn main:app --reload")
        
    except Exception as e:
        print(f"❌ Setup failed: {e}")

if __name__ == "__main__":
    main()