from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Table
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from .database import Base

user_favorites = Table(
    'user_favorites', Base.metadata,
    Column('user_id', Integer, ForeignKey('app_users.id', ondelete="CASCADE"), primary_key=True),
    Column('template_id', Integer, ForeignKey('prompt_templates.id', ondelete="CASCADE"), primary_key=True)
)

class User(Base):
    __tablename__ = "app_users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=True)
    password_hash = Column(String(255))
    full_name = Column(String(100), nullable=True)
    role = Column(String(20), default="user")
    organization = Column(String(100), default="ทั่วไป")
    default_tone = Column(String(50), default="ทั่วไป")
    totp_secret = Column(String(64), nullable=True)  # TOTP secret for 2FA
    is_2fa_enabled = Column(Boolean, default=False)   # Whether 2FA is active
    credits = Column(Integer, default=100) # AI Credits
    is_premium = Column(Boolean, default=False) # Subscription tier
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    chats = relationship("ChatHistory", back_populates="user")
    templates = relationship("PromptTemplate", back_populates="creator")
    favorite_templates = relationship("PromptTemplate", secondary=user_favorites, back_populates="favorited_by")
    chat_folders = relationship("ChatFolder", back_populates="user")
    preferences = relationship("UserPreference", back_populates="user", uselist=False)

class ChatHistory(Base):
    __tablename__ = "chat_history"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(50), index=True) # เก็บ ID ของแต่ละการสนทนา
    user_message = Column(Text)
    agent_response = Column(Text)
    fitted_prompt = Column(Text, nullable=True)
    tone = Column(String(50), nullable=True)
    easy_language = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    user_id = Column(Integer, ForeignKey("app_users.id"), nullable=True)
    folder_id = Column(Integer, ForeignKey("chat_folders.id"), nullable=True)
    is_pinned = Column(Boolean, default=False)

    user = relationship("User", back_populates="chats")
    folder = relationship("ChatFolder", back_populates="chats")

class ChatFolder(Base):
    __tablename__ = "chat_folders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("app_users.id"), nullable=False)
    name = Column(String(100), nullable=False)
    color = Column(String(20), default="#6366f1")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="chat_folders")
    chats = relationship("ChatHistory", back_populates="folder")

class PromptTemplate(Base):
    __tablename__ = "prompt_templates"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(100))
    prompt_text = Column(Text)
    category = Column(String(50), default="ทั่วไป")  # หมวดหมู่: ทั่วไป, โหมดทำงาน, โหมดเรียนรู้, โหมดสร้างสรรค์
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    user_id = Column(Integer, ForeignKey("app_users.id"), nullable=True)
    is_public = Column(Boolean, default=False)
    is_recommended = Column(Boolean, default=False)
    organization = Column(String(100), default="ทั่วไป")

    creator = relationship("User", back_populates="templates")
    favorited_by = relationship("User", secondary=user_favorites, back_populates="favorite_templates")

class PromptActivityLog(Base):
    __tablename__ = "prompt_activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("app_users.id"), nullable=True)
    action = Column(String(50))  # e.g., 'generate_chat', 'generate_doctor', 'copy_prompt', 'pdf_export'
    prompt_type = Column(String(50))  # e.g., 'chat', 'doctor'
    category = Column(String(50), default="ทั่วไป")
    score = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User")

class OrganizationSetting(Base):
    __tablename__ = "org_settings"

    org_name = Column(String(100), primary_key=True, index=True)
    ai_model = Column(String(50), default="gemini-3.1-flash-lite")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("app_users.id"), nullable=True)
    action = Column(String(100))  # e.g., 'login', 'role_change', 'quota_change', 'user_delete', 'org_settings_change'
    target_user_id = Column(Integer, nullable=True)
    details = Column(Text, nullable=True)  # JSON string with extra details
    ip_address = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", foreign_keys=[user_id])

class OrgPromptVariable(Base):
    __tablename__ = "org_prompt_variables"

    id = Column(Integer, primary_key=True, index=True)
    org_name = Column(String(100), index=True, nullable=False)
    var_key = Column(String(100), nullable=False)  # e.g., 'company_name'
    var_value = Column(Text, nullable=False)  # e.g., 'บริษัท เทสต์ จำกัด'
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class SharedLink(Base):
    __tablename__ = "shared_links"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(50), index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("app_users.id"), nullable=False)
    share_token = Column(String(100), unique=True, index=True, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    expires_at = Column(DateTime, nullable=True)

    user = relationship("User")

class UserPreference(Base):
    __tablename__ = "user_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("app_users.id", ondelete="CASCADE"), unique=True, nullable=False)
    voice_control = Column(Boolean, default=True)
    email_notifications = Column(Boolean, default=True)
    push_notifications = Column(Boolean, default=False)
    weekly_reports = Column(Boolean, default=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="preferences")

class KnowledgeDocument(Base):
    __tablename__ = "knowledge_documents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("app_users.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User")