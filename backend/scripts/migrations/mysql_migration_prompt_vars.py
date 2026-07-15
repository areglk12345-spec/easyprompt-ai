"""
Migration script: Create org_prompt_variables table
Run: python mysql_migration_prompt_vars.py
"""
from app.database import engine
from app.models import OrgPromptVariable

def migrate():
    OrgPromptVariable.__table__.create(engine, checkfirst=True)
    print("✅ Created table: org_prompt_variables")

if __name__ == "__main__":
    migrate()
