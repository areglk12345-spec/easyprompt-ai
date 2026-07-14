from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, auth
from app.schemas import TemplateCreate, TemplateResponse

router = APIRouter()

@router.post("/", response_model=dict)
def save_template(payload: TemplateCreate, current_user: Optional[models.User] = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    try:
        new_template = models.PromptTemplate(
            title=payload.title,
            prompt_text=payload.prompt_text,
            category=payload.category or "ทั่วไป",
            user_id=current_user.id if current_user else None,
            is_public=payload.is_public if current_user and current_user.role == "admin" else False,
            organization=payload.organization or (current_user.organization if current_user else "ทั่วไป")
        )
        db.add(new_template)
        db.commit()
        db.refresh(new_template)
        return {"status": "success", "message": "บันทึก Template สำเร็จ!", "template_id": new_template.id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="ไม่สามารถบันทึก Template ได้")

@router.get("/", response_model=List[TemplateResponse])
def get_templates(category: Optional[str] = None, current_user: Optional[models.User] = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    query = db.query(models.PromptTemplate)
    if current_user:
        org = current_user.organization
        if current_user.role == "admin":
            query = query.filter(
                (models.PromptTemplate.organization == org) |
                (models.PromptTemplate.user_id == current_user.id) |
                (models.PromptTemplate.is_public == True)
            )
        else:
            query = query.filter(
                (models.PromptTemplate.user_id == current_user.id) |
                ((models.PromptTemplate.is_public == True) & (
                    (models.PromptTemplate.organization == org) |
                    (models.PromptTemplate.organization == "ทั่วไป") |
                    (models.PromptTemplate.organization.is_(None))
                ))
            )
    else:
        # Anonymous users only see public templates
        query = query.filter(models.PromptTemplate.is_public == True)
        
    if category and category != "ทั้งหมด":
        query = query.filter(models.PromptTemplate.category == category)
        
    templates = query.order_by(models.PromptTemplate.id.desc()).all()
    results = []
    for tpl in templates:
        is_favorite = False
        if current_user and current_user in tpl.favorited_by:
            is_favorite = True
            
        results.append({
            "id": tpl.id,
            "title": tpl.title,
            "prompt_text": tpl.prompt_text,
            "category": tpl.category,
            "is_public": tpl.is_public,
            "is_recommended": tpl.is_recommended,
            "user_id": tpl.user_id,
            "organization": tpl.organization,
            "is_favorite": is_favorite,
            "likes_count": len(tpl.favorited_by)
        })
    return results

@router.get("/marketplace", response_model=List[TemplateResponse])
def get_marketplace_templates(category: Optional[str] = None, current_user: Optional[models.User] = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    query = db.query(models.PromptTemplate).filter(models.PromptTemplate.is_public == True)
    if category and category != "ทั้งหมด":
        query = query.filter(models.PromptTemplate.category == category)
        
    templates = query.order_by(models.PromptTemplate.id.desc()).all()
    results = []
    for tpl in templates:
        is_favorite = False
        if current_user and current_user in tpl.favorited_by:
            is_favorite = True
            
        results.append({
            "id": tpl.id,
            "title": tpl.title,
            "prompt_text": tpl.prompt_text,
            "category": tpl.category,
            "is_public": tpl.is_public,
            "is_recommended": tpl.is_recommended,
            "user_id": tpl.user_id,
            "organization": tpl.organization,
            "is_favorite": is_favorite,
            "likes_count": len(tpl.favorited_by)
        })
    return results

@router.post("/{template_id}/copy")
def copy_template(template_id: int, current_user: models.User = Depends(auth.get_required_user), db: Session = Depends(get_db)):
    template = db.query(models.PromptTemplate).filter(models.PromptTemplate.id == template_id).first()
    if not template or not template.is_public:
        raise HTTPException(status_code=404, detail="ไม่พบเทมเพลตสาธารณะที่ระบุ")
        
    new_template = models.PromptTemplate(
        title=f"{template.title} (คัดลอก)",
        prompt_text=template.prompt_text,
        category=template.category,
        user_id=current_user.id,
        is_public=False,
        organization=current_user.organization
    )
    db.add(new_template)
    db.commit()
    db.refresh(new_template)
    return {"status": "success", "message": "คัดลอกสำเร็จ!", "template_id": new_template.id}

@router.delete("/{template_id}")
def delete_template(template_id: int, current_user: models.User = Depends(auth.get_required_user), db: Session = Depends(get_db)):
    template = db.query(models.PromptTemplate).filter(models.PromptTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="ไม่พบเทมเพลตที่ระบุ")
    if template.user_id != current_user.id:
        if current_user.role != "admin" or template.organization != current_user.organization:
            raise HTTPException(status_code=403, detail="คุณไม่มีสิทธิ์ลบเทมเพลตนี้")
    db.delete(template)
    db.commit()
    return {"status": "success"}

@router.post("/{template_id}/favorite")
def toggle_favorite(template_id: int, current_user: models.User = Depends(auth.get_required_user), db: Session = Depends(get_db)):
    template = db.query(models.PromptTemplate).filter(models.PromptTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="ไม่พบเทมเพลต")
    
    # Optional: check if they have access to this template
    
    if current_user in template.favorited_by:
        template.favorited_by.remove(current_user)
        is_favorite = False
    else:
        template.favorited_by.append(current_user)
        is_favorite = True
        
    db.commit()
    return {"status": "success", "is_favorite": is_favorite}
