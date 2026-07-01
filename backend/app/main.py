import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from .database import engine
from . import models
from app.api.router import api_router
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# โหลดค่าจากไฟล์ .env
load_dotenv()

# Setup Rate Limiter
limiter = Limiter(key_func=get_remote_address)

# Lifespan: เชื่อมต่อ DB เมื่อ server เริ่ม
@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        models.Base.metadata.create_all(bind=engine)
        print("[OK] MySQL connected and tables created.")
    except Exception as e:
        print(f"[WARN] Cannot connect to MySQL: {e}")
        print("[WARN] Running without DB - History/Templates features will not work.")
    yield

app = FastAPI(
    title="EasyPrompt AI Backend (Powered by Gemini)",
    description="API สำหรับ AI Accessibility Agent / Prompt Fitter Agent",
    version="2.0.0",
    lifespan=lifespan
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Router
app.include_router(api_router, prefix="/api")