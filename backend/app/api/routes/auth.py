import os
from fastapi import APIRouter, HTTPException, Depends, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, auth
from app.schemas import (
    UserProfile, UserRegister, UserLogin, TokenResponse,
    UserUpdateProfile, UserUpdatePassword,
    TwoFactorLoginRequest, TwoFactorLoginResponse,
    SocialLoginRequest
)
from firebase_admin import auth as firebase_auth
from datetime import datetime, timezone
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address, enabled=os.getenv("TESTING") != "true")
router = APIRouter()

@router.post("/register", response_model=UserProfile)
@limiter.limit("3/minute")
def register_user(payload: UserRegister, request: Request, db: Session = Depends(get_db)):
    if len(payload.password) < 8 or not any(char.isdigit() for char in payload.password) or not any(char.isalpha() for char in payload.password):
        raise HTTPException(status_code=400, detail="รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร ประกอบด้วยตัวอักษรและตัวเลขอย่างน้อย 1 ตัว")

    existing_user = db.query(models.User).filter(models.User.username == payload.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="ชื่อผู้ใช้งานนี้ถูกใช้ไปแล้ว")
    
    new_user = models.User(
        username=payload.username,
        password_hash=auth.hash_password(payload.password),
        full_name=payload.full_name,
        role="user",
        organization=payload.organization or "ทั่วไป",
        credits=100,
        is_premium=False
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login")
@limiter.limit("5/minute")
def login_user(payload: UserLogin, request: Request, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == payload.username).first()
    if not user or not auth.verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง")
    
    # Check if 2FA is enabled — require TOTP verification before issuing token
    if user.is_2fa_enabled:
        return TwoFactorLoginResponse(
            requires_2fa=True,
            pending_username=user.username,
            message="กรุณากรอกรหัส 6 หลักจาก Authenticator App เพื่อยืนยันตัวตน"
        )
    
    token = auth.create_access_token({"sub": user.username})

    # Audit log for login
    try:
        from app.api.routes.audit import create_audit_log
        create_audit_log(db, user.id, "login",
                         ip_address=request.client.host if request.client else None)
    except Exception:
        pass  # Don't break login if audit logging fails

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": UserProfile.model_validate(user)
    }

@router.post("/login/2fa")
def login_with_2fa(payload: TwoFactorLoginRequest, request: Request, db: Session = Depends(get_db)):
    """ขั้นตอนที่ 2 ของ Login: ยืนยันรหัส TOTP 6 หลัก"""
    import pyotp

    user = db.query(models.User).filter(models.User.username == payload.username).first()
    if not user:
        raise HTTPException(status_code=401, detail="ไม่พบผู้ใช้งาน")

    if not user.is_2fa_enabled or not user.totp_secret:
        raise HTTPException(status_code=400, detail="ผู้ใช้นี้ยังไม่ได้เปิดใช้ 2FA")

    totp = pyotp.TOTP(user.totp_secret)
    if not totp.verify(payload.totp_code, valid_window=1):
        raise HTTPException(status_code=401, detail="รหัสยืนยัน 2FA ไม่ถูกต้อง กรุณาลองใหม่")

    token = auth.create_access_token({"sub": user.username})

    # Audit log for login with 2FA
    try:
        from app.api.routes.audit import create_audit_log
        create_audit_log(db, user.id, "login_2fa",
                         ip_address=request.client.host if request.client else None)
    except Exception:
        pass

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": UserProfile.model_validate(user)
    }

@router.get("/me", response_model=UserProfile)
def get_me(current_user: models.User = Depends(auth.get_required_user)):
    return current_user

@router.put("/me/profile", response_model=UserProfile)
def update_profile(
    payload: UserUpdateProfile,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_required_user)
):
    if payload.full_name is not None:
        current_user.full_name = payload.full_name
    if payload.email is not None:
        existing = db.query(models.User).filter(models.User.email == payload.email, models.User.id != current_user.id).first()
        if existing:
            raise HTTPException(status_code=400, detail="อีเมลนี้ถูกใช้งานแล้ว")
        current_user.email = payload.email
    if payload.default_tone is not None:
        current_user.default_tone = payload.default_tone
        
    db.commit()
    db.refresh(current_user)
    return current_user

@router.put("/me/password")
def update_password(
    payload: UserUpdatePassword,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_required_user)
):
    if not auth.verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="รหัสผ่านปัจจุบันไม่ถูกต้อง")
        
    if len(payload.new_password) < 8 or not any(char.isdigit() for char in payload.new_password) or not any(char.isalpha() for char in payload.new_password):
        raise HTTPException(status_code=400, detail="รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร ประกอบด้วยตัวอักษรและตัวเลขอย่างน้อย 1 ตัว")
        
    current_user.password_hash = auth.hash_password(payload.new_password)
    db.commit()
    return {"detail": "อัปเดตรหัสผ่านเรียบร้อยแล้ว"}


@router.post("/social-login", response_model=TokenResponse)
def social_login(payload: SocialLoginRequest, request: Request, db: Session = Depends(get_db)):
    """เข้าสู่ระบบด้วย Google, Apple, Phone ผ่าน Firebase"""
    try:
        # Verify the Firebase ID token
        decoded_token = firebase_auth.verify_id_token(payload.id_token)
        uid = decoded_token.get("uid")
        email = decoded_token.get("email")
        name = decoded_token.get("name")
        phone_number = decoded_token.get("phone_number")
        
        # Determine username or identifier
        identifier = email or phone_number or uid
        if not identifier:
            raise HTTPException(status_code=400, detail="ไม่พบข้อมูล Email หรือ Phone number จาก Firebase")
        
        # Check if user exists
        user = db.query(models.User).filter(
            (models.User.email == email) | (models.User.username == identifier)
        ).first()

        if not user:
            # Auto-register new user from social login
            user = models.User(
                username=identifier,
                email=email,
                full_name=name or "Social User",
                password_hash="social_login_no_password",
                role="user",
                organization="ทั่วไป",
                is_2fa_enabled=False,
                credits=100,
                is_premium=False
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        
        # Generate our own system JWT access token
        token = auth.create_access_token({"sub": user.username})

        # Audit log for social login
        try:
            from app.api.routes.audit import create_audit_log
            create_audit_log(db, user.id, "social_login",
                             ip_address=request.client.host if request.client else None)
        except Exception:
            pass

        return {
            "access_token": token,
            "token_type": "bearer",
            "user": UserProfile.model_validate(user)
        }

    except Exception as e:
        import logging
        logging.error(f"Firebase token verification failed: {e}")
        raise HTTPException(status_code=401, detail="การยืนยันตัวตนผ่าน Social Login ล้มเหลว")
