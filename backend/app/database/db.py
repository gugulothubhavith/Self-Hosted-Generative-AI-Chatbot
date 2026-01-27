import asyncio
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

# Sync engine (using psycopg2 by default from config)
engine = create_engine(settings.DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def init_db():
    # Import models to ensure they are registered
    # Import models in order of dependency to avoid mapper errors
    from app.models.memory import Memory
    from app.models.file import File
    from app.models.chat import ChatSession, ChatMessage, SharedChat
    from app.models.otp import OTP
    from app.models.snippets import Snippet
    from app.models.user import User  # User usually has relationships to many others
    
    loop = asyncio.get_running_loop()
    await loop.run_in_executor(None, Base.metadata.create_all, engine)

async def check_db_connection():
    """Test the database connection."""
    try:
        from sqlalchemy import text
        loop = asyncio.get_running_loop()
        def _check():
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
        await loop.run_in_executor(None, _check)
        return True
    except Exception as e:
        print(f"DATABASE CONNECTION CHECK FAILED: {e}")
        return False

