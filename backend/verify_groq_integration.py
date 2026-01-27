import asyncio
import httpx
import json
import os
import sys

# Add backend to path to import config if needed, or just mock the call
# Since we want to test the actual running service if possible, 
# but we can also test the function directly in a script.

from app.services.llm_router import call_llm
from app.core.config import settings

async def verify_groq():
    print("Testing Groq Integration via llm_router...")
    
    # Payload for the new model
    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [{"role": "user", "content": "Tell me a very short joke."}]
    }
    
    try:
        # We call the function directly to see if it routes and authenticated correctly
        response = await call_llm("chat", payload, stream=False)
        print("Response received successfully!")
        print(f"Model used: {response.get('model')}")
        content = response.get('choices', [{}])[0].get('message', {}).get('content', '')
        print(f"AI: {content}")
        
        if response.get('model') == "llama-3.3-70b-versatile":
            print("\n✅ VERIFICATION SUCCESS: Correct model used and response received.")
        else:
            print("\n❌ VERIFICATION FAILED: Unexpected model returned.")
            
    except Exception as e:
        print(f"\n❌ ERROR during verification: {e}")

if __name__ == "__main__":
    # Ensure CWD is backend for relative imports or PYTHONPATH is set
    # For this test, we assume we are running in a way that 'app' is importable
    asyncio.run(verify_groq())
