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
        conn.execute(text("""
        CREATE TABLE IF NOT EXISTS org_settings (
            org_name VARCHAR(100) PRIMARY KEY,
            ai_model VARCHAR(50) DEFAULT 'gemini-3.1-flash-lite'
        )
        """))
        print("Table 'org_settings' created or already exists.")
    except Exception as e:
        print(f"Error creating table org_settings: {e}")
    conn.commit()
print("MySQL migration completed.")
