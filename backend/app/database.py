from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from dotenv import load_dotenv

load_dotenv()

raw_db_url = os.getenv("DATABASE_URL", "sqlite:///./easyprompt.db")

# Fix URL for Railway's default MySQL formats (Postgres works natively with psycopg2-binary)
if raw_db_url.startswith("postgres://"):
    raw_db_url = raw_db_url.replace("postgres://", "postgresql://", 1)
elif raw_db_url.startswith("mysql://"):
    raw_db_url = raw_db_url.replace("mysql://", "mysql+pymysql://", 1)

SQLALCHEMY_DATABASE_URL = raw_db_url
# สร้าง Engine สำหรับเชื่อมต่อ MySQL
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency สำหรับใช้ใน API Routes
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()