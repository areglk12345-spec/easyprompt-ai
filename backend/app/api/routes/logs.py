from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, auth
from app.schemas import ActivityLogCreate

router = APIRouter()

@router.post("/activity")
def log_activity(payload: ActivityLogCreate, current_user: Optional[models.User] = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    try:
        new_log = models.PromptActivityLog(
            user_id=current_user.id if current_user else None,
            action=payload.action,
            prompt_type=payload.prompt_type,
            category=payload.category or "ทั่วไป",
            score=payload.score
        )
        db.add(new_log)
        db.commit()
        return {"status": "success"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="ไม่สามารถบันทึกกิจกรรมได้")
