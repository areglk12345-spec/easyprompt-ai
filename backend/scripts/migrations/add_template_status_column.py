"""
Migration script: Add status column to prompt_templates
Run: python add_template_status_column.py
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
        conn.execute(text("ALTER TABLE prompt_templates ADD COLUMN status VARCHAR(20) DEFAULT 'approved';"))
        print("Added status column to prompt_templates.")
    except Exception as e:
        print(f"Column may already exist: {e}")

    conn.commit()
    print("Done")
