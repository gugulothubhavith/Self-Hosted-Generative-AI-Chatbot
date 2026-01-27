
import asyncio
import os
import sys
from app.services.llm_router import call_llm
from app.core.config import settings

async def test_multi_agent():
    print("\n[TEST] Multi-Agent System...")
    
    # 1. Test Planner
    print("Testing Planner (Groq)...")
    planner_payload = {
        "model": settings.PLANNER_MODEL,
        "messages": [{"role": "user", "content": "Tell me a joke."}]
    }
    try:
        resp = await call_llm("chat", planner_payload)
        print(f"  Planner Success: {resp['choices'][0]['message']['content'][:50]}...")
    except Exception as e:
        print(f"  Planner FAILED: {e}")

    # 2. Test Coder (OpenRouter/DeepSeek)
    print("Testing Coder (OpenRouter/DeepSeek)...")
    coder_payload = {
        "model": settings.CODER_MODEL,
        "messages": [{"role": "user", "content": "print('hello world')"}]
    }
    try:
        resp = await call_llm("chat", coder_payload)
        print(f"  Coder Success: {resp['choices'][0]['message']['content'][:50]}...")
    except Exception as e:
        print(f"  Coder FAILED: {e}")

if __name__ == "__main__":
    asyncio.run(test_multi_agent())
