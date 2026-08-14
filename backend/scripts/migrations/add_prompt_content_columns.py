"""
Migration script: Add raw_prompt / polished_prompt columns to prompt_activity_logs
Run: python add_prompt_content_columns.py
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
        conn.execute(text("ALTER TABLE prompt_activity_logs ADD COLUMN raw_prompt TEXT;"))
        print("Added raw_prompt column to prompt_activity_logs.")
    except Exception as e:
        print(f"Column may already exist: {e}")

    try:
        conn.execute(text("ALTER TABLE prompt_activity_logs ADD COLUMN polished_prompt TEXT;"))
        print("Added polished_prompt column to prompt_activity_logs.")
    except Exception as e:
        print(f"Column may already exist: {e}")

    conn.commit()
    print("Done")
