import os
import time
import json
import hmac
import hashlib
import base64
import urllib.parse
from typing import Optional
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from .database import get_db
from . import models

def get_workspace(x_workspace: str = Header(default="ทั่วไป")) -> str:
    return urllib.parse.unquote(x_workspace)

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("SECRET_KEY environment variable is not set. It is required for security.")
TOKEN_EXPIRE_SECONDS = 86400 * 7 # 7 days token validity

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

def hash_password(password: str) -> str:
    salt = os.urandom(16)
    # 100,000 iterations PBKDF2 HMAC SHA256
    pbkdf2_hash = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt,
        100000
    )
    return f"{salt.hex()}:{pbkdf2_hash.hex()}"

def verify_password(password: str, password_hash: str) -> bool:
    try:
        salt_hex, hash_hex = password_hash.split(":")
        salt = bytes.fromhex(salt_hex)
        expected_hash = bytes.fromhex(hash_hex)
        check_hash = hashlib.pbkdf2_hmac(
            'sha256',
            password.encode('utf-8'),
            salt,
            100000
        )
        return hmac.compare_digest(expected_hash, check_hash)
    except Exception:
        return False

def create_access_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"] = time.time() + TOKEN_EXPIRE_SECONDS
    
    # Encode payload to base64
    payload_json = json.dumps(payload)
    payload_b64 = base64.urlsafe_b64encode(payload_json.encode('utf-8')).decode('utf-8')
    
    # Calculate HMAC signature
    signature = hmac.new(
        SECRET_KEY.encode('utf-8'),
        payload_b64.encode('utf-8'),
        hashlib.sha256
    ).digest()
    sig_b64 = base64.urlsafe_b64encode(signature).decode('utf-8')
    
    return f"{payload_b64}.{sig_b64}"

def decode_access_token(token: str) -> Optional[dict]:
    try:
        parts = token.split(".")
        if len(parts) != 2:
            return None
        payload_b64, sig_b64 = parts
        
        # Verify signature
        expected_sig = hmac.new(
            SECRET_KEY.encode('utf-8'),
            payload_b64.encode('utf-8'),
            hashlib.sha256
        ).digest()
        expected_sig_b64 = base64.urlsafe_b64encode(expected_sig).decode('utf-8')
        
        if not hmac.compare_digest(sig_b64.encode('utf-8'), expected_sig_b64.encode('utf-8')):
            return None
            
        # Decode payload
        payload_json = base64.urlsafe_b64decode(payload_b64.encode('utf-8')).decode('utf-8')
        payload = json.loads(payload_json)
        
        # Check expiry
        if payload.get("exp", 0) < time.time():
            return None
            
        return payload
    except Exception:
        return None

def get_current_user(token: Optional[str] = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> Optional[models.User]:
    if not token:
        return None
    
    payload = decode_access_token(token)
    if not payload:
        return None
        
    username = payload.get("sub")
    if not username:
        return None
        
    user = db.query(models.User).filter(models.User.username == username).first()
    return user

def get_required_user(user: Optional[models.User] = Depends(get_current_user)) -> models.User:
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="เข้าสู่ระบบก่อนการใช้งานส่วนนี้",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user
