from app.database import SessionLocal
from app import models
from app.auth import get_password_hash

db = SessionLocal()
admin = db.query(models.User).filter(models.User.username == 'admin').first()
if admin:
    admin.password_hash = get_password_hash('admin123')
    db.commit()
    print("Admin password updated to 'admin123'")
else:
    print("Admin user not found")
