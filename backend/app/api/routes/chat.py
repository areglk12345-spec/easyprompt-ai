import uuid
from typing import Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Request, Header
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, auth
from app.schemas import UserMessage, AgentResponse, RefineMessage
from app.core.config import SYSTEM_PROMPT, MODEL_NAME
from fastapi.responses import StreamingResponse
from app.services.ai_service import generate_json_content, get_org_model, generate_stream_content
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
router = APIRouter()

@router.post("/", response_model=AgentResponse)
@limiter.limit("20/minute")
def chat_with_agent(request: Request, payload: UserMessage, current_user: Optional[models.User] = Depends(auth.get_current_user), db: Session = Depends(get_db), x_workspace: str = Depends(auth.get_workspace)):
    try:
        past_chats = db.query(models.ChatHistory).filter(models.ChatHistory.session_id == payload.session_id).order_by(models.ChatHistory.id.desc()).limit(10).all()
        past_chats.reverse()
        history_context = ""
        document_context = ""

        if payload.document_id and current_user:
            doc = db.query(models.KnowledgeDocument).filter(
                models.KnowledgeDocument.id == payload.document_id,
                models.KnowledgeDocument.user_id == current_user.id
            ).first()
            if doc:
                document_context = f"--- ข้อมูลอ้างอิงจากผู้ใช้ (ใช้เพื่อประกอบการตอบคำถาม/แต่ง Prompt) ---\nชื่อเอกสาร: {doc.filename}\nเนื้อหาเอกสาร: {doc.content}\n-----------------------------------\n\n"

        if past_chats:
            history_context = "ประวัติการสนทนาก่อนหน้า (ใช้อ้างอิงบริบท):\n"
            for chat in past_chats:
                history_context += f"ผู้ใช้: {chat.user_message}\nAI: {chat.agent_response}\n"
            history_context += "\n"

        prompt_to_send = f"โหมดภาษาง่ายสำหรับพูดคุย (Easy Language Mode): {payload.easy_language}\n" \
                         f"โทนภาษาที่ต้องการสำหรับ Prompt: {payload.tone or 'ทั่วไป'}\n\n" \
                         f"{document_context}" \
                         f"{history_context}" \
                         f"ข้อความจากผู้ใช้ล่าสุด: {payload.message}\n\n" \
                         f"**สำคัญมาก:** ตอบกลับเป็นรูปแบบ JSON ตามโครงสร้างที่กำหนดเท่านั้น ห้ามพิมพ์ข้อความอธิบายใดๆ นอกเหนือจาก JSON"
        
        # 1. Model Selection
        model_to_use = payload.model or MODEL_NAME
        if not payload.model and current_user:
            model_to_use = get_org_model(db, current_user.organization)
            
        cost = 5 if "pro" in model_to_use.lower() else 1
        
        if current_user:
            if current_user.credits is None:
                current_user.credits = 100
            
            if current_user.credits < cost:
                raise HTTPException(status_code=402, detail="เครดิตไม่เพียงพอ กรุณาเติมเครดิตเพื่อใช้งานต่อ")
                
            # Replace global prompt variables (e.g. {{company_name}} -> actual value)
            org_vars = db.query(models.OrgPromptVariable).filter(
                models.OrgPromptVariable.org_name == current_user.organization
            ).all()
            for var in org_vars:
                prompt_to_send = prompt_to_send.replace("{{" + var.var_key + "}}", var.var_value)

        # 2. File Upload Handling
        contents = [prompt_to_send]
        if payload.files:
            import base64
            from google.genai import types
            for file_obj in payload.files:
                if 'data' in file_obj and 'mime_type' in file_obj:
                    try:
                        # Extract base64 part if it contains data:image/png;base64,
                        b64_data = file_obj['data']
                        if "," in b64_data:
                            b64_data = b64_data.split(",")[1]
                        
                        decoded_bytes = base64.b64decode(b64_data)
                        contents.append(
                            types.Part.from_bytes(data=decoded_bytes, mime_type=file_obj['mime_type'])
                        )
                    except Exception as parse_err:
                        print(f"Error parsing file: {parse_err}")

        ai_result = generate_json_content(SYSTEM_PROMPT, contents, model_to_use)
        
        if current_user:
            current_user.credits -= cost

        new_chat = models.ChatHistory(
            session_id=payload.session_id or str(uuid.uuid4()),
            user_message=payload.message,
            agent_response=ai_result.get("next_question", "สร้าง Prompt สำเร็จ!"),
            fitted_prompt=ai_result.get("fitted_prompt", ""),
            tone=payload.tone or "ทั่วไป",
            easy_language=payload.easy_language or False,
            user_id=current_user.id if current_user else None,
            workspace=x_workspace
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
        raise HTTPException(status_code=500, detail=f"เกิดข้อผิดพลาดในการเชื่อมต่อกับ AI: {str(e)}")

@router.post("/stream")
@limiter.limit("20/minute")
def stream_chat_with_agent(request: Request, payload: UserMessage, current_user: Optional[models.User] = Depends(auth.get_current_user), db: Session = Depends(get_db), x_workspace: str = Depends(auth.get_workspace)):
    try:
        past_chats = db.query(models.ChatHistory).filter(models.ChatHistory.session_id == payload.session_id).order_by(models.ChatHistory.id.desc()).limit(10).all()
        past_chats.reverse()
        
        history_context = ""
        if past_chats:
            history_context = "ประวัติการสนทนาก่อนหน้า:\n"
            for chat in past_chats:
                history_context += f"ผู้ใช้: {chat.user_message}\nAI: {chat.agent_response}\n"
            history_context += "\n"

        prompt_to_send = f"โหมดภาษาง่าย: {payload.easy_language}\n" \
                         f"โทนภาษา: {payload.tone or 'ทั่วไป'}\n\n" \
                         f"{history_context}" \
                         f"ผู้ใช้: {payload.message}\n\n" \
                         f"ตอบกลับข้อความถัดไปที่คุณจะคุยกับผู้ใช้แบบสั้นๆ กระชับ เป็นมิตร (ไม่ต้องมี JSON)"
        
        # 1. Model Selection
        model_to_use = payload.model or MODEL_NAME
        if not payload.model and current_user:
            model_to_use = get_org_model(db, current_user.organization)
            
        cost = 5 if "pro" in model_to_use.lower() else 1
        
        if current_user:
            if current_user.credits is None:
                current_user.credits = 100
                
            if current_user.credits < cost:
                raise HTTPException(status_code=402, detail="เครดิตไม่เพียงพอ กรุณาเติมเครดิตเพื่อใช้งานต่อ")
                
            current_user.credits -= cost
            db.commit()

        if current_user:
            org_vars = db.query(models.OrgPromptVariable).filter(
                models.OrgPromptVariable.org_name == current_user.organization
            ).all()
            for var in org_vars:
                prompt_to_send = prompt_to_send.replace("{{" + var.var_key + "}}", var.var_value)

        # 2. File Upload Handling
        contents = [prompt_to_send]
        if payload.files:
            import base64
            from google.genai import types
            for file_obj in payload.files:
                if 'data' in file_obj and 'mime_type' in file_obj:
                    try:
                        b64_data = file_obj['data']
                        if "," in b64_data:
                            b64_data = b64_data.split(",")[1]
                        decoded_bytes = base64.b64decode(b64_data)
                        contents.append(
                            types.Part.from_bytes(data=decoded_bytes, mime_type=file_obj['mime_type'])
                        )
                    except Exception as parse_err:
                        print(f"Error parsing file: {parse_err}")

        if getattr(payload, 'is_direct_run', False):
            stream_system_prompt = (
                "คุณคือผู้ช่วย AI อัจฉริยะ (EasyPrompt Assistant)\n"
                "โปรดตอบคำถามหรือทำตามคำสั่งของผู้ใช้อย่างดีที่สุด ให้ข้อมูลที่ครบถ้วนและมีประโยชน์ เป็นธรรมชาติและเป็นกันเอง"
            )
        else:
            stream_system_prompt = (
                "คุณคือ AI ผู้ช่วยอัจฉริยะ (EasyPrompt Agent) ช่วยผู้ใช้เขียนหรือปรับแต่ง Prompt/ข้อความให้ดีที่สุด\n"
                "กฎสำคัญ:\n"
                "1. วิเคราะห์ว่าผู้ใช้บอกข้อมูลครบ 4 มิติหรือไม่ (เป้าหมาย, กลุ่มเป้าหมาย, โทนภาษา, รายละเอียด)\n"
                "2. หากข้อมูลยังไม่ครบ ให้คุณถามกลับ 'เพียงแค่ 1 คำถามเท่านั้น' เพื่อขอข้อมูลที่ยังขาดหายไป ห้ามร่างข้อความให้เด็ดขาด\n"
                "3. ห้ามทักทายยืดยาว หรือพูดว่า 'ยินดีด้วย' ให้เข้าเรื่องและถามคำถามทันทีอย่างสุภาพ เช่น 'ได้เลยครับ อยากทราบว่า...'\n"
                "4. หากข้อมูลชัดเจนครบถ้วนแล้ว หรือผู้ใช้แค่ต้องการคำแนะนำสั้นๆ ให้ตอบรับสั้นๆ ว่า 'ข้อมูลครบถ้วนแล้ว กำลังสร้าง Prompt ให้คุณครับ...' (ห้ามถามคำถามต่อ)"
            )

        def event_generator():
            import uuid
            full_response = ""
            for chunk in generate_stream_content(stream_system_prompt, contents, model_to_use):
                full_response += chunk
                # ใช้ replace newline ชั่วคราวเพื่อไม่ให้ SSE แตก (SSE แตกที่ \n\n)
                clean_chunk = chunk.replace('\n', '\\n')
                yield f"data: {clean_chunk}\n\n"
                
            try:
                new_chat = models.ChatHistory(
                    session_id=payload.session_id or str(uuid.uuid4()),
                    user_message=payload.message,
                    agent_response=full_response,
                    fitted_prompt="",
                    tone=payload.tone or "ทั่วไป",
                    easy_language=payload.easy_language or False,
                    user_id=current_user.id if current_user else None,
                    workspace=x_workspace
                )
                db.add(new_chat)
                db.commit()
            except Exception as e:
                print("Failed to save stream chat history:", e)
                
            yield "data: [DONE]\n\n"

        return StreamingResponse(event_generator(), media_type="text/event-stream")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"เกิดข้อผิดพลาดในการเชื่อมต่อกับ AI: {str(e)}")

@router.post("/refine", response_model=AgentResponse)
@limiter.limit("20/minute")
def refine_chat_prompt(request: Request, payload: RefineMessage, current_user: Optional[models.User] = Depends(auth.get_current_user), db: Session = Depends(get_db), x_workspace: str = Depends(auth.get_workspace)):
    try:
        # Get the latest chat message in this session
        last_chat = db.query(models.ChatHistory).filter(
            models.ChatHistory.session_id == payload.session_id,
            models.ChatHistory.workspace == x_workspace
        ).order_by(models.ChatHistory.id.desc()).first()

        if not last_chat:
            raise HTTPException(status_code=404, detail="ไม่พบประวัติการสนทนาสำหรับ session นี้")

        # Get previous context
        past_chats = db.query(models.ChatHistory).filter(
            models.ChatHistory.session_id == payload.session_id,
            models.ChatHistory.id < last_chat.id
        ).order_by(models.ChatHistory.id.desc()).limit(10).all()
        past_chats.reverse()
        
        history_context = ""
        document_context = ""

        if payload.document_id and current_user:
            doc = db.query(models.KnowledgeDocument).filter(
                models.KnowledgeDocument.id == payload.document_id,
                models.KnowledgeDocument.user_id == current_user.id
            ).first()
            if doc:
                document_context = f"--- ข้อมูลอ้างอิงจากผู้ใช้ ---\nชื่อเอกสาร: {doc.filename}\nเนื้อหาเอกสาร: {doc.content}\n-----------------------------------\n\n"

        if past_chats:
            history_context = "ประวัติการสนทนาก่อนหน้า:\n"
            for chat in past_chats:
                history_context += f"ผู้ใช้: {chat.user_message}\nAI: {chat.agent_response}\n"
            history_context += "\n"

        # The message to refine is the last message
        prompt_to_send = f"โหมดภาษาง่าย: {payload.easy_language}\n" \
                         f"โทนภาษา: {payload.tone or 'ทั่วไป'}\n\n" \
                         f"{document_context}" \
                         f"{history_context}" \
                         f"ข้อความจากผู้ใช้ล่าสุด: {last_chat.user_message}\n" \
                         f"คำตอบจากคุณล่าสุด: {last_chat.agent_response}\n\n"

        # 1. Model Selection
        model_to_use = payload.model or MODEL_NAME
        if not payload.model and current_user:
            model_to_use = get_org_model(db, current_user.organization)
            
        cost = 5 if "pro" in model_to_use.lower() else 1
        
        if current_user:
            if current_user.credits is None:
                current_user.credits = 100
            
            if current_user.credits < cost:
                raise HTTPException(status_code=402, detail="เครดิตไม่เพียงพอ กรุณาเติมเครดิตเพื่อใช้งานต่อ")
                
            # Replace global prompt variables
            org_vars = db.query(models.OrgPromptVariable).filter(
                models.OrgPromptVariable.org_name == current_user.organization
            ).all()
            for var in org_vars:
                prompt_to_send = prompt_to_send.replace("{{" + var.var_key + "}}", var.var_value)

        contents = [prompt_to_send]
        
        # Generate JSON (structured response)
        ai_result = generate_json_content(SYSTEM_PROMPT, contents, model_to_use)
        
        # Deduct credit
        if current_user:
            current_user.credits -= cost
            
        # Update last chat history with fitted prompt
        last_chat.fitted_prompt = ai_result.get("fitted_prompt", "")
        db.commit()

        # Log
        if current_user:
            try:
                new_log = models.PromptActivityLog(
                    user_id=current_user.id,
                    action="generate_chat_refine",
                    prompt_type="chat",
                    category="ทั่วไป",
                    score=ai_result.get("prompt_fit_score")
                )
                db.add(new_log)
                db.commit()
            except Exception as log_err:
                print(f"Failed to log chat activity: {log_err}")

        # Return structured data, we don't need to return agent_response again as frontend has it
        return ai_result
    except HTTPException as e:
        db.rollback()
        raise e
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"เกิดข้อผิดพลาดในการดึงข้อมูล Prompt: {str(e)}")
