from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.core.deps import get_current_user
from app.models.user import User
from app.core.config import settings
import httpx
import base64
import logging
import urllib.parse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/image", tags=["Image"])

class ImageGenerateRequest(BaseModel):
    prompt: str
    negative_prompt: str = ""
    width: int = 512
    height: int = 512

@router.post("/generate")
async def image_generate(
    payload: ImageGenerateRequest,
    user: User = Depends(get_current_user)
):
    """Generate image using Pollinations.ai API"""
    
    logger.info(f"Image generation request from user {user.username}: {payload.prompt}")
    
    if not settings.POLLINATIONS_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="Pollinations API key is not configured."
        )
    
    # Use Pollinations.ai with the 'flux' model
    model_id = "flux"
    
    # Encode prompt for the URL
    encoded_prompt = urllib.parse.quote(payload.prompt)
    
    # Pollinations.ai Image URL structure
    # https://image.pollinations.ai/prompt/{prompt}?model={model}&nologo=true&private=true
    api_url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?model={model_id}&nologo=true&private=true&width={payload.width}&height={payload.height}"
    
    headers = {
        "Authorization": f"Bearer {settings.POLLINATIONS_API_KEY}"
    }
    
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            logger.info(f"Sending request to Pollinations.ai API: {api_url}")
            response = await client.get(
                api_url, 
                headers=headers
            )
            
            logger.info(f"Pollinations API response status: {response.status_code}")
            
            if response.status_code == 401:
                raise HTTPException(
                    status_code=401,
                    detail="Invalid Pollinations API token."
                )
            
            if response.status_code != 200:
                error_msg = f"Pollinations API error ({response.status_code}): {response.text}"
                logger.error(error_msg)
                raise HTTPException(
                    status_code=response.status_code,
                    detail=error_msg
                )
            
            # Convert image bytes to base64
            image_bytes = response.content
            image_base64 = base64.b64encode(image_bytes).decode('utf-8')
            
            logger.info(f"Image generated successfully, size: {len(image_bytes)} bytes")
            
            return {
                "image_url": f"data:image/png;base64,{image_base64}",
                "prompt": payload.prompt,
                "model": model_id
            }
            
    except httpx.TimeoutException as e:
        logger.error(f"Timeout error: {str(e)}")
        raise HTTPException(
            status_code=504,
            detail="Image generation timed out. Please try again."
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error generating image: {str(e)}"
        )
