import requests
import base64
import os
import logging
from io import BytesIO
from PIL import Image
import httpx
import urllib.parse
from app.core.config import settings
from app.models.user import User

logger = logging.getLogger(__name__)

async def generate_image(prompt: str, user: User) -> dict:
    """Generate image using Pollinations (default) or SDXL."""
    
    # 1. Try Pollinations.ai if API Key is present
    if settings.POLLINATIONS_API_KEY:
        try:
            prompt_encoded = urllib.parse.quote(prompt)
            logger.info(f"Generating image via Pollinations (Model: {settings.POLLINATIONS_MODEL})...")
            # Pollinations doesn't always strictly require the key in the URL, but we use it for priority
            url = f"https://image.pollinations.ai/prompt/{prompt_encoded}?model={settings.POLLINATIONS_MODEL}&seed={os.urandom(4).hex()}&width=1024&height=1024&nologo=true"
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(url)
                response.raise_for_status()
                
                # Pollinations returns the image binary directly
                image_base64 = base64.b64encode(response.content).decode()
                return {
                    "status": "success",
                    "image_url": f"data:image/png;base64,{image_base64}",
                    "provider": "pollinations"
                }
        except Exception as e:
            logger.error(f"Pollinations failed: {e}. Falling back to SDXL/Mock...")

    # 2. Try Local/External SDXL
    try:
        if settings.SDXL_URL:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    f"{settings.SDXL_URL}/api/generate",
                    json={
                        "prompt": prompt,
                        "negative_prompt": "blurry, low quality, distorted",
                        "steps": 25,
                    }
                )
                if response.status_code == 200:
                    result = response.json()
                    image_base64 = f"data:image/png;base64,{result['image']}"
                    return {
                        "status": "success",
                        "image_url": image_base64,
                        "provider": "sdxl"
                    }
    except Exception as e:
        logger.warning(f"SDXL connection failed: {e}")
    
    except (requests.exceptions.Timeout, requests.exceptions.ConnectionError, requests.exceptions.RequestException) as e:
        print(f"WARNING: Ext. Image Gen failed ({e}), using MOCK FALLBACK")
        print("RETURNING MOCK IMAGE (Fallback Active)")
        
        # MOCK FALLBACK: Generate a real image using PIL
        try:
            from PIL import ImageDraw
            import random
            
            # bright red background to be obvious
            color = (255, 50, 50) 
            img = Image.new('RGB', (512, 512), color=color)
            d = ImageDraw.Draw(img)
            
            # Draw a big X
            d.line([(0, 0), (512, 512)], fill=(0, 0, 0), width=10)
            d.line([(0, 512), (512, 0)], fill=(0, 0, 0), width=10)
            
            # Add text
            text = f"DEMO MODE\n{prompt[:20]}"
            # draw text relative to center
            d.text((100, 200), text, fill=(255, 255, 255)) 
            
            # Convert to base64
            buffered = BytesIO()
            img.save(buffered, format="PNG")
            img_str = base64.b64encode(buffered.getvalue()).decode()
            
            print(f"Mock image created, size: {len(img_str)}")
            
            return {
                "status": "success", 
                "image_url": f"data:image/png;base64,{img_str}",
                "seed": 12345,
                "warning": "Demo Mode: External AI server offline"
            }
        except Exception as mock_e:
            print(f"ERROR: Mock generation failed: {mock_e}")
            import traceback
            traceback.print_exc()
            return {"status": "error", "message": f"Service unavailable: {e}"}
            
            return {
                "status": "success", 
                "image_url": f"data:image/png;base64,{img_str}",
                "seed": 12345,
                "warning": "Demo Mode: External AI server offline"
            }
        except Exception as mock_e:
            logger.error(f"Mock generation failed: {mock_e}")
            return {"status": "error", "message": f"Service unavailable: {e}"}