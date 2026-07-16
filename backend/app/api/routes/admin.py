from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app import models, auth, schemas
from app.api.routes.audit import create_audit_log

router = APIRouter()

def get_admin_user(current_user: models.User = Depends(auth.get_required_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="เฉพาะแอดมินเท่านั้นที่สามารถเข้าถึงส่วนนี้ได้")
    return current_user

@router.get("/users", response_model=List[schemas.UserProfile])
def list_users(current_admin: models.User = Depends(get_admin_user), db: Session = Depends(get_db)):
    # Admins can only see users in their own organization
    org = current_admin.organization
    users = db.query(models.User).filter(models.User.organization == org).order_by(models.User.id.desc()).all()
    return users

@router.put("/users/{user_id}/role")
def update_user_role(user_id: int, payload: schemas.UserRoleUpdate, request: Request, current_admin: models.User = Depends(get_admin_user), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="ไม่พบผู้ใช้งานที่ระบุ")
    
    if user.organization != current_admin.organization:
        raise HTTPException(status_code=403, detail="คุณไม่สามารถแก้ไขสิทธิ์ผู้ใช้นอกองค์กรได้")
        
    if user.id == current_admin.id and payload.role != "admin":
        raise HTTPException(status_code=400, detail="ไม่สามารถลดสิทธิ์ตัวเองได้")

    if payload.role not in ["user", "admin"]:
        raise HTTPException(status_code=400, detail="Role ไม่ถูกต้อง (อนุญาตแค่ user หรือ admin)")

    old_role = user.role
    user.role = payload.role
    db.commit()

    # Audit log
    create_audit_log(db, current_admin.id, "role_change", target_user_id=user.id,
                     details={"old_role": old_role, "new_role": payload.role},
                     ip_address=request.client.host if request.client else None)

    return {"status": "success", "message": "อัปเดตสิทธิ์ผู้ใช้เรียบร้อยแล้ว"}

@router.delete("/users/{user_id}")
def delete_user(user_id: int, request: Request, current_admin: models.User = Depends(get_admin_user), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="ไม่พบผู้ใช้งานที่ระบุ")
        
    if user.organization != current_admin.organization:
        raise HTTPException(status_code=403, detail="คุณไม่สามารถลบผู้ใช้นอกองค์กรได้")
        
    if user.id == current_admin.id:
        raise HTTPException(status_code=400, detail="ไม่สามารถลบบัญชีตัวเองผ่านหน้านี้ได้")

    deleted_username = user.username

    # Clean up related records
    db.query(models.PromptActivityLog).filter(models.PromptActivityLog.user_id == user.id).delete()
    db.query(models.ChatHistory).filter(models.ChatHistory.user_id == user.id).delete()
    db.query(models.PromptTemplate).filter(models.PromptTemplate.user_id == user.id).delete()
    
    db.delete(user)
    db.commit()

    # Audit log
    create_audit_log(db, current_admin.id, "user_delete", target_user_id=user_id,
                     details={"deleted_username": deleted_username},
                     ip_address=request.client.host if request.client else None)

    return {"status": "success", "message": "ลบผู้ใช้เรียบร้อยแล้ว"}


@router.get("/org-settings", response_model=schemas.OrgSettingResponse)
def get_org_settings(current_admin: models.User = Depends(get_admin_user), db: Session = Depends(get_db)):
    org_name = current_admin.organization
    setting = db.query(models.OrganizationSetting).filter(models.OrganizationSetting.org_name == org_name).first()
    if not setting:
        # Create default if not exists
        setting = models.OrganizationSetting(org_name=org_name, ai_model="gemini-3.1-flash-lite")
        db.add(setting)
        db.commit()
        db.refresh(setting)
    return setting

@router.put("/org-settings", response_model=schemas.OrgSettingResponse)
def update_org_settings(payload: schemas.OrgSettingUpdate, request: Request, current_admin: models.User = Depends(get_admin_user), db: Session = Depends(get_db)):
    org_name = current_admin.organization
    setting = db.query(models.OrganizationSetting).filter(models.OrganizationSetting.org_name == org_name).first()
    old_model = setting.ai_model if setting else "gemini-3.1-flash-lite"
    
    if not setting:
        setting = models.OrganizationSetting(org_name=org_name, ai_model=payload.ai_model)
        db.add(setting)
    else:
        setting.ai_model = payload.ai_model
    
    db.commit()
    db.refresh(setting)

    # Audit log
    create_audit_log(db, current_admin.id, "org_settings_change",
                     details={"old_model": old_model, "new_model": payload.ai_model},
                     ip_address=request.client.host if request.client else None)

    return setting

# --- Feature 3: Global Prompt Variables ---

@router.get("/prompt-variables", response_model=List[schemas.PromptVariableResponse])
def get_prompt_variables(current_admin: models.User = Depends(get_admin_user), db: Session = Depends(get_db)):
    org_name = current_admin.organization
    variables = db.query(models.OrgPromptVariable).filter(
        models.OrgPromptVariable.org_name == org_name
    ).order_by(models.OrgPromptVariable.id.desc()).all()
    return variables

@router.post("/prompt-variables", response_model=schemas.PromptVariableResponse)
def create_or_update_prompt_variable(
    payload: schemas.PromptVariableCreate,
    request: Request,
    current_admin: models.User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    org_name = current_admin.organization
    
    # Check if key already exists for this org
    existing = db.query(models.OrgPromptVariable).filter(
        models.OrgPromptVariable.org_name == org_name,
        models.OrgPromptVariable.var_key == payload.var_key
    ).first()

    if existing:
        existing.var_value = payload.var_value
        db.commit()
        db.refresh(existing)
        create_audit_log(db, current_admin.id, "prompt_var_update",
                         details={"var_key": payload.var_key, "var_value": payload.var_value},
                         ip_address=request.client.host if request.client else None)
        return existing
    else:
        new_var = models.OrgPromptVariable(
            org_name=org_name,
            var_key=payload.var_key,
            var_value=payload.var_value
        )
        db.add(new_var)
        db.commit()
        db.refresh(new_var)
        create_audit_log(db, current_admin.id, "prompt_var_create",
                         details={"var_key": payload.var_key, "var_value": payload.var_value},
                         ip_address=request.client.host if request.client else None)
        return new_var

@router.delete("/prompt-variables/{var_id}")
def delete_prompt_variable(
    var_id: int,
    request: Request,
    current_admin: models.User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    var = db.query(models.OrgPromptVariable).filter(models.OrgPromptVariable.id == var_id).first()
    if not var:
        raise HTTPException(status_code=404, detail="ไม่พบตัวแปรที่ระบุ")
    
    if var.org_name != current_admin.organization:
        raise HTTPException(status_code=403, detail="คุณไม่สามารถลบตัวแปรขององค์กรอื่นได้")

    deleted_key = var.var_key
    db.delete(var)
    db.commit()

    create_audit_log(db, current_admin.id, "prompt_var_delete",
                     details={"var_key": deleted_key},
                     ip_address=request.client.host if request.client else None)

    return {"status": "success", "message": f"ลบตัวแปร '{deleted_key}' เรียบร้อยแล้ว"}


# --- Feature 4: Admin Credit Management ---

class CreditAdjust(schemas.BaseModel):
    amount: int
    reason: Optional[str] = "Admin adjustment"

@router.put("/users/{user_id}/credits")
def adjust_user_credits(
    user_id: int,
    payload: CreditAdjust,
    request: Request,
    current_admin: models.User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="ไม่พบผู้ใช้งานที่ระบุ")
    if user.organization != current_admin.organization:
        raise HTTPException(status_code=403, detail="ไม่สามารถแก้ไขเครดิตผู้ใช้นอกองค์กรได้")

    old_credits = user.credits or 0
    user.credits = old_credits + payload.amount
    if user.credits < 0:
        user.credits = 0
    db.commit()
    db.refresh(user)

    create_audit_log(db, current_admin.id, "credit_adjust", target_user_id=user.id,
                     details={"old_credits": old_credits, "new_credits": user.credits, "amount": payload.amount, "reason": payload.reason},
                     ip_address=request.client.host if request.client else None)

    return {"status": "success", "new_credits": user.credits, "message": f"ปรับเครดิตเรียบร้อย (เดิม {old_credits} → ใหม่ {user.credits})"}


# --- Feature 5: Template Recommendation Toggle ---

@router.put("/templates/{template_id}/recommend")
def toggle_template_recommendation(
    template_id: int,
    request: Request,
    current_admin: models.User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    template = db.query(models.PromptTemplate).filter(models.PromptTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="ไม่พบเทมเพลตที่ระบุ")

    template.is_recommended = not template.is_recommended
    db.commit()
    db.refresh(template)

    create_audit_log(db, current_admin.id, "template_recommend_toggle",
                     details={"template_id": template_id, "is_recommended": template.is_recommended},
                     ip_address=request.client.host if request.client else None)

    return {"status": "success", "is_recommended": template.is_recommended}

@router.get("/templates", response_model=List[schemas.TemplateResponse])
def list_all_templates_admin(
    current_admin: models.User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """List all templates for admin management."""
    templates = db.query(models.PromptTemplate).order_by(models.PromptTemplate.id.desc()).all()
    results = []
    for tpl in templates:
        results.append({
            "id": tpl.id,
            "title": tpl.title,
            "prompt_text": tpl.prompt_text,
            "category": tpl.category,
            "is_public": tpl.is_public,
            "is_recommended": tpl.is_recommended,
            "user_id": tpl.user_id,
            "organization": tpl.organization,
            "is_favorite": False,
            "likes_count": len(tpl.favorited_by)
        })
    return results

@router.get("/analytics")
def get_analytics(current_admin: models.User = Depends(get_admin_user), db: Session = Depends(get_db)):
    from sqlalchemy import func
    from datetime import datetime, timedelta, timezone
    
    # Calculate last 7 days range
    end_date = datetime.now(timezone.utc)
    start_date = end_date - timedelta(days=7)
    
    # Total prompts generated
    total_prompts = db.query(models.PromptActivityLog).filter(
        models.PromptActivityLog.action.like("generate%")
    ).count()
    
    # Average score
    avg_score_result = db.query(func.avg(models.PromptActivityLog.score)).filter(
        models.PromptActivityLog.score.isnot(None)
    ).scalar()
    avg_score = round(avg_score_result, 1) if avg_score_result else 0
    
    # Active users (who generated prompt in last 30 days)
    active_users = db.query(models.PromptActivityLog.user_id).filter(
        models.PromptActivityLog.created_at >= (end_date - timedelta(days=30))
    ).distinct().count()
    
    # Chart Data (Last 7 days)
    # Using python to group to avoid dialect-specific date formatting issues
    recent_logs = db.query(models.PromptActivityLog).filter(
        models.PromptActivityLog.created_at >= start_date,
        models.PromptActivityLog.action.like("generate%")
    ).all()
    
    from collections import defaultdict
    daily_stats = defaultdict(lambda: {"count": 0, "total_score": 0, "score_count": 0})
    
    for log in recent_logs:
        date_str = log.created_at.strftime("%Y-%m-%d")
        daily_stats[date_str]["count"] += 1
        if log.score:
            daily_stats[date_str]["total_score"] += log.score
            daily_stats[date_str]["score_count"] += 1
            
    # Format for recharts
    chart_data = []
    for i in range(6, -1, -1):
        d = (end_date - timedelta(days=i)).strftime("%Y-%m-%d")
        stats = daily_stats.get(d, {"count": 0, "total_score": 0, "score_count": 0})
        avg_s = round(stats["total_score"] / stats["score_count"], 1) if stats["score_count"] > 0 else 0
        chart_data.append({
            "date": d[-5:], # Show MM-DD
            "prompts": stats["count"],
            "score": avg_s
        })
        
    return {
        "summary": {
            "total_prompts": total_prompts,
            "avg_score": avg_score,
            "active_users": active_users
        },
        "chart_data": chart_data
    }
