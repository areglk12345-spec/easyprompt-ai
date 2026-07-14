from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app import models, auth
from app.services.ai_service import generate_json_content, MODEL_NAME
from app.core.config import TREND_SYSTEM_PROMPT

router = APIRouter()

@router.get("/trends")
def get_dashboard_trends(current_user: models.User = Depends(auth.get_required_user), db: Session = Depends(get_db)):
    if current_user.role == "admin":
        chats = db.query(models.ChatHistory).filter(models.ChatHistory.user_message != None).order_by(models.ChatHistory.id.desc()).limit(50).all()
    else:
        chats = db.query(models.ChatHistory).filter(
            models.ChatHistory.user_id == current_user.id,
            models.ChatHistory.user_message != None
        ).order_by(models.ChatHistory.id.desc()).limit(50).all()
        
    if not chats:
        return {
            "summary": "ยังไม่มีข้อมูลการใช้งานเพียงพอที่จะวิเคราะห์แนวโน้ม",
            "popular_topics": [],
            "common_mistakes": [],
            "training_suggestions": []
        }
        
    prompt_list = "\n".join([f"- {chat.user_message}" for chat in chats])
    
    try:
        trends = generate_json_content(TREND_SYSTEM_PROMPT, f"ข้อมูล Prompt ที่รับเข้ามา:\n{prompt_list}", MODEL_NAME)
        return trends
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze trends: {str(e)}")

@router.get("/stats")
def get_dashboard_stats(current_user: models.User = Depends(auth.get_required_user), db: Session = Depends(get_db)):
    if current_user.role == "admin":
        total_prompts = db.query(models.ChatHistory).count()
        total_templates = db.query(models.PromptTemplate).count()
        total_users = db.query(models.User).count()
        
        # Data for Pie Chart (Templates by Category)
        templates_by_category = db.query(
            models.PromptTemplate.category, 
            func.count(models.PromptTemplate.id).label('count')
        ).group_by(models.PromptTemplate.category).all()
        
        # Data for Bar Chart (Prompts by Tone)
        prompts_by_tone = db.query(
            models.ChatHistory.tone, 
            func.count(models.ChatHistory.id).label('count')
        ).group_by(models.ChatHistory.tone).all()
        
    else:
        total_prompts = db.query(models.ChatHistory).filter(models.ChatHistory.user_id == current_user.id).count()
        total_templates = db.query(models.PromptTemplate).filter(models.PromptTemplate.user_id == current_user.id).count()
        total_users = 1
        
        templates_by_category = db.query(
            models.PromptTemplate.category, 
            func.count(models.PromptTemplate.id).label('count')
        ).filter(models.PromptTemplate.user_id == current_user.id).group_by(models.PromptTemplate.category).all()
        
        prompts_by_tone = db.query(
            models.ChatHistory.tone, 
            func.count(models.ChatHistory.id).label('count')
        ).filter(models.ChatHistory.user_id == current_user.id).group_by(models.ChatHistory.tone).all()
        
    pie_data = [{"name": t[0] or "ไม่มีหมวดหมู่", "value": t[1]} for t in templates_by_category]
    bar_data = [{"name": t[0] or "ทั่วไป", "prompts": t[1]} for t in prompts_by_tone]
        
    return {
        "total_prompts": total_prompts,
        "total_templates": total_templates,
        "total_users": total_users,
        "pie_chart": pie_data,
        "bar_chart": bar_data
    }
