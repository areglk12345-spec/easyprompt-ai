from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, auth
from typing import Optional
from pydantic import BaseModel

router = APIRouter()

class TopupRequest(BaseModel):
    package_id: str

PACKAGES = {
    "basic": {"credits": 100, "price": 50},
    "pro": {"credits": 500, "price": 200},
    "enterprise": {"credits": 2000, "price": 500}
}

@router.get("/packages")
def get_packages():
    return PACKAGES

@router.post("/checkout")
def checkout_mock(payload: TopupRequest, current_user: models.User = Depends(auth.get_required_user), db: Session = Depends(get_db)):
    if payload.package_id not in PACKAGES:
        raise HTTPException(status_code=400, detail="ไม่พบแพ็กเกจที่ระบุ")
        
    pkg = PACKAGES[payload.package_id]
    
    # In a real system, you'd create a pending transaction and return a Stripe Checkout URL or Omise Charge URL.
    # Here we mock successful payment and add credits directly.
    
    if current_user.credits is None:
        current_user.credits = 0
        
    current_user.credits += pkg["credits"]
    
    # Audit log
    try:
        from app.api.routes.audit import create_audit_log
        create_audit_log(db, current_user.id, "topup", details=f"Bought {pkg['credits']} credits for {pkg['price']} THB")
    except Exception:
        pass

    db.commit()
    db.refresh(current_user)
    
    return {
        "status": "success",
        "message": f"เติมเงินสำเร็จ! ได้รับ {pkg['credits']} เครดิต",
        "new_balance": current_user.credits
    }
