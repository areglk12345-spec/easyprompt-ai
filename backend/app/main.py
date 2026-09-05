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
logger = logging.getLogger("izprompt")

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
limiter = Limiter(key_func=get_remote_address, enabled=os.getenv("TESTING") != "true")

# Lifespan: เชื่อมต่อ DB เมื่อ server เริ่ม
@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        models.Base.metadata.create_all(bind=engine)
        logger.info("Database connected and tables created.")
        
        from sqlalchemy import text
        with engine.begin() as conn:
            try:
                conn.execute(text("ALTER TABLE prompt_templates ADD COLUMN is_recommended BOOLEAN DEFAULT FALSE;"))
            except Exception:
                pass
            try:
                conn.execute(text("ALTER TABLE app_users ADD COLUMN credits INTEGER DEFAULT 100;"))
            except Exception:
                pass
            try:
                conn.execute(text("ALTER TABLE app_users ADD COLUMN is_premium BOOLEAN DEFAULT FALSE;"))
            except Exception:
                pass
            try:
                conn.execute(text("ALTER TABLE prompt_templates ADD COLUMN status VARCHAR(20) DEFAULT 'approved';"))
            except Exception:
                pass
                
    except Exception as e:
        logger.warning(f"Cannot connect to Database: {e}")
        logger.warning("Running without DB - History/Templates features will not work.")
    yield

app = FastAPI(
    title="IZPrompt Backend (Powered by Gemini)",
    description="API สำหรับ AI Accessibility Agent / Prompt Fitter Agent",
    version="2.0.0",
    lifespan=lifespan
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:3001")
ALLOWED_ORIGINS = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]

# Hardcode the custom domains to guarantee it works regardless of Railway env vars
for domain in ["https://easyprompt.piravat.space", "https://ezprompt.piravat.space", "https://verbaqo.piravat.space", "https://verbaqo.com", "https://www.verbaqo.com", "https://izprompt.com", "https://www.izprompt.com", "https://izprompt.piravat.space"]:
    if domain not in ALLOWED_ORIGINS:
        ALLOWED_ORIGINS.append(domain)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global Exception on {request.url}: {exc}", exc_info=True)
    detail_msg = "เกิดข้อผิดพลาดภายในระบบ กรุณาลองใหม่อีกครั้งในภายหลัง"
    if os.getenv("TESTING") == "true":
        detail_msg += f" ({str(exc)})"
    response = JSONResponse(
        status_code=500,
        content={"detail": detail_msg}
    )
    # ServerErrorMiddleware (which dispatches this handler) sits outside CORSMiddleware,
    # so responses from here skip it entirely unless we add the headers ourselves --
    # otherwise the browser reports a CORS error instead of the real 500.
    origin = request.headers.get("origin")
    if origin in ALLOWED_ORIGINS:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Vary"] = "Origin"
    return response

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "ok", "version": "2.0.0"}

@app.get("/health/db")
def health_check_db():
    """Touches the DB so a periodic ping keeps Supabase's free-tier project from auto-pausing."""
    from sqlalchemy import text
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    return {"status": "ok", "db": "reachable"}

# Include API Router
app.include_router(api_router, prefix="/api")