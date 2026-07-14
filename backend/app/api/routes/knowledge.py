from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import os
import PyPDF2
import io

from ... import database, models, schemas, auth

router = APIRouter(
    prefix="/knowledge",
    tags=["knowledge"]
)

def extract_text_from_file(file: UploadFile, file_content: bytes) -> str:
    # Get extension
    ext = os.path.splitext(file.filename)[1].lower()
    
    if ext == '.txt':
        return file_content.decode('utf-8', errors='ignore')
    elif ext == '.pdf':
        try:
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_content))
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
            return text
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"ไม่สามารถอ่านไฟล์ PDF ได้: {str(e)}")
    else:
        raise HTTPException(status_code=400, detail="รองรับเฉพาะไฟล์ .txt และ .pdf เท่านั้น")

@router.post("/upload", response_model=schemas.DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_required_user)
):
    # ตรวจสอบขนาดไฟล์ (เช่น ไม่เกิน 10MB)
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="ขนาดไฟล์ต้องไม่เกิน 10MB")
    
    # สกัดข้อความจากไฟล์
    extracted_text = extract_text_from_file(file, content)
    
    if not extracted_text.strip():
        raise HTTPException(status_code=400, detail="ไม่พบข้อความในไฟล์นี้")

    # บันทึกลงฐานข้อมูล
    new_doc = models.KnowledgeDocument(
        user_id=current_user.id,
        filename=file.filename,
        content=extracted_text
    )
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)
    
    return new_doc

@router.get("/", response_model=List[schemas.DocumentResponse])
def get_documents(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_required_user)
):
    docs = db.query(models.KnowledgeDocument).filter(models.KnowledgeDocument.user_id == current_user.id).order_by(models.KnowledgeDocument.created_at.desc()).all()
    return docs

@router.delete("/{doc_id}")
def delete_document(
    doc_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_required_user)
):
    doc = db.query(models.KnowledgeDocument).filter(models.KnowledgeDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="ไม่พบเอกสาร")
    if doc.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="ไม่มีสิทธิ์ลบเอกสารนี้")
        
    db.delete(doc)
    db.commit()
    return {"status": "success", "message": "ลบเอกสารเรียบร้อยแล้ว"}
