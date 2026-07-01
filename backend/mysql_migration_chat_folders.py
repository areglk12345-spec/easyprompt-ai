"""
Migration script: Create chat_folders table + add folder_id, is_pinned columns to chat_history
Run: python mysql_migration_chat_folders.py
"""
from app.database import engine
from app.models import ChatFolder
from sqlalchemy import text

def migrate():
    # Create chat_folders table
    ChatFolder.__table__.create(engine, checkfirst=True)
    print("✅ Created table: chat_folders")
    
    # Add columns to chat_history
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE chat_history ADD COLUMN folder_id INTEGER REFERENCES chat_folders(id)"))
            print("✅ Added column: chat_history.folder_id")
        except Exception as e:
            if "duplicate column" in str(e).lower() or "already exists" in str(e).lower():
                print("⏭️ Column folder_id already exists, skipping")
            else:
                print(f"⚠️ Error adding folder_id: {e}")
        
        try:
            conn.execute(text("ALTER TABLE chat_history ADD COLUMN is_pinned BOOLEAN DEFAULT 0"))
            print("✅ Added column: chat_history.is_pinned")
        except Exception as e:
            if "duplicate column" in str(e).lower() or "already exists" in str(e).lower():
                print("⏭️ Column is_pinned already exists, skipping")
            else:
                print(f"⚠️ Error adding is_pinned: {e}")
        
        conn.commit()

if __name__ == "__main__":
    migrate()
