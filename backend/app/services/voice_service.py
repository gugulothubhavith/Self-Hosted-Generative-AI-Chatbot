import os
import logging
import requests
import httpx
from faster_whisper import WhisperModel
from app.core.config import settings

logger = logging.getLogger(__name__)

# Fallback Local Whisper Config
MODEL_SIZE = os.getenv("WHISPER_MODEL_SIZE", "medium") 
DEVICE = "cpu"
COMPUTE_TYPE = "int8"

_model_instance = None

def get_local_model():
    global _model_instance
    if _model_instance is None:
        logger.info(f"Loading local Whisper model: {MODEL_SIZE} on {DEVICE}...")
        try:
            _model_instance = WhisperModel(MODEL_SIZE, device=DEVICE, compute_type=COMPUTE_TYPE)
        except Exception as e:
            logger.error(f"Failed to load local Whisper model: {e}")
            raise e
    return _model_instance

async def transcribe_audio(file_path: str) -> str:
    """Transcribe audio using Groq STT with local fallback."""
    if settings.GROQ_STT_API_KEY:
        try:
            logger.info(f"Transcribing {file_path} via Groq API...")
            url = "https://api.groq.com/openai/v1/audio/transcriptions"
            headers = {"Authorization": f"Bearer {settings.GROQ_STT_API_KEY}"}
            
            async with httpx.AsyncClient(timeout=60.0) as client:
                with open(file_path, "rb") as f:
                    files = {"file": (os.path.basename(file_path), f, "audio/wav")}
                    data = {"model": settings.GROQ_STT_MODEL, "response_format": "json"}
                    response = await client.post(url, headers=headers, files=files, data=data)
                    response.raise_for_status()
                    return response.json().get("text", "")
        except Exception as e:
            logger.error(f"Groq Transcription failed: {e}. Falling back to local...")

    # Local Fallback
    try:
        model = get_local_model()
        logger.info(f"Transcribing {file_path} locally...")
        segments, info = model.transcribe(file_path, beam_size=5)
        text = " ".join([s.text for s in segments])
        return text.strip()
    except Exception as e:
        logger.error(f"Local Transcription failed: {e}")
        return "[Error: Voice Transcription failed]"

async def synthesize_speech(text: str, voice_id: str = None) -> bytes:
    """Synthesize speech using Unreal Speech V8 TTS."""
    if not settings.UNREAL_SPEECH_API_KEY:
        raise Exception("Unreal Speech API Key missing")
        
    voice_id = voice_id or settings.UNREAL_SPEECH_VOICE
        
    url = "https://api.v8.unrealspeech.com/stream"
    headers = {
        "Authorization": f"Bearer {settings.UNREAL_SPEECH_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "Text": text,
        "VoiceId": voice_id,
        "Bitrate": "192k",
        "Speed": 0,
        "Pitch": 1.0
    }
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            logger.info(f"Synthesizing speech via Unreal Speech V8: {text[:30]}...")
            response = await client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            return response.content
        except Exception as e:
            logger.error(f"Unreal Speech V8 TTS failed: {e}")
            raise e
