from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from contextlib import asynccontextmanager
from app.core.config import settings
from datetime import datetime

# CRITICAL: Import all models immediately to register them with SQLAlchemy/Base
from app import models 

import logging
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Starting up AI Platform Backend...")
    print(f"Project Name: {settings.PROJECT_NAME}")
    print(f"Groq API Key set: {'Yes' if settings.GROQ_API_KEY else 'No'}")
    
    from app.database.db import init_db
    try:
        await init_db()
        print("Database initialized successfully.")
        
        # Automatically run schema fixes
        print("Running automated schema fixes...")
        from fix_db_schema import fix_schema
        fix_schema()
    except Exception as e:
        print(f"DATABASE ERROR ON STARTUP: {e}")
    yield

    # Shutdown
    print("Shutting down...")


app = FastAPI(

    title="Generative AI Chatbot API",
    description="Backend API services",
    version="1.0.0",
    docs_url="/docs",
    openapi_url="/openapi.json",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Trusted Host Middleware
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["*"]
)

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    import traceback
    error_msg = f"GLOBAL ERROR: {exc}\n{traceback.format_exc()}"
    logger.error(error_msg)
    
    # Also log to a file and console for visibility
    logger.error(error_msg)
    print(f"CRITICAL BACKEND ERROR: {error_msg}")
    
    try:
        with open("backend_errors.log", "a") as f:
            f.write(f"\n{'='*40}\n")
            f.write(f"TIMESTAMP: {datetime.utcnow()}\n")
            f.write(f"URL: {request.url}\n")
            f.write(error_msg)
            f.write(f"\n{'='*40}\n")
    except:
        pass

    from fastapi.responses import JSONResponse
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc), "traceback": traceback.format_exc()}
    )


@app.get("/health")
async def health():
    from app.database.db import check_db_connection
    from app.core.redis_client import redis_client
    
    db_ok = await check_db_connection()
    
    redis_ok = False
    try:
        redis_ok = redis_client.ping()
    except:
        pass
        
    status = "ok" if (db_ok and redis_ok) else "degraded"
    
    return {
        "status": status,
        "database": "connected" if db_ok else "disconnected",
        "redis": "connected" if redis_ok else "disconnected",
        "timestamp": datetime.utcnow()
    }


from app.api import auth, chat, code_agent, rag, image, oauth, admin, ws_code, ws_agent, voice, snippets

# Include Routers
app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(rag.router)
app.include_router(code_agent.router)
app.include_router(image.router)
app.include_router(oauth.router)
app.include_router(admin.router)
app.include_router(ws_code.router)
app.include_router(ws_agent.router)
app.include_router(voice.router)
app.include_router(snippets.router)


@app.get("/")
async def root():
    return {
        "message": "Backend API is running",
        "docs_url": "/docs",
        "health_url": "/health"
    }

if __name__ == "__main__": 
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)