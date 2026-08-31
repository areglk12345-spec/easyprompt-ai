"""
Migration script: Add feedback column to prompt_activity_logs
Run: python add_feedback_column.py
"""
import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

db_url = os.getenv("DATABASE_URL")
if db_url and "pg8000" in db_url:
    db_url = db_url.replace("pg8000", "psycopg2")

engine = create_engine(db_url)

with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE prompt_activity_logs ADD COLUMN feedback VARCHAR(10);"))
        print("Added feedback column to prompt_activity_logs.")
    except Exception as e:
        print(f"Column may already exist: {e}")

    conn.commit()
    print("Done")
