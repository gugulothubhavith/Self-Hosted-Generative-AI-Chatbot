from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.auth import decode_token
from app.database.db import get_db
from sqlalchemy.orm import Session
from app.models.user import User

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    token = credentials.credentials
    import logging
    logger = logging.getLogger("app.auth")
    logger.info(f"Checking token: {token[:10]}...")
    
    payload = decode_token(token)
    if not payload:
        logger.warning(f"Token decoding failed for: {token[:10]}...")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )
    user_id: str = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token missing subject")
        
    import uuid
    try:
        uuid_obj = uuid.UUID(user_id)
    except ValueError:
        logger.error(f"Invalid UUID in token: {user_id}")
        raise HTTPException(status_code=401, detail="Invalid token subject")

    user = db.query(User).filter(User.id == uuid_obj).first()
    if not user:
        logger.warning(f"User not found for ID: {uuid_obj}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    return user