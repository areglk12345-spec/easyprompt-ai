import uuid
from typing import Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, auth
from app.schemas import UserMessage, AgentResponse
from app.core.config import SYSTEM_PROMPT, MODEL_NAME
from app.services.ai_service import generate_json_content, get_org_model
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
router = APIRouter()

@router.post("/", response_model=AgentResponse)
@limiter.limit("20/minute")
def chat_with_agent(request: Request, payload: UserMessage, current_user: Optional[models.User] = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    try:
        past_chats = db.query(models.ChatHistory).filter(models.ChatHistory.session_id == payload.session_id).order_by(models.ChatHistory.id.desc()).limit(10).all()
        past_chats.reverse()
        
        history_context = ""
        if past_chats:
            history_context = "ประวัติการสนทนาก่อนหน้า (ใช้อ้างอิงบริบท):\n"
            for chat in past_chats:
                history_context += f"ผู้ใช้: {chat.user_message}\nAI: {chat.agent_response}\n"
            history_context += "\n"

        prompt_to_send = f"โหมดภาษาง่ายสำหรับพูดคุย (Easy Language Mode): {payload.easy_language}\n" \
                         f"โทนภาษาที่ต้องการสำหรับ Prompt: {payload.tone or 'ทั่วไป'}\n\n" \
                         f"{history_context}" \
                         f"ข้อความจากผู้ใช้ล่าสุด: {payload.message}\n\n" \
                         f"**สำคัญมาก:** ตอบกลับเป็นรูปแบบ JSON ตามโครงสร้างที่กำหนดเท่านั้น ห้ามพิมพ์ข้อความอธิบายใดๆ นอกเหนือจาก JSON"
        
        model_to_use = MODEL_NAME
        if current_user:
            model_to_use = get_org_model(db, current_user.organization)
            
            # Replace global prompt variables (e.g. {{company_name}} -> actual value)
            org_vars = db.query(models.OrgPromptVariable).filter(
                models.OrgPromptVariable.org_name == current_user.organization
            ).all()
            for var in org_vars:
                prompt_to_send = prompt_to_send.replace("{{" + var.var_key + "}}", var.var_value)

        ai_result = generate_json_content(SYSTEM_PROMPT, prompt_to_send, model_to_use)

        new_chat = models.ChatHistory(
            session_id=payload.session_id or str(uuid.uuid4()),
            user_message=payload.message,
            agent_response=ai_result.get("next_question", "สร้าง Prompt สำเร็จ!"),
            fitted_prompt=ai_result.get("fitted_prompt", ""),
            tone=payload.tone or "ทั่วไป",
            easy_language=payload.easy_language or False,
            user_id=current_user.id if current_user else None
        )
        db.add(new_chat)
        db.commit()
        db.refresh(new_chat)

        if current_user:
            try:
                new_log = models.PromptActivityLog(
                    user_id=current_user.id,
                    action="generate_chat",
                    prompt_type="chat",
                    category="ทั่วไป",
                    score=ai_result.get("prompt_fit_score")
                )
                db.add(new_log)
                db.commit()
            except Exception as log_err:
                print(f"Failed to log chat activity: {log_err}")

        return ai_result
    except HTTPException as e:
        db.rollback()
        raise e
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"เกิดข้อผิดพลาดในการเชื่อมต่อกับ AI: {str(e)}")
