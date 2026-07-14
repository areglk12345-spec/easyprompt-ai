import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, auth
from app.schemas import (
    HistoryResponse, ChatFolderCreate, ChatFolderResponse,
    SessionFolderUpdate, SessionPinUpdate,
    SharedLinkResponse, SharedSessionResponse
)

router = APIRouter()

@router.get("/", response_model=List[HistoryResponse])
def get_history(session_id: Optional[str] = None, current_user: Optional[models.User] = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    if session_id and current_user:
        return db.query(models.ChatHistory).filter(models.ChatHistory.session_id == session_id, models.ChatHistory.user_id == current_user.id).order_by(models.ChatHistory.id.desc()).all()
    elif session_id:
        return db.query(models.ChatHistory).filter(models.ChatHistory.session_id == session_id).order_by(models.ChatHistory.id.desc()).all()
    elif current_user:
        return db.query(models.ChatHistory).filter(models.ChatHistory.user_id == current_user.id).order_by(models.ChatHistory.id.desc()).all()
    else:
        return []

@router.delete("/{history_id}")
def delete_history(history_id: int, current_user: models.User = Depends(auth.get_required_user), db: Session = Depends(get_db)):
    history = db.query(models.ChatHistory).filter(models.ChatHistory.id == history_id).first()
    if not history:
        raise HTTPException(status_code=404, detail="ไม่พบประวัติที่ระบุ")
    if history.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="คุณไม่มีสิทธิ์ลบประวัตินี้")
    db.delete(history)
    db.commit()
    return {"status": "success"}

@router.delete("/session/{session_id}")
def delete_session(session_id: str, current_user: models.User = Depends(auth.get_required_user), db: Session = Depends(get_db)):
    # Find all history records for this session
    records = db.query(models.ChatHistory).filter(models.ChatHistory.session_id == session_id).all()
    if not records:
        raise HTTPException(status_code=404, detail="ไม่พบประวัติแชทที่ระบุ")
        
    # Check permissions (assuming all records in a session belong to the same user or are anonymous)
    if any((record.user_id is not None and record.user_id != current_user.id) for record in records) and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="คุณไม่มีสิทธิ์ลบประวัติแชทนี้")
        
    for record in records:
        db.delete(record)
    db.commit()
    return {"status": "success", "message": "ลบแชทเรียบร้อยแล้ว"}

# --- Feature 4: Chat Folders ---

@router.get("/folders", response_model=List[ChatFolderResponse])
def get_folders(current_user: models.User = Depends(auth.get_required_user), db: Session = Depends(get_db)):
    return db.query(models.ChatFolder).filter(
        models.ChatFolder.user_id == current_user.id
    ).order_by(models.ChatFolder.id.desc()).all()

@router.post("/folders", response_model=ChatFolderResponse)
def create_folder(payload: ChatFolderCreate, current_user: models.User = Depends(auth.get_required_user), db: Session = Depends(get_db)):
    folder = models.ChatFolder(
        user_id=current_user.id,
        name=payload.name,
        color=payload.color or "#6366f1"
    )
    db.add(folder)
    db.commit()
    db.refresh(folder)
    return folder

@router.delete("/folders/{folder_id}")
def delete_folder(folder_id: int, current_user: models.User = Depends(auth.get_required_user), db: Session = Depends(get_db)):
    folder = db.query(models.ChatFolder).filter(
        models.ChatFolder.id == folder_id,
        models.ChatFolder.user_id == current_user.id
    ).first()
    if not folder:
        raise HTTPException(status_code=404, detail="ไม่พบโฟลเดอร์ที่ระบุ")
    
    # Unassign chats from this folder
    db.query(models.ChatHistory).filter(models.ChatHistory.folder_id == folder_id).update({"folder_id": None})
    db.delete(folder)
    db.commit()
    return {"status": "success", "message": "ลบโฟลเดอร์เรียบร้อยแล้ว"}

@router.put("/session/{session_id}/folder")
def move_session_to_folder(session_id: str, payload: SessionFolderUpdate, current_user: models.User = Depends(auth.get_required_user), db: Session = Depends(get_db)):
    records = db.query(models.ChatHistory).filter(
        models.ChatHistory.session_id == session_id,
        models.ChatHistory.user_id == current_user.id
    ).all()
    if not records:
        raise HTTPException(status_code=404, detail="ไม่พบแชทที่ระบุ")
    
    # Validate folder belongs to user if folder_id is provided
    if payload.folder_id is not None:
        folder = db.query(models.ChatFolder).filter(
            models.ChatFolder.id == payload.folder_id,
            models.ChatFolder.user_id == current_user.id
        ).first()
        if not folder:
            raise HTTPException(status_code=404, detail="ไม่พบโฟลเดอร์ที่ระบุ")
    
    for record in records:
        record.folder_id = payload.folder_id
    db.commit()
    return {"status": "success", "message": "ย้ายแชทเรียบร้อยแล้ว"}

@router.put("/session/{session_id}/pin")
def toggle_session_pin(session_id: str, payload: SessionPinUpdate, current_user: models.User = Depends(auth.get_required_user), db: Session = Depends(get_db)):
    records = db.query(models.ChatHistory).filter(
        models.ChatHistory.session_id == session_id,
        models.ChatHistory.user_id == current_user.id
    ).all()
    if not records:
        raise HTTPException(status_code=404, detail="ไม่พบแชทที่ระบุ")
    
    for record in records:
        record.is_pinned = payload.is_pinned
    db.commit()
    return {"status": "success", "is_pinned": payload.is_pinned}

# --- Feature 5: Shared Links ---

@router.post("/session/{session_id}/share", response_model=SharedLinkResponse)
def create_share_link(session_id: str, current_user: models.User = Depends(auth.get_required_user), db: Session = Depends(get_db)):
    # Verify session belongs to user
    records = db.query(models.ChatHistory).filter(
        models.ChatHistory.session_id == session_id,
        models.ChatHistory.user_id == current_user.id
    ).first()
    if not records:
        raise HTTPException(status_code=404, detail="ไม่พบแชทที่ระบุ")
    
    # Check if already shared
    existing = db.query(models.SharedLink).filter(
        models.SharedLink.session_id == session_id,
        models.SharedLink.user_id == current_user.id,
        models.SharedLink.is_active == True
    ).first()
    if existing:
        return existing
    
    share_token = str(uuid.uuid4())
    link = models.SharedLink(
        session_id=session_id,
        user_id=current_user.id,
        share_token=share_token
    )
    db.add(link)
    db.commit()
    db.refresh(link)
    return link

@router.delete("/share/{share_id}")
def revoke_share_link(share_id: int, current_user: models.User = Depends(auth.get_required_user), db: Session = Depends(get_db)):
    link = db.query(models.SharedLink).filter(
        models.SharedLink.id == share_id,
        models.SharedLink.user_id == current_user.id
    ).first()
    if not link:
        raise HTTPException(status_code=404, detail="ไม่พบลิงก์แชร์ที่ระบุ")
    
    link.is_active = False
    db.commit()
    return {"status": "success", "message": "ยกเลิกลิงก์แชร์เรียบร้อยแล้ว"}

@router.get("/shared/{token}", response_model=SharedSessionResponse)
def get_shared_session(token: str, db: Session = Depends(get_db)):
    """Public endpoint — no auth required. View shared chat session."""
    link = db.query(models.SharedLink).filter(
        models.SharedLink.share_token == token,
        models.SharedLink.is_active == True
    ).first()
    if not link:
        raise HTTPException(status_code=404, detail="ลิงก์แชร์ไม่ถูกต้องหรือหมดอายุ")
    
    messages = db.query(models.ChatHistory).filter(
        models.ChatHistory.session_id == link.session_id
    ).order_by(models.ChatHistory.id.asc()).all()
    
    # Get sharer's name
    sharer = db.query(models.User).filter(models.User.id == link.user_id).first()
    shared_by = sharer.full_name or sharer.username if sharer else None

    return {
        "messages": messages,
        "shared_by": shared_by
    }
