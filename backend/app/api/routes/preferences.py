from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, auth
from app.schemas import UserPreferenceUpdate, UserPreferenceResponse

router = APIRouter()


@router.get("/preferences", response_model=UserPreferenceResponse)
def get_preferences(
    current_user: models.User = Depends(auth.get_required_user),
    db: Session = Depends(get_db)
):
    """ดึงค่าการตั้งค่า notification preferences ของผู้ใช้"""
    pref = db.query(models.UserPreference).filter(
        models.UserPreference.user_id == current_user.id
    ).first()

    if not pref:
        # Return defaults if no preferences saved yet
        return UserPreferenceResponse()

    return pref


@router.put("/preferences", response_model=UserPreferenceResponse)
def update_preferences(
    payload: UserPreferenceUpdate,
    current_user: models.User = Depends(auth.get_required_user),
    db: Session = Depends(get_db)
):
    """อัปเดตการตั้งค่า notification preferences ของผู้ใช้"""
    pref = db.query(models.UserPreference).filter(
        models.UserPreference.user_id == current_user.id
    ).first()

    if not pref:
        # Create new preferences record
        pref = models.UserPreference(user_id=current_user.id)
        db.add(pref)

    # Update only fields that were provided
    if payload.voice_control is not None:
        pref.voice_control = payload.voice_control
    if payload.email_notifications is not None:
        pref.email_notifications = payload.email_notifications
    if payload.push_notifications is not None:
        pref.push_notifications = payload.push_notifications
    if payload.weekly_reports is not None:
        pref.weekly_reports = payload.weekly_reports

    db.commit()
    db.refresh(pref)
    return pref
