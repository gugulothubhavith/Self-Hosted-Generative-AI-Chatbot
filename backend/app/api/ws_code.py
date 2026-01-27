from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
import asyncio
import logging
import docker
import json
import io
import tarfile
from app.core.deps import get_current_user
from app.services.sandbox_service import LANGUAGE_CONFIG, _create_tar_code
from app.core.config import settings

router = APIRouter(prefix="/ws", tags=["WebSocket"])
logger = logging.getLogger(__name__)

@router.websocket("/code/execute")
async def websocket_code_execute(websocket: WebSocket):
    logger.info("New WebSocket connection request")
    await websocket.accept()
    logger.info("WebSocket accepted")
    client = None
    container_id = None
    
    try:
        # 1. Initialize Docker Client
        try:
            client = docker.APIClient(base_url='unix://var/run/docker.sock')
            v = client.version()
            logger.info(f"Docker client initialized: {v.get('Version')}")
        except Exception as e:
            logger.error(f"Docker initialization failed: {e}")
            await websocket.send_text(f"Error: Docker initialization failed: {e}")
            await websocket.close()
            return

        # 2. Wait for code payload
        logger.info("Waiting for JSON payload...")
        try:
            data = await websocket.receive_json()
            code = data.get("code")
            language = data.get("language", "python")
            logger.info(f"Received payload: lang={language}, code_len={len(code) if code else 0}")
        except Exception as e:
            logger.error(f"Failed to receive JSON: {e}")
            await websocket.close()
            return
        
        if not code:
            await websocket.send_text("Error: No code provided")
            await websocket.close()
            return
            
        if language not in LANGUAGE_CONFIG:
            await websocket.send_text(f"Error: Language '{language}' is not supported")
            await websocket.close()
            return

        config = LANGUAGE_CONFIG[language]

        # 3. Create Container
        try:
            # Check if image exists
            try:
                client.inspect_image(config["image"])
            except docker.errors.ImageNotFound:
                logger.info(f"Image {config['image']} not found. Pulling...")
                await websocket.send_text(f"Preparing environment (pulling {config['image']})...\n")
                await asyncio.to_thread(lambda: [line for line in client.pull(config["image"], stream=True)])
                logger.info(f"Pulled {config['image']}")

            host_config = client.create_host_config(
                mem_limit=settings.SANDBOX_MAX_MEMORY,
                memswap_limit=settings.SANDBOX_MAX_MEMORY,
                cpu_quota=80000,
                cpu_period=100000,
                network_mode="none" 
            )

            logger.info("Creating container...")
            container = client.create_container(
                image=config["image"],
                command=config["cmd"],
                name=f"interactive-{language}-{asyncio.get_event_loop().time()}",
                working_dir="/",
                host_config=host_config,
                stdin_open=True,
                tty=True,
                detach=True
            )
            container_id = container.get('Id')
            logger.info(f"Container created: {container_id}")
            
        except Exception as e:
            logger.error(f"Container creation failed: {e}")
            await websocket.send_text(f"Error: Sandbox init failed: {e}\n")
            await websocket.close()
            return

        # 4. Put Code
        try:
            client.put_archive(
                container_id,
                "/",
                _create_tar_code(code, config["filename"])
            )
            logger.info("Code uploaded")
        except Exception as e:
            logger.error(f"Failed to upload code: {e}")
            await websocket.close()
            return

        # 5. Start Container
        try:
            client.start(container_id)
            logger.info("Container started")
        except Exception as e:
            logger.error(f"Failed to start container: {e}")
            await websocket.close()
            return

        # 6. Bridge setup
        try:
            output_stream = client.attach(container_id, stdout=True, stderr=True, stream=True, logs=True)
            stdin_sock = client.attach_socket(container_id, params={'stdin': 1, 'stream': 1})
            stdin_raw = stdin_sock._sock if hasattr(stdin_sock, '_sock') else stdin_sock
            logger.info("Streams attached")
        except Exception as e:
            logger.error(f"Failed to attach streams: {e}")
            await websocket.close()
            return

        async def stream_output():
            logger.info("Starting output stream thread...")
            queue = asyncio.Queue()
            
            # CRITICAL FIX: Pass the running loop explicitly
            loop = asyncio.get_running_loop()
            
            def worker(loop_ref):
                try:
                    logger.info("Worker thread started")
                    for chunk in output_stream:
                        asyncio.run_coroutine_threadsafe(queue.put(chunk), loop_ref)
                    asyncio.run_coroutine_threadsafe(queue.put(None), loop_ref)
                    logger.info("Worker thread finished")
                except Exception as e:
                    logger.error(f"Worker thread error: {e}")
                    asyncio.run_coroutine_threadsafe(queue.put(None), loop_ref)

            import threading
            threading.Thread(target=worker, args=(loop,), daemon=True).start()

            while True:
                chunk = await queue.get()
                if chunk is None:
                    logger.info("Output stream ended (None received)")
                    break
                
                try:
                    if isinstance(chunk, bytes):
                        await websocket.send_text(chunk.decode('utf-8', errors='ignore'))
                    else:
                        await websocket.send_text(str(chunk))
                except Exception as e:
                    logger.error(f"WebSocket send error: {e}")
                    break

        async def handle_input():
            logger.info("Starting input handler...")
            try:
                while True:
                    user_input = await websocket.receive_text()
                    await asyncio.to_thread(stdin_raw.sendall, user_input.encode('utf-8'))
            except WebSocketDisconnect:
                logger.info("WS Client disconnect (input loop)")
            except Exception as e:
                logger.error(f"Input loop error: {e}")

        # Run bridges
        producer = asyncio.create_task(stream_output())
        consumer = asyncio.create_task(handle_input())
        logger.info("Bridge tasks started")

        # 7. Monitor
        while not producer.done():
            await asyncio.sleep(0.5)
            try:
                status = client.inspect_container(container_id)
                if not status['State']['Running']:
                    logger.info(f"Container exited: {status['State']['ExitCode']}")
                    await asyncio.sleep(1) # flush logs
                    break
            except Exception as e:
                logger.error(f"Monitor error: {e}")
                break

        producer.cancel()
        consumer.cancel()
        logger.info("Session finished clean")

    except WebSocketDisconnect:
        logger.info("WS Disconnected (outer)")
    except Exception as e:
        logger.error(f"Fatal Session Error: {e}", exc_info=True)
        try:
            await websocket.send_text(f"\nExecution Error: {e}\n")
        except:
            pass
        
    finally:
        if container_id:
            try:
                client.remove_container(container_id, force=True)
                logger.info(f"Cleaned up container {container_id}")
            except Exception as e:
                logger.error(f"Cleanup error: {e}")
        
        try:
            await websocket.close()
        except:
            pass
