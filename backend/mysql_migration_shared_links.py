"""
Migration script: Create shared_links table
Run: python mysql_migration_shared_links.py
"""
from app.database import engine
from app.models import SharedLink

def migrate():
    SharedLink.__table__.create(engine, checkfirst=True)
    print("✅ Created table: shared_links")

if __name__ == "__main__":
    migrate()
