from sqlalchemy import create_engine, text
from dotenv import load_dotenv
import os

load_dotenv()
db_url = os.getenv("DATABASE_URL")
if not db_url:
    print("No DATABASE_URL found in .env")
    exit(1)

engine = create_engine(db_url)
with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE app_users ADD COLUMN default_tone VARCHAR(50) DEFAULT 'ทั่วไป';"))
        print("Column 'default_tone' added to app_users.")
    except Exception as e:
        print(f"Error adding column default_tone: {e}")
    conn.commit()
print("MySQL migration completed.")
