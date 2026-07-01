import sqlite3
import os

db_path = 'easyprompt.db'
if not os.path.exists(db_path):
    print(f"Database {db_path} not found.")
else:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    try:
        cursor.execute("ALTER TABLE app_users ADD COLUMN email VARCHAR(255);")
        print("Column email added.")
    except sqlite3.OperationalError as e:
        print(f"Error adding column email: {e}")
        
    try:
        cursor.execute("CREATE UNIQUE INDEX ix_app_users_email ON app_users(email);")
        print("Index ix_app_users_email created.")
    except sqlite3.OperationalError as e:
        print(f"Error creating index: {e}")

    conn.commit()
    conn.close()
    print("Database migration completed.")
