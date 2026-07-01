import os
import google.generativeai as genai
from dotenv import load_dotenv

# โหลด API Key จากไฟล์ .env
load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print("❌ ไม่พบ GEMINI_API_KEY ในไฟล์ .env")
    exit()

genai.configure(api_key=api_key)

print("🔍 กำลังค้นหาโมเดลที่ API Key ของคุณรองรับ...\n")
print("-" * 30)

try:
    # ดึงรายชื่อโมเดลทั้งหมดที่รองรับฟังก์ชัน generateContent (แชท/สร้างข้อความ)
    available_models = []
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"✅ ชื่อที่ใช้งานได้: {m.name.replace('models/', '')}")
            available_models.append(m.name)
            
    if not available_models:
        print("❌ ไม่พบโมเดลที่รองรับการสร้างข้อความเลย (อาจมีปัญหาที่สิทธิ์ของ API Key)")
        
except Exception as e:
    print(f"เกิดข้อผิดพลาดในการเชื่อมต่อ: {e}")

print("-" * 30)
print("👉 ให้นำ 'ชื่อที่ใช้งานได้' ด้านบน 1 ตัว (เช่น gemini-1.5-flash) ไปใส่ในไฟล์ main.py")