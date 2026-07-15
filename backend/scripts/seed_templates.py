import os
import sys

# Add parent dir to path so we can import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models import PromptTemplate

mock_templates = [
    {
        "title": "เขียนอีเมลเชิงธุรกิจ",
        "prompt_text": "ช่วยเขียนอีเมลเชิงธุรกิจถึงลูกค้าเพื่อแจ้งการอัปเดตระบบใหม่ โดยใช้ภาษาที่สุภาพและเป็นทางการ",
        "category": "โหมดทำงาน",
        "is_public": True,
        "is_recommended": True
    },
    {
        "title": "สรุปรายงานการประชุม",
        "prompt_text": "ช่วยสรุปรายงานการประชุมจากข้อความต่อไปนี้เป็นหัวข้อย่อยๆ ให้เข้าใจง่าย: [ใส่เนื้อหาที่นี่]",
        "category": "โหมดทำงาน",
        "is_public": True,
        "is_recommended": True
    },
    {
        "title": "ช่วยอธิบายโค้ด",
        "prompt_text": "กรุณาอธิบายโค้ดชุดนี้ให้ฟังหน่อยว่าทำงานอย่างไร และมีจุดไหนที่ควรปรับปรุงบ้าง: [ใส่โค้ดที่นี่]",
        "category": "โหมดเรียนรู้",
        "is_public": True,
        "is_recommended": True
    },
    {
        "title": "วางแผนการเดินทาง",
        "prompt_text": "ช่วยวางแผนทริปท่องเที่ยวประเทศญี่ปุ่นเป็นเวลา 5 วัน 4 คืน โดยเน้นเที่ยวในโตเกียวและรอบๆ สำหรับครอบครัวที่มีเด็ก",
        "category": "ทั่วไป",
        "is_public": True,
        "is_recommended": False
    },
    {
        "title": "คิดคอนเทนต์ลง Social Media",
        "prompt_text": "ช่วยคิดไอเดียโพสต์ลง Facebook จำนวน 3 โพสต์ เพื่อโปรโมทสินค้าใหม่เป็น 'กาแฟสกัดเย็น' โดยมีกลุ่มเป้าหมายเป็นวัยทำงาน",
        "category": "โหมดสร้างสรรค์",
        "is_public": True,
        "is_recommended": True
    },
    {
        "title": "เขียนสคริปต์วิดีโอสั้น",
        "prompt_text": "ช่วยเขียนสคริปต์สำหรับถ่าย TikTok ความยาวไม่เกิน 1 นาที หัวข้อ '3 ทริคประหยัดเงินมนุษย์เงินเดือน'",
        "category": "โหมดสร้างสรรค์",
        "is_public": True,
        "is_recommended": False
    },
    {
        "title": "เตรียมตัวสัมภาษณ์งาน",
        "prompt_text": "ช่วยจำลองการสัมภาษณ์งานในตำแหน่ง Marketing Executive โดยตั้งคำถามที่มักพบบ่อยมา 5 ข้อ พร้อมแนะนำแนวทางการตอบ",
        "category": "โหมดทำงาน",
        "is_public": True,
        "is_recommended": False
    },
    {
        "title": "อธิบายศัพท์เทคนิค",
        "prompt_text": "ช่วยอธิบายคำว่า 'Blockchain' ให้คนที่ไม่เก่งคอมพิวเตอร์ฟัง แล้วเข้าใจได้ภายใน 2 นาที",
        "category": "โหมดเรียนรู้",
        "is_public": True,
        "is_recommended": True
    },
    {
        "title": "แปลภาษา (แบบสละสลวย)",
        "prompt_text": "ช่วยแปลข้อความต่อไปนี้เป็นภาษาอังกฤษ โดยใช้ระดับภาษาที่เป็นทางการและเป็นธรรมชาติ: [ใส่ข้อความที่นี่]",
        "category": "ทั่วไป",
        "is_public": True,
        "is_recommended": True
    },
    {
        "title": "ตรวจสอบ Grammar",
        "prompt_text": "ช่วยตรวจสอบไวยากรณ์ภาษาอังกฤษในประโยคต่อไปนี้ และแก้ไขให้ถูกต้องพร้อมอธิบายเหตุผล: [ใส่ประโยคที่นี่]",
        "category": "โหมดเรียนรู้",
        "is_public": True,
        "is_recommended": False
    }
]

def seed_templates():
    db = SessionLocal()
    try:
        # Check existing templates to avoid duplicates
        existing_titles = {t.title for t in db.query(PromptTemplate).all()}
        
        count = 0
        for item in mock_templates:
            if item["title"] not in existing_titles:
                new_template = PromptTemplate(
                    title=item["title"],
                    prompt_text=item["prompt_text"],
                    category=item["category"],
                    is_public=item["is_public"],
                    is_recommended=item["is_recommended"],
                    organization="ทั่วไป"
                )
                db.add(new_template)
                count += 1
        
        db.commit()
        print(f"Successfully seeded {count} new templates!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding templates: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_templates()
