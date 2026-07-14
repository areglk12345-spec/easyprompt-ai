import os
import json
import re
import logging
from fastapi import HTTPException
from dotenv import load_dotenv

from app.core.config import MODEL_NAME
from app import models
from sqlalchemy.orm import Session

# นำเข้าไลบรารีของ Gemini
from google import genai
from google.genai import types

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("❌ ไม่พบ GEMINI_API_KEY ในไฟล์ .env กรุณาตั้งค่าก่อเริ่มต้นเซิร์ฟเวอร์")

logger = logging.getLogger("easyprompt.ai")

# สร้าง Gemini client
client = genai.Client(api_key=GEMINI_API_KEY)

def get_org_model(db: Session, organization_name: str) -> str:
    setting = db.query(models.OrganizationSetting).filter(models.OrganizationSetting.org_name == organization_name).first()
    if setting and setting.ai_model:
        return setting.ai_model
    return MODEL_NAME

def generate_stream_content(system_instruction: str, contents: any, model_name: str):
    """Helper method to call Gemini and stream response"""
    try:
        response = client.models.generate_content_stream(
            model=model_name,
            config=types.GenerateContentConfig(system_instruction=system_instruction),
            contents=contents
        )
        for chunk in response:
            if chunk.text:
                yield chunk.text
    except Exception as e:
        err_str = str(e)
        logger.error(f"Gemini API Stream Error: {err_str}")
        yield f"[ERROR] เกิดข้อผิดพลาด: {err_str}"

def generate_json_content(system_instruction: str, contents: any, model_name: str) -> dict:
    """Helper method to call Gemini and parse JSON response reliably"""
    try:
        response = client.models.generate_content(
            model=model_name,
            config=types.GenerateContentConfig(system_instruction=system_instruction),
            contents=contents
        )
        
        # คลีนข้อมูล: ตัด ```json และ ``` ออกในกรณีที่ AI แถมมาให้
        raw_text = response.text.strip()
        raw_text = re.sub(r'^```json\s*', '', raw_text)
        raw_text = re.sub(r'\s*```$', '', raw_text)
            
        # แปลงข้อความที่คลีนแล้วให้อยู่ในรูป Dictionary
        return json.loads(raw_text.strip())
        
    except Exception as e:
        err_str = str(e)
        logger.error(f"Gemini API Error: {err_str}")
        if "429" in err_str or "quota" in err_str.lower() or "limit" in err_str.lower():
            raise HTTPException(status_code=429, detail="ขณะนี้ความต้องการใช้ AI สูงเกินกำหนดชั่วคราว (ฟรีโควตา 15 ครั้งต่อนาที) กรุณารอสักครู่แล้วลองอีกครั้ง ⏳")
        raise HTTPException(status_code=500, detail=f"เกิดข้อผิดพลาดในการเชื่อมต่อกับ AI: {err_str}")

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
