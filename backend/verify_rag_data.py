import os
import sys
import logging
import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("rag_verifier")

CHROMA_URL = os.environ.get("CHROMA_URL", "http://chromadb:8000")
EMBEDDINGS_MODEL = "BAAI/bge-small-en-v1.5"

def inspect_chroma():
    try:
        parts = CHROMA_URL.split(":") 
        host = parts[1].replace("//", "")
        port = int(parts[2])
        
        client = chromadb.HttpClient(host=host, port=port)
        
        # List Collections
        collections = client.list_collections()
        logger.info(f"Found {len(collections)} collections.")
        
        for col in collections:
            logger.info(f"Processing Collection: {col.name}")
            count = col.count()
            logger.info(f"  - Document Count: {count}")
            
            if count > 0:
                peek = col.peek(limit=2)
                logger.info(f"  - Peek IDs: {peek['ids']}")
                logger.info(f"  - Peek Metadata: {peek['metadatas']}")
                
                # Test Query
                model = SentenceTransformer(EMBEDDINGS_MODEL)
                q_emb = model.encode("summary").tolist()
                res = col.query(query_embeddings=[q_emb], n_results=1)
                logger.info(f"  - Test Query 'summary': {len(res['documents'][0])} matches")
                logger.info(f"  - Top Result: {res['documents'][0][0][:50]}...")
            else:
                logger.warning("  - Collection is EMPTY.")
                
    except Exception as e:
        logger.error(f"Inspection Failed: {e}", exc_info=True)

if __name__ == "__main__":
    inspect_chroma()
