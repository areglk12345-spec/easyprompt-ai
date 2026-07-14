from fastapi import APIRouter
from app.api.routes import auth, chat, doctor, templates, history, logs, admin, audit, two_factor, preferences, dashboard, knowledge

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(two_factor.router, prefix="/auth", tags=["2fa"])
api_router.include_router(preferences.router, prefix="/auth", tags=["preferences"])
api_router.include_router(chat.router, prefix="/chat", tags=["chat"])
api_router.include_router(doctor.router, prefix="/doctor", tags=["doctor"])
api_router.include_router(templates.router, prefix="/templates", tags=["templates"])
api_router.include_router(history.router, prefix="/history", tags=["history"])
api_router.include_router(logs.router, prefix="/logs", tags=["logs"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(audit.router, prefix="/admin", tags=["audit"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(knowledge.router, tags=["knowledge"])
