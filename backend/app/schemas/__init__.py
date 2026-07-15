from pydantic import BaseModel, Field, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime
import re

class UserMessage(BaseModel):
    message: str
    session_id: Optional[str] = None
    tone: Optional[str] = "ทั่วไป"
    easy_language: Optional[bool] = False
    document_id: Optional[int] = None
    model: Optional[str] = None
    files: Optional[List[dict]] = None

class RefineMessage(BaseModel):
    session_id: str
    tone: Optional[str] = "ทั่วไป"
    easy_language: Optional[bool] = False
    document_id: Optional[int] = None
    model: Optional[str] = None

class AgentResponse(BaseModel):
    status: str
    next_question: Optional[str]
    fitted_prompt: Optional[str] = ""
    prompt_fit_score: int
    score_explanation: str
    suggested_options: Optional[List[str]] = []

class TemplateCreate(BaseModel):
    title: str
    prompt_text: str
    category: Optional[str] = "ทั่วไป"
    is_public: Optional[bool] = False
    organization: Optional[str] = "ทั่วไป"

class TemplateResponse(BaseModel):
    id: int
    title: str
    prompt_text: str
    category: Optional[str] = "ทั่วไป"
    is_public: Optional[bool] = False
    is_recommended: Optional[bool] = False
    user_id: Optional[int] = None
    organization: Optional[str] = "ทั่วไป"
    is_favorite: Optional[bool] = False
    likes_count: int = 0
    class Config:
        from_attributes = True

class HistoryResponse(BaseModel):
    id: int
    session_id: str
    user_message: str
    agent_response: Optional[str] = None
    fitted_prompt: Optional[str] = None
    tone: Optional[str] = None
    easy_language: Optional[bool] = False
    user_id: Optional[int] = None
    created_at: datetime
    class Config:
        from_attributes = True

class UserRegister(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, pattern=r'^[a-zA-Z0-9_]+$')
    password: str = Field(..., min_length=8, max_length=128)
    full_name: Optional[str] = Field(None, max_length=100)
    organization: Optional[str] = Field("ทั่วไป", max_length=100)
    
    @field_validator('password')
    @classmethod
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร')
        return v

class UserLogin(BaseModel):
    username: str
    password: str

class UserProfile(BaseModel):
    id: int
    username: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    role: str
    organization: Optional[str] = "ทั่วไป"
    default_tone: Optional[str] = "ทั่วไป"
    is_2fa_enabled: Optional[bool] = False
    credits: Optional[int] = 100
    is_premium: Optional[bool] = False
    class Config:
        from_attributes = True

class UserUpdateProfile(BaseModel):
    full_name: Optional[str] = Field(None, max_length=100)
    email: Optional[EmailStr] = None
    default_tone: Optional[str] = "ทั่วไป"

class UserUpdatePassword(BaseModel):
    current_password: str
    new_password: str


class OrgSettingResponse(BaseModel):
    org_name: str
    ai_model: str

    class Config:
        from_attributes = True

class OrgSettingUpdate(BaseModel):
    ai_model: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfile

class ActivityLogCreate(BaseModel):
    action: str  # e.g., 'copy_prompt', 'pdf_export'
    prompt_type: str  # e.g., 'chat', 'doctor', 'history', 'templates'
    category: Optional[str] = "ทั่วไป"
    score: Optional[int] = None

class RecentLogSchema(BaseModel):
    id: int
    username: Optional[str] = None
    action: str
    prompt_type: str
    category: str
    score: Optional[int] = None
    created_at: datetime
    class Config:
        from_attributes = True

class DashboardStatsResponse(BaseModel):
    total_users: int
    total_prompts: int
    average_score: float
    total_exports: int
    total_copies: int
    category_distribution: dict
    action_distribution: dict
    recent_activities: List[RecentLogSchema]

class DoctorRequest(BaseModel):
    prompt_text: str
    easy_language: Optional[bool] = False
    document_id: Optional[int] = None

class DoctorResponse(BaseModel):
    prompt_fit_score: int
    strengths: List[str]
    weaknesses: List[str]
    suggestions: List[str]
    fitted_prompt: str

class TopicTrend(BaseModel):
    topic: str
    percentage: int
    description: str

class TrainingSuggestion(BaseModel):
    course_title: str
    reason: str
    syllabus: List[str]

class TrendAnalysisResponse(BaseModel):
    summary: str
    popular_topics: List[TopicTrend]
    common_mistakes: List[str]
    training_suggestions: List[TrainingSuggestion]

class UserRoleUpdate(BaseModel):
    role: str

# --- Feature 1: Advanced Dashboard ---
class DailyUsageItem(BaseModel):
    date: str
    count: int

class DailyUsageResponse(BaseModel):
    data: List[DailyUsageItem]

# --- Feature 2: Audit Logs ---
class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    username: Optional[str] = None
    action: str
    target_user_id: Optional[int] = None
    target_username: Optional[str] = None
    details: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- Feature 3: Global Prompt Variables ---
class PromptVariableCreate(BaseModel):
    var_key: str
    var_value: str

class PromptVariableResponse(BaseModel):
    id: int
    org_name: str
    var_key: str
    var_value: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- Feature 4: Chat Folders ---
class ChatFolderCreate(BaseModel):
    name: str
    color: Optional[str] = "#6366f1"

class ChatFolderResponse(BaseModel):
    id: int
    name: str
    color: str
    created_at: datetime

    class Config:
        from_attributes = True

class SessionFolderUpdate(BaseModel):
    folder_id: Optional[int] = None

class SessionPinUpdate(BaseModel):
    is_pinned: bool

# --- Feature 5: Shared Links ---
class SharedLinkResponse(BaseModel):
    id: int
    session_id: str
    share_token: str
    is_active: bool
    created_at: datetime
    expires_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class SharedSessionResponse(BaseModel):
    messages: List[HistoryResponse]
    shared_by: Optional[str] = None

# --- Feature 6: Two-Factor Authentication (2FA) ---
class TwoFactorSetupResponse(BaseModel):
    qr_code_base64: str
    secret: str
    message: str

class TwoFactorVerifyRequest(BaseModel):
    code: str

class TwoFactorLoginRequest(BaseModel):
    username: str
    totp_code: str

class TwoFactorLoginResponse(BaseModel):
    requires_2fa: bool = False
    pending_username: Optional[str] = None
    access_token: Optional[str] = None
    token_type: str = "bearer"
    user: Optional[UserProfile] = None
    message: Optional[str] = None

# --- Feature 7: User Notification Preferences ---
class UserPreferenceUpdate(BaseModel):
    voice_control: Optional[bool] = None
    email_notifications: Optional[bool] = None
    push_notifications: Optional[bool] = None
    weekly_reports: Optional[bool] = None

class UserPreferenceResponse(BaseModel):
    voice_control: bool = True
    email_notifications: bool = True
    push_notifications: bool = False
    weekly_reports: bool = True
    class Config:
        from_attributes = True

# --- Feature 8: Social Login ---
class SocialLoginRequest(BaseModel):
    id_token: str

# --- Feature 9: Knowledge Base ---
class DocumentResponse(BaseModel):
    id: int
    filename: str
    created_at: datetime

    class Config:
        from_attributes = True
