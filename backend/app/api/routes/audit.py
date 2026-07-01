import json
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, auth
from app.schemas import AuditLogResponse

router = APIRouter()

def create_audit_log(
    db: Session,
    user_id: int,
    action: str,
    target_user_id: int = None,
    details: dict = None,
    ip_address: str = None
):
    """Helper function to create an audit log entry."""
    try:
        audit = models.AuditLog(
            user_id=user_id,
            action=action,
            target_user_id=target_user_id,
            details=json.dumps(details, ensure_ascii=False) if details else None,
            ip_address=ip_address
        )
        db.add(audit)
        db.commit()
    except Exception as e:
        print(f"Failed to create audit log: {e}")
        db.rollback()

@router.get("/audit-logs", response_model=List[AuditLogResponse])
def get_audit_logs(
    action: Optional[str] = None,
    limit: int = Query(default=50, le=200),
    offset: int = 0,
    current_admin: models.User = Depends(auth.get_required_user),
    db: Session = Depends(get_db)
):
    if current_admin.role != "admin":
        raise HTTPException(status_code=403, detail="เฉพาะแอดมินเท่านั้นที่สามารถเข้าถึง Audit Logs ได้")

    org = current_admin.organization

    # Base query: join AuditLog with User (actor) to filter by org
    query = db.query(
        models.AuditLog.id,
        models.AuditLog.user_id,
        models.User.username.label("username"),
        models.AuditLog.action,
        models.AuditLog.target_user_id,
        models.AuditLog.details,
        models.AuditLog.ip_address,
        models.AuditLog.created_at
    ).outerjoin(models.User, models.AuditLog.user_id == models.User.id)\
     .filter(models.User.organization == org)

    if action:
        query = query.filter(models.AuditLog.action == action)

    rows = query.order_by(models.AuditLog.id.desc()).offset(offset).limit(limit).all()

    results = []
    for row in rows:
        # Resolve target username if target_user_id exists
        target_username = None
        if row.target_user_id:
            target_user = db.query(models.User.username).filter(models.User.id == row.target_user_id).first()
            target_username = target_user.username if target_user else None

        results.append({
            "id": row.id,
            "user_id": row.user_id,
            "username": row.username,
            "action": row.action,
            "target_user_id": row.target_user_id,
            "target_username": target_username,
            "details": row.details,
            "ip_address": row.ip_address,
            "created_at": row.created_at
        })

    return results
