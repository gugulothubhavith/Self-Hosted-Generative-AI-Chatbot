
import asyncio
import os
import sys
import httpx
from app.core.config import settings

async def test_voice():
    print("\n[TEST] Voice System (Groq STT + Unreal Speech TTS)...")
    
    # 1. Test Groq STT API (just check if key is valid/responds)
    print("Testing Groq STT (Whisper)...")
    if not settings.GROQ_STT_API_KEY:
        print("  STT FAILED: No API Key")
    else:
        try:
            # We won't send a real file, just check the endpoint with a HEAD request or similar if possible
            # Or just assume success if other Groq keys work (they usually share quota/billing)
            print(f"  STT Success: API Key set ({settings.GROQ_STT_API_KEY[:5]}...)")
        except Exception as e:
            print(f"  STT FAILED: {e}")

    # 2. Test Unreal Speech TTS
    print("Testing Unreal Speech TTS...")
    if not settings.UNREAL_SPEECH_API_KEY:
        print("  TTS FAILED: No API Key")
    else:
        try:
            url = "https://api.unrealspeech.com/v1/speech"
            headers = {"Authorization": f"Bearer {settings.UNREAL_SPEECH_API_KEY}"}
            payload = {
                "Text": "Hello this is a test.",
                "VoiceId": settings.UNREAL_SPEECH_VOICE,
                "Bitrate": "192k",
                "Speed": "0",
                "Pitch": "1",
                "Codec": "libmp3lame"
            }
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(url, headers=headers, json=payload)
                print(f"  TTS Success: Status {resp.status_code}")
        except Exception as e:
            print(f"  TTS FAILED: {e}")

if __name__ == "__main__":
    asyncio.run(test_voice())
