import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from .database import engine
from . import models
from app.api.router import api_router
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import firebase_admin
from firebase_admin import credentials

# โหลดค่าจากไฟล์ .env
load_dotenv()

# Setup Logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("easyprompt")

# Initialize Firebase Admin
try:
    firebase_base64 = os.getenv("FIREBASE_SERVICE_ACCOUNT_BASE64")
    if firebase_base64:
        import base64
        import json
        decoded = base64.b64decode(firebase_base64).decode('utf-8')
        cred = credentials.Certificate(json.loads(decoded))
    else:
        cred = credentials.Certificate("firebase-service-account.json")
    firebase_admin.initialize_app(cred)
    logger.info("Firebase Admin initialized successfully.")
except Exception as e:
    logger.error(f"Failed to initialize Firebase Admin: {e}")

# Setup Rate Limiter
limiter = Limiter(key_func=get_remote_address)

# Lifespan: เชื่อมต่อ DB เมื่อ server เริ่ม
@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        models.Base.metadata.create_all(bind=engine)
        logger.info("Database connected and tables created.")
    except Exception as e:
        logger.warning(f"Cannot connect to Database: {e}")
        logger.warning("Running without DB - History/Templates features will not work.")
    yield

app = FastAPI(
    title="EasyPrompt AI Backend (Powered by Gemini)",
    description="API สำหรับ AI Accessibility Agent / Prompt Fitter Agent",
    version="2.0.0",
    lifespan=lifespan
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import logging
    logging.error(f"Global Exception on {request.url}: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "เกิดข้อผิดพลาดภายในระบบ กรุณาลองใหม่อีกครั้ง"}
    )

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:3001").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["Authorization", "Content-Type"],
)

@app.get("/health")
def health_check():
    return {"status": "ok", "version": "2.0.0"}

# Include API Router
app.include_router(api_router, prefix="/api")