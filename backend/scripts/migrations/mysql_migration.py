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
        conn.execute(text("ALTER TABLE app_users ADD COLUMN email VARCHAR(255);"))
        print("Column 'email' added to app_users.")
    except Exception as e:
        print(f"Error adding column email: {e}")
        
    try:
        conn.execute(text("CREATE UNIQUE INDEX ix_app_users_email ON app_users(email);"))
        print("Index 'ix_app_users_email' created.")
    except Exception as e:
        print(f"Error creating index: {e}")
    conn.commit()
print("MySQL migration completed.")
