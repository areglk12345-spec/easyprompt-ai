import argparse
import os
import pymysql
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Try loading env from parent directory (if run from scripts/) or current directory
if os.path.exists('.env'):
    load_dotenv('.env')
elif os.path.exists('../.env'):
    load_dotenv('../.env')
elif os.path.exists('../../backend/.env'):
    load_dotenv('../../backend/.env')

def get_engine():
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        # Fallback for old local mysql connection
        db_url = 'mysql+pymysql://root:@localhost/easyprompt_db'
        
    if db_url and 'pg8000' in db_url:
        db_url = db_url.replace('pg8000', 'psycopg2')
    return create_engine(db_url)

def list_users():
    engine = get_engine()
    with engine.begin() as conn:
        users = conn.execute(text("SELECT id, username, email, role FROM app_users")).fetchall()
        print(f"{'ID':<5} | {'Username':<30} | {'Email':<30} | {'Role':<10}")
        print("-" * 85)
        for u in users:
            print(f"{u.id:<5} | {u.username:<30} | {str(u.email):<30} | {u.role:<10}")

def list_admins():
    engine = get_engine()
    with engine.begin() as conn:
        admins = conn.execute(text("SELECT id, username, email, role FROM app_users WHERE role='admin'")).fetchall()
        print(f"{'ID':<5} | {'Username':<30} | {'Email':<30} | {'Role':<10}")
        print("-" * 85)
        for u in admins:
            print(f"{u.id:<5} | {u.username:<30} | {str(u.email):<30} | {u.role:<10}")

def make_admin(username: str):
    engine = get_engine()
    with engine.begin() as conn:
        res = conn.execute(text("UPDATE app_users SET role = 'admin' WHERE username = :u"), {"u": username})
        if res.rowcount > 0:
            print(f"Success: Updated role of '{username}' to admin.")
        else:
            print(f"Error: User '{username}' not found.")

def update_pwd(username: str, pwd: str):
    # requires app.auth, needs to be run in context of fastapi app
    try:
        from app.database import SessionLocal
        from app import models
        from app.auth import get_password_hash
    except ImportError:
        import sys
        sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        from app.database import SessionLocal
        from app import models
        from app.auth import get_password_hash

    db = SessionLocal()
    user = db.query(models.User).filter(models.User.username == username).first()
    if user:
        user.password_hash = get_password_hash(pwd)
        db.commit()
        print(f"Success: Password for '{username}' updated.")
    else:
        print(f"Error: User '{username}' not found.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Manage EasyPrompt Users")
    subparsers = parser.add_subparsers(dest="command")

    # list
    parser_list = subparsers.add_parser("list", help="List all users")
    
    # admins
    parser_admins = subparsers.add_parser("admins", help="List admin users")

    # make-admin
    parser_make = subparsers.add_parser("make-admin", help="Make a user an admin")
    parser_make.add_argument("username", help="Username/Email to make admin")

    # update-pwd
    parser_pwd = subparsers.add_parser("update-pwd", help="Update a user's password")
    parser_pwd.add_argument("username", help="Username/Email")
    parser_pwd.add_argument("password", help="New password")

    args = parser.parse_args()

    if args.command == "list":
        list_users()
    elif args.command == "admins":
        list_admins()
    elif args.command == "make-admin":
        make_admin(args.username)
    elif args.command == "update-pwd":
        update_pwd(args.username, args.password)
    else:
        parser.print_help()
