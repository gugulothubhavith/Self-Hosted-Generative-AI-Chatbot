from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import asyncio
import logging
import json
from app.services.agent_service import run_orchestration

router = APIRouter(prefix="/ws", tags=["WebSocket"])
logger = logging.getLogger(__name__)

@router.websocket("/code/squad")
async def websocket_code_squad(websocket: WebSocket):
    await websocket.accept()
    logger.info("Code Squad WebSocket connected")
    
    # Lock to prevent concurrent writes causing crashes
    write_lock = asyncio.Lock()
    
    try:
        # 1. Receive initial task
        data = await websocket.receive_json()
        prompt = data.get("prompt")
        
        if not prompt:
            async with write_lock:
                await websocket.send_text("Error: No prompt provided")
            await websocket.close()
            return

        # 2. Define callback to send updates over WS
        async def stream_callback(msg: str):
            try:
                # Concurrent writes to WebSocket are not allowed in Starlette/FastAPI
                async with write_lock:
                    await websocket.send_text(msg)
            except Exception as e:
                logger.error(f"Failed to send update: {e}")

        # 3. Run orchestration with callback
        result = await run_orchestration(prompt, stream_callback=stream_callback)
        
        # 4. Send final combined result
        async with write_lock:
            await websocket.send_text("\n---\n")
            await websocket.send_text(result)
        
    except WebSocketDisconnect:
        logger.info("Code Squad WebSocket disconnected")
    except Exception as e:
        logger.error(f"Code Squad error: {e}", exc_info=True)
        try:
            async with write_lock:
                await websocket.send_text(f"\n❌ **Fatal Error**: {str(e)}")
        except:
            pass
    finally:
        try:
            await websocket.close()
        except:
            pass
