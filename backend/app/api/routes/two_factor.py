import io
import base64
import pyotp
import qrcode
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, auth
from app.schemas import TwoFactorSetupResponse, TwoFactorVerifyRequest

router = APIRouter()


@router.post("/2fa/setup", response_model=TwoFactorSetupResponse)
def setup_2fa(
    current_user: models.User = Depends(auth.get_required_user),
    db: Session = Depends(get_db)
):
    """สร้าง TOTP secret ใหม่ และ QR code สำหรับสแกนด้วย Authenticator App"""
    if current_user.is_2fa_enabled:
        raise HTTPException(status_code=400, detail="2FA เปิดใช้งานอยู่แล้ว กรุณาปิดก่อนเพื่อตั้งค่าใหม่")

    # Generate new TOTP secret
    secret = pyotp.random_base32()

    # Save secret to user (not yet enabled until verified)
    current_user.totp_secret = secret
    db.commit()

    # Generate provisioning URI for QR code
    totp = pyotp.TOTP(secret)
    provisioning_uri = totp.provisioning_uri(
        name=current_user.username,
        issuer_name="EasyPrompt AI"
    )

    # Generate QR code as base64 image
    qr = qrcode.QRCode(version=1, box_size=6, border=2)
    qr.add_data(provisioning_uri)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")

    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)
    qr_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

    return TwoFactorSetupResponse(
        qr_code_base64=f"data:image/png;base64,{qr_base64}",
        secret=secret,
        message="สแกน QR Code ด้วย Google Authenticator หรือ Authy แล้วกรอกรหัส 6 หลักเพื่อยืนยัน"
    )


@router.post("/2fa/verify")
def verify_and_enable_2fa(
    payload: TwoFactorVerifyRequest,
    current_user: models.User = Depends(auth.get_required_user),
    db: Session = Depends(get_db)
):
    """ยืนยันรหัส TOTP 6 หลัก เพื่อเปิดใช้ 2FA"""
    if not current_user.totp_secret:
        raise HTTPException(status_code=400, detail="กรุณาตั้งค่า 2FA ก่อน (เรียก /2fa/setup)")

    if current_user.is_2fa_enabled:
        raise HTTPException(status_code=400, detail="2FA เปิดใช้งานอยู่แล้ว")

    totp = pyotp.TOTP(current_user.totp_secret)
    if not totp.verify(payload.code, valid_window=1):
        raise HTTPException(status_code=400, detail="รหัสยืนยันไม่ถูกต้อง กรุณาลองใหม่")

    # Enable 2FA
    current_user.is_2fa_enabled = True
    db.commit()

    return {"detail": "เปิดใช้งาน 2FA สำเร็จแล้ว! ✅ ครั้งต่อไปที่เข้าสู่ระบบจะต้องกรอกรหัสจาก Authenticator App"}


@router.post("/2fa/disable")
def disable_2fa(
    payload: TwoFactorVerifyRequest,
    current_user: models.User = Depends(auth.get_required_user),
    db: Session = Depends(get_db)
):
    """ปิด 2FA (ต้องยืนยันรหัส TOTP ก่อน)"""
    if not current_user.is_2fa_enabled:
        raise HTTPException(status_code=400, detail="2FA ยังไม่ได้เปิดใช้งาน")

    totp = pyotp.TOTP(current_user.totp_secret)
    if not totp.verify(payload.code, valid_window=1):
        raise HTTPException(status_code=400, detail="รหัสยืนยันไม่ถูกต้อง กรุณาลองใหม่")

    # Disable 2FA and clear secret
    current_user.is_2fa_enabled = False
    current_user.totp_secret = None
    db.commit()

    return {"detail": "ปิดการใช้งาน 2FA เรียบร้อยแล้ว"}
