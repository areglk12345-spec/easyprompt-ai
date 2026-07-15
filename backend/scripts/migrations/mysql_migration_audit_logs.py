"""
Migration script: Create audit_logs table
Run: python mysql_migration_audit_logs.py
"""
from app.database import engine
from app.models import AuditLog

def migrate():
    AuditLog.__table__.create(engine, checkfirst=True)
    print("✅ Created table: audit_logs")

if __name__ == "__main__":
    migrate()
