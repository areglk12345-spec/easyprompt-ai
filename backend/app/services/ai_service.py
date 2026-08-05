import os
import json
import re
import logging
import threading
from fastapi import HTTPException
from dotenv import load_dotenv

from app.core.config import MODEL_NAME
from app import models
from sqlalchemy.orm import Session

# นำเข้าไลบรารีของ Gemini
from google import genai
from google.genai import types

load_dotenv()

# ===== Multi-API Key Pool (Round-Robin with Fallback) =====
# รองรับทั้ง GEMINI_API_KEYS (หลาย key คั่นด้วย ,) และ GEMINI_API_KEY (key เดี่ยว แบบเดิม)
_raw_keys = os.getenv("GEMINI_API_KEYS", "")
if _raw_keys:
    GEMINI_API_KEYS = [k.strip() for k in _raw_keys.split(",") if k.strip()]
else:
    single_key = os.getenv("GEMINI_API_KEY", "")
    GEMINI_API_KEYS = [single_key] if single_key else []

if not GEMINI_API_KEYS:
    raise ValueError("❌ ไม่พบ GEMINI_API_KEY หรือ GEMINI_API_KEYS ในไฟล์ .env กรุณาตั้งค่าก่อนเริ่มต้นเซิร์ฟเวอร์")

# สร้าง Gemini client pool
clients = [genai.Client(api_key=key) for key in GEMINI_API_KEYS]
_client_lock = threading.Lock()
_client_index = 0

logger = logging.getLogger("verbaqo.ai")
logger.info(f"🔑 API Key Pool initialized: {len(clients)} keys loaded (est. {len(clients) * 15} RPM)")

def get_next_client() -> genai.Client:
    """Round-robin เลือก client ถัดไปจาก pool"""
    global _client_index
    with _client_lock:
        client = clients[_client_index % len(clients)]
        _client_index += 1
    return client

# โควต้าโดยประมาณต่อ 1 API key ต่อโมเดล (ตรงกับป้าย RPM ที่แสดงในหน้า Admin dropdown)
MODEL_RATE_LIMITS = {
    "gemini-3.1-flash-lite": (15, 500),
    "gemini-3.5-flash-lite": (15, 500),
    "gemini-3.6-flash": (5, 250),
    "gemini-3.5-flash": (5, 250),
    "gemini-3-flash": (5, 250),
    "gemini-2.5-flash": (5, 250),
    "gemini-2.5-flash-lite": (10, 500),
}
DEFAULT_RATE_LIMIT = (15, 500)

def get_pool_status(model_name: str | None = None) -> dict:
    """คืนค่าสถานะของ API Key Pool สำหรับ Admin (โควต้าอิงตามโมเดลที่ระบุ)"""
    model = model_name or MODEL_NAME
    rpm_per_key, rpd_per_key = MODEL_RATE_LIMITS.get(model, DEFAULT_RATE_LIMIT)
    return {
        "total_keys": len(clients),
        "estimated_rpm": len(clients) * rpm_per_key,
        "estimated_rpd": len(clients) * rpd_per_key,
        "model": model,
        "current_index": _client_index % len(clients)
    }

def get_org_model(db: Session, organization_name: str) -> str:
    setting = db.query(models.OrganizationSetting).filter(models.OrganizationSetting.org_name == organization_name).first()
    if setting and setting.ai_model:
        return setting.ai_model
    return MODEL_NAME

def get_explicit_org_model(db: Session, organization_name: str) -> str | None:
    """คืนค่า ai_model ที่แอดมินตั้งไว้จริงเท่านั้น (None หากยังไม่ได้ตั้งค่า) เพื่อให้ค่านี้มีสิทธิ์เหนือกว่าโมเดลที่ผู้ใช้เลือกเอง"""
    setting = db.query(models.OrganizationSetting).filter(models.OrganizationSetting.org_name == organization_name).first()
    if setting and setting.ai_model:
        return setting.ai_model
    return None

def generate_stream_content(system_instruction: str, contents: any, model_name: str):
    """Helper method to call Gemini and stream response with round-robin + fallback"""
    errors = []
    for attempt in range(min(len(clients), 3)):  # ลองสูงสุด 3 key
        client = get_next_client()
        try:
            response = client.models.generate_content_stream(
                model=model_name,
                config=types.GenerateContentConfig(system_instruction=system_instruction),
                contents=contents
            )
            for chunk in response:
                if chunk.text:
                    yield chunk.text
            return  # สำเร็จ — หยุดลูป
        except Exception as e:
            err_str = str(e)
            errors.append(err_str)
            if "429" in err_str or "503" in err_str or "quota" in err_str.lower() or "limit" in err_str.lower() or "unavailable" in err_str.lower() or "overloaded" in err_str.lower():
                logger.warning(f"⚠️ Key #{(_client_index - 1) % len(clients)} hit rate limit, trying next key...")
                continue  # ลอง key ถัดไป
            else:
                logger.error(f"Gemini API Stream Error: {err_str}")
                yield f"[ERROR] เกิดข้อผิดพลาด: {err_str}"
                return
    
    # ทุก key โดน rate limit
    logger.error(f"All {len(errors)} API keys exhausted: {errors[-1]}")
    yield f"[ERROR] ขณะนี้ AI มีผู้ใช้งานเกินกำหนดชั่วคราว กรุณารอสักครู่แล้วลองอีกครั้ง ⏳"

def generate_json_content(system_instruction: str, contents: any, model_name: str) -> dict:
    """Helper method to call Gemini and parse JSON response with round-robin + fallback"""
    errors = []
    for attempt in range(min(len(clients), 3)):  # ลองสูงสุด 3 key
        client = get_next_client()
        try:
            response = client.models.generate_content(
                model=model_name,
                config=types.GenerateContentConfig(system_instruction=system_instruction),
                contents=contents
            )
            
            # คลีนข้อมูล: ตัด ```json และ ``` ออกในกรณีที่ AI แถมมาให้
            raw_text = response.text.strip()
            clean_text = re.sub(r'^```json\s*', '', raw_text)
            clean_text = re.sub(r'\s*```$', '', clean_text).strip()
                
            # แปลงข้อความที่คลีนแล้วให้อยู่ในรูป Dictionary พร้อม fallback ด้วย regex
            try:
                return json.loads(clean_text)
            except json.JSONDecodeError:
                match = re.search(r'\{.*\}', raw_text, re.DOTALL)
                if match:
                    return json.loads(match.group(0))
                raise
            
        except Exception as e:
            err_str = str(e)
            errors.append(err_str)
            if "429" in err_str or "503" in err_str or "quota" in err_str.lower() or "limit" in err_str.lower() or "unavailable" in err_str.lower() or "overloaded" in err_str.lower():
                logger.warning(f"⚠️ Key #{(_client_index - 1) % len(clients)} hit rate limit, trying next key...")
                continue  # ลอง key ถัดไป
            else:
                logger.error(f"Gemini API Error: {err_str}")
                raise HTTPException(status_code=500, detail=f"เกิดข้อผิดพลาดในการเชื่อมต่อกับ AI: {err_str}")
    
    # ทุก key โดน rate limit
    raise HTTPException(status_code=429, detail="ขณะนี้ AI มีผู้ใช้งานเกินกำหนดชั่วคราว กรุณารอสักครู่แล้วลองอีกครั้ง ⏳")

async def analyze_reading_level(text: str) -> dict:
    system_instruction = """
    คุณเป็นผู้เชี่ยวชาญด้าน Plain Language และการสื่อสารอย่างเข้าถึงง่าย (Web Content Accessibility Guidelines - WCAG 3.1.5 Reading Level)
    หน้าที่ของคุณคือประเมินความซับซ้อนของข้อความที่กำหนด
    ประเมินในรูปแบบ JSON ดังนี้:
    {
      "reading_level_score": [คะแนน 0-100 โดย 100 คือเข้าใจง่ายที่สุด 0 คือซับซ้อนที่สุด],
      "is_complex": [true หรือ false หากข้อความนี้เข้าใจยากเกินกว่าระดับมัธยมต้น (Lower secondary education)],
      "complex_words": [รายการคำศัพท์ที่ยากหรือซับซ้อน],
      "suggestions": [คำแนะนำ 1-3 ข้อในการปรับปรุงข้อความให้อ่านง่ายขึ้น]
    }
    ตอบกลับเฉพาะ JSON เท่านั้น ห้ามตอบอย่างอื่น
    """
    return generate_json_content(system_instruction, text, MODEL_NAME)

async def translate_to_plain_language(text: str) -> dict:
    system_instruction = """
    คุณเป็นผู้เชี่ยวชาญด้าน Plain Language ตามมาตรฐาน WCAG 3.1.5 Reading Level
    คุณต้องทำการแปลข้อความหรือปรับปรุงโครงสร้างข้อความที่กำหนดให้อ่านและเข้าใจง่ายที่สุด โดยยังคงเนื้อหาสำคัญไว้ครบถ้วน
    หลีกเลี่ยงการใช้คำศัพท์เฉพาะทาง ศัพท์เทคนิคที่เข้าใจยาก และประโยคซ้อนที่ซับซ้อน
    ประเมินในรูปแบบ JSON ดังนี้:
    {
      "original_text": [ข้อความต้นฉบับ],
      "simplified_text": [ข้อความที่ถูกปรับแต่งให้อ่านง่ายแล้ว],
      "changes_made": [อธิบายสั้นๆ ว่าปรับเปลี่ยนอะไรไปบ้าง 1-3 ข้อ]
    }
    ตอบกลับเฉพาะ JSON เท่านั้น ห้ามตอบอย่างอื่น
    """
    return generate_json_content(system_instruction, text, MODEL_NAME)
