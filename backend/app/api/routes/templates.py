from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, auth
from app.schemas import TemplateCreate, TemplateResponse

router = APIRouter()

@router.post("/", response_model=dict)
def save_template(payload: TemplateCreate, current_user: Optional[models.User] = Depends(auth.get_current_user), db: Session = Depends(get_db), x_workspace: str = Depends(auth.get_workspace)):
    try:
        new_template = models.PromptTemplate(
            title=payload.title,
            prompt_text=payload.prompt_text,
            category=payload.category or "ทั่วไป",
            user_id=current_user.id if current_user else None,
            is_public=payload.is_public if current_user else False,
            organization=payload.organization or (current_user.organization if current_user else "ทั่วไป"),
            workspace=x_workspace
        )
        db.add(new_template)
        db.commit()
        db.refresh(new_template)
        return {"status": "success", "message": "บันทึก Template สำเร็จ!", "template_id": new_template.id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="ไม่สามารถบันทึก Template ได้")

def seed_default_templates_if_empty(db: Session):
    try:
        if db.query(models.PromptTemplate).count() == 0:
            mock_templates = [
                {
                    "title": "เขียนอีเมลเชิงธุรกิจ",
                    "prompt_text": "ช่วยเขียนอีเมลเชิงธุรกิจถึงลูกค้าเพื่อแจ้งการอัปเดตระบบใหม่ โดยใช้ภาษาที่สุภาพและเป็นทางการ",
                    "category": "โหมดทำงาน",
                    "is_public": True,
                    "is_recommended": True,
                    "workspace": "ทั่วไป",
                    "organization": "ทั่วไป"
                },
                {
                    "title": "สรุปรายงานการประชุม",
                    "prompt_text": "ช่วยสรุปรายงานการประชุมจากข้อความต่อไปนี้เป็นหัวข้อย่อยๆ ให้เข้าใจง่าย: [ใส่เนื้อหาที่นี่]",
                    "category": "โหมดทำงาน",
                    "is_public": True,
                    "is_recommended": True,
                    "workspace": "ทั่วไป",
                    "organization": "ทั่วไป"
                },
                {
                    "title": "ช่วยอธิบายโค้ด",
                    "prompt_text": "กรุณาอธิบายโค้ดชุดนี้ให้ฟังหน่อยว่าทำงานอย่างไร และมีจุดไหนที่ควรปรับปรุงบ้าง: [ใส่โค้ดที่นี่]",
                    "category": "โหมดเรียนรู้",
                    "is_public": True,
                    "is_recommended": True,
                    "workspace": "ทั่วไป",
                    "organization": "ทั่วไป"
                },
                {
                    "title": "วางแผนการเดินทาง",
                    "prompt_text": "ช่วยวางแผนทริปท่องเที่ยวประเทศญี่ปุ่นเป็นเวลา 5 วัน 4 คืน โดยเน้นเที่ยวในโตเกียวและรอบๆ สำหรับครอบครัวที่มีเด็ก",
                    "category": "ทั่วไป",
                    "is_public": True,
                    "is_recommended": False,
                    "workspace": "ทั่วไป",
                    "organization": "ทั่วไป"
                },
                {
                    "title": "คิดคอนเทนต์ลง Social Media",
                    "prompt_text": "ช่วยคิดไอเดียโพสต์ลง Facebook จำนวน 3 โพสต์ เพื่อโปรโมทสินค้าใหม่เป็น 'กาแฟสกัดเย็น' โดยมีกลุ่มเป้าหมายเป็นวัยทำงาน",
                    "category": "โหมดสร้างสรรค์",
                    "is_public": True,
                    "is_recommended": True,
                    "workspace": "ทั่วไป",
                    "organization": "ทั่วไป"
                },
                {
                    "title": "เขียนสคริปต์วิดีโอสั้น",
                    "prompt_text": "ช่วยเขียนสคริปต์สำหรับถ่าย TikTok ความยาวไม่เกิน 1 นาที หัวข้อ '3 ทริคประหยัดเงินมนุษย์เงินเดือน'",
                    "category": "โหมดสร้างสรรค์",
                    "is_public": True,
                    "is_recommended": False,
                    "workspace": "ทั่วไป",
                    "organization": "ทั่วไป"
                },
                {
                    "title": "เตรียมตัวสัมภาษณ์งาน",
                    "prompt_text": "ช่วยจำลองการสัมภาษณ์งานในตำแหน่ง Marketing Executive โดยตั้งคำถามที่มักพบบ่อยมา 5 ข้อ พร้อมแนะนำแนวทางการตอบ",
                    "category": "โหมดทำงาน",
                    "is_public": True,
                    "is_recommended": False,
                    "workspace": "ทั่วไป",
                    "organization": "ทั่วไป"
                },
                {
                    "title": "อธิบายศัพท์เทคนิค",
                    "prompt_text": "ช่วยอธิบายคำว่า 'Blockchain' ให้คนที่ไม่เก่งคอมพิวเตอร์ฟัง แล้วเข้าใจได้ภายใน 2 นาที",
                    "category": "โหมดเรียนรู้",
                    "is_public": True,
                    "is_recommended": True,
                    "workspace": "ทั่วไป",
                    "organization": "ทั่วไป"
                },
                {
                    "title": "แปลภาษา (แบบสละสลวย)",
                    "prompt_text": "ช่วยแปลข้อความต่อไปนี้เป็นภาษาอังกฤษ โดยใช้ระดับภาษาที่เป็นทางการและเป็นธรรมชาติ: [ใส่ข้อความที่นี่]",
                    "category": "ทั่วไป",
                    "is_public": True,
                    "is_recommended": True,
                    "workspace": "ทั่วไป",
                    "organization": "ทั่วไป"
                },
                {
                    "title": "ตรวจสอบ Grammar",
                    "prompt_text": "ช่วยตรวจสอบไวยากรณ์ภาษาอังกฤษในประโยคต่อไปนี้ และแก้ไขให้ถูกต้องพร้อมอธิบายเหตุผล: [ใส่ประโยคที่นี่]",
                    "category": "โหมดเรียนรู้",
                    "is_public": True,
                    "is_recommended": False,
                    "workspace": "ทั่วไป",
                    "organization": "ทั่วไป"
                }
            ]
            for item in mock_templates:
                db.add(models.PromptTemplate(**item))
            db.commit()
    except Exception:
        db.rollback()

@router.get("/", response_model=List[TemplateResponse])
def get_templates(category: Optional[str] = None, type: Optional[str] = "all", current_user: Optional[models.User] = Depends(auth.get_current_user), db: Session = Depends(get_db), x_workspace: str = Depends(auth.get_workspace)):
    seed_default_templates_if_empty(db)
    query = db.query(models.PromptTemplate)
    if current_user:
        if type == "personal":
            query = query.filter(
                models.PromptTemplate.user_id == current_user.id,
                models.PromptTemplate.workspace == x_workspace
            )
        elif type == "shared":
            query = query.filter(models.PromptTemplate.is_public == True)
        else: # "all"
            query = query.filter(
                ((models.PromptTemplate.user_id == current_user.id) & (models.PromptTemplate.workspace == x_workspace)) |
                (models.PromptTemplate.is_public == True)
            )
    else:
        # Anonymous users see public templates
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
def get_marketplace_templates(category: Optional[str] = None, sort_by: Optional[str] = "likes", current_user: Optional[models.User] = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    query = db.query(models.PromptTemplate).filter(models.PromptTemplate.is_public == True)
    if category and category != "ทั้งหมด":
        query = query.filter(models.PromptTemplate.category == category)
        
    templates = query.all()
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
    
    if sort_by == "likes":
        results.sort(key=lambda x: x["likes_count"], reverse=True)
    else:
        results.sort(key=lambda x: x["id"], reverse=True)

    return results

@router.post("/{template_id}/publish")
def publish_template(template_id: int, current_user: models.User = Depends(auth.get_required_user), db: Session = Depends(get_db)):
    template = db.query(models.PromptTemplate).filter(models.PromptTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="ไม่พบเทมเพลตที่ระบุ")
    if template.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="คุณไม่มีสิทธิ์เผยแพร่เทมเพลตนี้")
        
    template.is_public = not template.is_public
    db.commit()
    return {"status": "success", "is_public": template.is_public}

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
