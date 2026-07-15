import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv('backend/.env')
db_url = os.getenv('DATABASE_URL')
if db_url and 'pg8000' in db_url:
    db_url = db_url.replace('pg8000', 'psycopg2')

engine = create_engine(db_url)
with engine.begin() as conn:
    conn.execute(text("UPDATE org_settings SET ai_model = 'gemini-3.1-flash-lite' WHERE ai_model LIKE 'gemini-1.5%'"))
print("Done")
