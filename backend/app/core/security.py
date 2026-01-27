from fastapi import Request, HTTPException, status
from functools import wraps
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import time
import logging

logger = logging.getLogger(__name__)

limiter = Limiter(key_func=get_remote_address)

# Rate limiting configuration
RATE_LIMITS = {
    "auth":  "5/minute",  # Login attempts
    "chat": "30/minute",  # Chat messages
    "code_generate": "10/minute",  # Code generation
    "code_execute": "5/minute",  # Code execution (expensive)
    "rag_upload": "10/hour",  # File uploads
    "image_generate": "10/minute",  # Image generation
}

def rate_limit_by_type(limit_type: str):
    """Decorator for rate limiting by feature type"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            limit = RATE_LIMITS.get(limit_type, "100/hour")
            # Apply limiter
            return await func(*args, **kwargs)
        return wrapper
    return decorator

class SecurityMiddleware:
    """Security headers and request validation"""
    
    async def __call__(self, request:  Request, call_next):
        # Security headers
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
        
        return response

def validate_code_safety(code: str, language: str) -> bool:
    """
    Basic code validation to prevent dangerous operations
    """
    dangerous_patterns = {
        "python": [
            "os.system",
            "subprocess.call",
            "eval(",
            "exec(",
            "__import__",
            "open(",
        ],
        "javascript": [
            "eval(",
            "Function(",
            "require('child_process')",
        ],
        "bash": [
            "rm -rf",
            "format",
            ": (){:|: &};:",  # Fork bomb
        ],
    }
    
    patterns = dangerous_patterns.get(language, [])
    for pattern in patterns:
        if pattern.lower() in code.lower():
            logger.warning(f"Dangerous pattern detected: {pattern}")
            return False
    
    return True

class SandboxConfig:
    """Sandbox execution configuration"""
    MAX_EXECUTION_TIME = 30  # seconds
    MAX_MEMORY = "512M"
    MAX_CPU_PERCENT = 80
    ENABLE_NETWORK = False
    ENABLE_GPU = False
    
    ALLOWED_MOUNTS = {
        "/tmp": "rw",  # Temporary files
        "/app": "ro",  # Read-only app code
    }
    
    BLOCKED_SYSCALLS = [
        "socket",
        "setsockopt",
        "connect",
        "execve",
        "fork",
    ]