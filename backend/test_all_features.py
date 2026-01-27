
import asyncio
import os
import sys
import json
from datetime import datetime

# Add project root to path
sys.path.append(os.getcwd())

async def test_chat_router():
    print("\n[TEST] LLM Router & Groq...")
    from app.services.llm_router import call_llm
    from app.core.config import settings
    
    payload = {
        "model": settings.GROQ_MODEL,
        "messages": [{"role": "user", "content": "Hi, who are you? Answer in 5 words."}]
    }
    try:
        resp = await call_llm("chat", payload)
        print(f"SUCCESS: {resp['choices'][0]['message']['content']}")
    except Exception as e:
        print(f"FAILED: {e}")

async def test_image_gen():
    print("\n[TEST] Image Generation...")
    import httpx
    import urllib.parse
    from app.core.config import settings
    
    prompt = "A beautiful sunset"
    encoded_prompt = urllib.parse.quote(prompt)
    api_url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?model=flux&nologo=true&private=true"
    headers = {"Authorization": f"Bearer {settings.POLLINATIONS_API_KEY}"}
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(api_url, headers=headers)
            print(f"SUCCESS: Status {resp.status_code}, Length {len(resp.content)}")
    except Exception as e:
        print(f"FAILED: {e}")

async def test_research():
    print("\n[TEST] Internet Research...")
    from app.services.research_service import perform_web_research
    try:
        # Short query to test DDGS
        resp = await perform_web_research("current weather in London")
        print(f"SUCCESS: {resp[:200]}...")
    except Exception as e:
        print(f"FAILED: {e}")

async def test_process_chat():
    print("\n[TEST] process_chat (Full Service Stack)...")
    from app.services.chat_service import process_chat
    from app.schemas.chat import ChatRequest, Message
    from app.database.db import SessionLocal
    from app.models.user import User
    
    db = SessionLocal()
    try:
        user = db.query(User).first()
        if not user:
            print("  FAILED: No users in DB to test with.")
            return
            
        payload = ChatRequest(
            messages=[Message(role="user", content="Test message")],
            model="llama-3.1-8b-instant"
        )
        
        # Test non-streaming
        resp, session_id = await process_chat(payload, user, db, stream=False)
        print(f"  SUCCESS: Session {session_id}, Response: {resp.content[:50]}...")
    except Exception as e:
        import traceback
        print(f"  FAILED: {e}")
        traceback.print_exc()
    finally:
        db.close()

async def run_all():
    print("Starting Global Feature Test...")
    # Initialize DB (optional if already running)
    from app.database.db import engine, Base
    Base.metadata.create_all(bind=engine)
    
    await test_chat_router()
    await test_process_chat()
    await test_research()
    await test_image_gen()
    print("\nTests complete.")

if __name__ == "__main__":
    asyncio.run(run_all())
