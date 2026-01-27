from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from app.core.deps import get_db, get_current_user
from app.core.auth import create_access_token, hash_password, verify_password
from app.models.user import User
from app.models.otp import OTP
from app.schemas.auth import OTPRequest, OTPVerify, AuthResponse, UserCreate, UserLogin
from app.services.email_service import send_otp_email
from datetime import datetime, timedelta
import secrets
import hashlib
from app.core.config import settings

router = APIRouter(prefix="/auth", tags=["Auth"])

OTP_EXPIRE_MINUTES = 5
MAX_ATTEMPTS = 3

def hash_otp(otp: str) -> str:
    return hashlib.sha256(otp.encode()).hexdigest()

@router.post("/request-otp")
def request_otp(payload: OTPRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """
    Generate and send OTP to email.
    Creates user if not exists (lazy registration).
    """
    email = payload.email.lower()
    
    # 1. Generate 6-digit OTP
    otp_code = "".join([str(secrets.randbelow(10)) for _ in range(6)])
    otp_hash = hash_otp(otp_code)
    
    # 2. Store in DB
    # Check if there's an existing active OTP? Use upsert logic or simple replacement for simplicity
    # Ideally delete old unverified codes for this email
    db.query(OTP).filter(OTP.email == email).delete()
    
    expires_at = datetime.utcnow() + timedelta(minutes=OTP_EXPIRE_MINUTES)
    
    new_otp = OTP(
        email=email,
        otp_hash=otp_hash,
        expires_at=expires_at,
        attempts=0
    )
    db.add(new_otp)
    
    # 3. Check/Create User (Optional here, can also do at verify)
    # logic: If we want to allow login for non-existent users (signup), we just send OTP. 
    # Actual user creation happens on verify if needed, or we check existence here.
    # Requirement: "Registration via email OTP". means implicit signup.
    
    db.commit()
    
    # 4. Send Email (Background task)
    background_tasks.add_task(send_otp_email, email, otp_code)
    
    return {"message": "OTP sent to email"}

@router.post("/verify-otp", response_model=AuthResponse)
def verify_otp(payload: OTPVerify, db: Session = Depends(get_db)):
    """
    Verify OTP and return JWT.
    """
    email = payload.email.lower()
    input_otp = payload.otp
    
    # 1. Fetch OTP record
    otp_record = db.query(OTP).filter(OTP.email == email).first()
    
    if not otp_record:
        raise HTTPException(status_code=400, detail="Invalid OTP or expired")
        
    # 2. Check Expiry
    if datetime.utcnow() > otp_record.expires_at:
        db.delete(otp_record)
        db.commit()
        raise HTTPException(status_code=400, detail="OTP expired")
        
    # 3. Check Attempts
    if otp_record.attempts >= MAX_ATTEMPTS:
        db.delete(otp_record)
        db.commit()
        raise HTTPException(status_code=400, detail="Too many failed attempts. Request a new OTP.")
        
    # 4. Validate Hash
    # 4. Validate Hash
    calculated_hash = hash_otp(input_otp)
    print(f"DEBUG: Verifying OTP for {email}")
    print(f"DEBUG: Input OTP: '{input_otp}'")
    print(f"DEBUG: Calculated Hash: {calculated_hash}")
    print(f"DEBUG: Stored Hash:     {otp_record.otp_hash}")
    print(f"DEBUG: Match? {calculated_hash == otp_record.otp_hash}")
    
    if calculated_hash != otp_record.otp_hash:
        otp_record.attempts += 1
        db.commit()
        raise HTTPException(status_code=400, detail=f"Invalid OTP (Debug: {input_otp})")
        
    # 5. Success - Delete OTP
    db.delete(otp_record)
    
    # 6. Get or Create User
    user = db.query(User).filter(User.email == email).first()
    is_new = False
    
    if not user:
        is_new = True
        user = User(
            email=email,
            username=email.split("@")[0], # default username
            is_verified=True
        )
        db.add(user)
    else:
        # Update verified status if not already
        if not user.is_verified:
            user.is_verified = True
    
    db.commit()
    db.refresh(user)
    
    # 7. Generate Token
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user_id": str(user.id),
        "email": user.email,
        "avatar_url": user.avatar_url,
        "is_new_user": is_new
    }

@router.post("/logout")
def logout():
    return {"message": "Logged out successfully"}

@router.post("/register", response_model=AuthResponse)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user with email and password.
    """
    email = payload.email.lower()
    
    # Check if user exists
    user = db.query(User).filter(User.email == email).first()
    if user:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    # Check username uniqueness
    existing_username = db.query(User).filter(User.username == payload.username).first()
    if existing_username:
         raise HTTPException(status_code=400, detail="Username already taken")

    # Create new user
    new_user = User(
        email=email,
        username=payload.username,
        hashed_password=hash_password(payload.password),
        is_verified=True, # Auto-verify or send email? For now auto-verify for password registration
        role="user"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Generate Token
    access_token = create_access_token(
        data={"sub": str(new_user.id)},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user_id": str(new_user.id),
        "email": new_user.email,
        "avatar_url": new_user.avatar_url,
        "is_new_user": True
    }

@router.post("/login", response_model=AuthResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    """
    Login with email and password.
    """
    email = payload.email.lower()
    
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid credentials")
        
    if not user.hashed_password:
        raise HTTPException(status_code=400, detail="User account does not have a password set (try OTP login?)")
        
    if not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid credentials")
        
    # Generate Token
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user_id": str(user.id),
        "email": user.email,
        "avatar_url": user.avatar_url,
        "is_new_user": False
    }

@router.get("/me", response_model=AuthResponse)
def read_users_me(current_user: User = Depends(get_current_user)):
    """
    Get current logged in user details.
    """
    return {
        "access_token": "valid_session", # Placeholder or could omit if schema allows
        "token_type": "bearer",
        "user_id": str(current_user.id),
        "email": current_user.email,
        "is_new_user": False
    }