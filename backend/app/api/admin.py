from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.deps import get_db, get_current_user
from app.schemas.user import UserOut
from app.models.user import User, RoleEnum
from typing import List
import traceback

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.get("/users", response_model=List[UserOut])
def get_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        users = db.query(User).all()
        # Debug and convert eagerly to catch validation errors
        validated_users = []
        for u in users:
            try:
                validated_users.append(UserOut.model_validate(u))
            except Exception as ve:
                raise ValueError(f"Validation failed for user {u.id}: {ve}")
        return validated_users
    except Exception as e:
        print(f"Error getting users: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats")
def get_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from app.models.chat import ChatMessage, ChatSession
    from sqlalchemy import func
    from datetime import datetime, timedelta

    try:
        # Total counts
        total_users = db.query(User).count()
        total_messages = db.query(ChatMessage).count()
        
        # Calculate tokens (approximation: words * 1.3)
        # In a real app, you'd store token usage in the DB.
        # This is expensive for large DBs, but fine for single-user/small scale.
        # Optimized: Just sum length of content and divide by 4 (rough char to token ratio)
        # faster than fetching all implementation
        token_count = db.query(func.sum(func.length(ChatMessage.content))).scalar() or 0
        total_tokens = int(token_count / 4)

        # Daily stats (last 7 days)
        seven_days_ago = datetime.utcnow() - timedelta(days=6)
        daily_data = db.query(
            func.date(ChatMessage.created_at).label('date'),
            func.count(ChatMessage.id).label('count')
        ).filter(
            ChatMessage.created_at >= seven_days_ago
        ).group_by(
            func.date(ChatMessage.created_at)
        ).order_by(
            func.date(ChatMessage.created_at)
        ).all()

        # Format for frontend
        stats = []
        date_map = {str(d.date): d.count for d in daily_data}
        
        for i in range(7):
            d = seven_days_ago + timedelta(days=i)
            d_str = d.strftime("%Y-%m-%d")
            stats.append({
                "date": d.strftime("%a"), # Mon, Tue
                "count": date_map.get(d_str, 0)
            })

        return {
            "total_users": total_users,
            "total_messages": total_messages,
            "total_tokens": total_tokens, 
            "daily_stats": stats
        }
    except Exception as e:
        print(f"Error getting stats: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/privacy/settings")
def get_privacy_settings_api(current_user: User = Depends(get_current_user)):
    from app.services.privacy_service import get_privacy_settings
    return get_privacy_settings()

@router.post("/privacy/pii")
def toggle_pii(
    payload: dict,
    current_user: User = Depends(get_current_user)
):
    from app.services.privacy_service import toggle_pii_scrubbing
    enabled = payload.get("enabled", False)
    return toggle_pii_scrubbing(enabled)

@router.post("/privacy/key/rotate")
def rotate_key_api(current_user: User = Depends(get_current_user)):
    from app.services.privacy_service import rotate_encryption_key
    new_key = rotate_encryption_key()
    return {"encryption_key": new_key}
