
import asyncio
import os
from app.services.rag_service import get_chroma_client, list_documents

async def test_rag_system():
    print("\n[TEST] RAG System (ChromaDB + Voyage)...")
    try:
        # 1. Test Connection
        print("Connecting to ChromaDB...")
        collection = get_chroma_client()
        print(f"  ChromaDB Success: Collection '{collection.name}' is ready.")
        
        # 2. Test List Documents
        print("Listing documents...")
        docs = list_documents()
        print(f"  List Success: Found {len(docs)} documents.")
    except Exception as e:
        print(f"  RAG system FAILED: {e}")

if __name__ == "__main__":
    asyncio.run(test_rag_system())
