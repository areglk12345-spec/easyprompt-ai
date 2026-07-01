from typing import Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, auth
from app.schemas import DoctorRequest, DoctorResponse
from app.core.config import DOCTOR_SYSTEM_PROMPT, MODEL_NAME
from app.services.ai_service import generate_json_content, get_org_model
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
router = APIRouter()

@router.post("/", response_model=DoctorResponse)
@limiter.limit("20/minute")
def diagnose_prompt(request: Request, payload: DoctorRequest, current_user: Optional[models.User] = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    try:
        prompt_to_send = f"โหมดภาษาง่ายสำหรับวิเคราะห์ (Easy Language Mode): {payload.easy_language}\n" \
                         f"วิเคราะห์และปรับปรุง Prompt นี้:\n{payload.prompt_text}\n\n" \
                         f"**สำคัญมาก:** ตอบกลับเป็นรูปแบบ JSON ตามโครงสร้างที่กำหนดเท่านั้น ห้ามพิมพ์ข้อความอธิบายใดๆ นอกเหนือจาก JSON"
        
        model_to_use = MODEL_NAME
        if current_user:
            model_to_use = get_org_model(db, current_user.organization)

        ai_result = generate_json_content(DOCTOR_SYSTEM_PROMPT, prompt_to_send, model_to_use)

        if current_user:
            try:
                new_log = models.PromptActivityLog(
                    user_id=current_user.id,
                    action="generate_doctor",
                    prompt_type="doctor",
                    category="ทั่วไป",
                    score=ai_result.get("prompt_fit_score")
                )
                db.add(new_log)
                db.commit()
            except Exception as log_err:
                print(f"Failed to log doctor activity: {log_err}")

        return ai_result
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"เกิดข้อผิดพลาดในการเชื่อมต่อกับ AI Doctor: {str(e)}")
