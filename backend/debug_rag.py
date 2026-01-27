import os
import sys
import logging
import requests
import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("rag_debugger")

CHROMA_URL = os.getenv("CHROMA_URL", "http://ai-chromadb:8000")
def check_chroma_connection():
    real_url = os.environ.get("CHROMA_URL", "NOT_SET")
    print(f"Env CHROMA_URL: {real_url}")
    print(f"Checking ChromaDB connection at {CHROMA_URL}...")
    try:
        # Check Client logic
        parts = CHROMA_URL.split(":") 
        host = parts[1].replace("//", "")
        port = int(parts[2])
        
        print(f"Connecting to host={host} port={port}")
        client = chromadb.HttpClient(host=host, port=port)
        
        print(f"Client created. Attempting heartbeat...")
        hb = client.heartbeat()
        print(f"Chroma Client Heartbeat: {hb}")
        return True
    except Exception as e:
        print(f"!!! CHROMA EXCEPTION !!!")
        print(e)
        import traceback
        traceback.print_exc()
        return False

# Skip model check to focus on Chroma
def check_embeddings_model():
    return True

if __name__ == "__main__":
    print("Starting RAG Diagnostics...")
    
    chroma_ok = check_chroma_connection()
    
    if chroma_ok:
        print("✅ RAG System seems HEALTHY.")
        sys.exit(0)
    else:
        print("❌ RAG System has ISSUES.")
        sys.exit(1)
