from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional
from datetime import datetime

class EmailRequest(BaseModel):
    email: EmailStr = Field(..., description="Target user email address for OTP delivery")

class VerifyCodeRequest(BaseModel):
    email: EmailStr = Field(..., description="User email address")
    code: str = Field(..., min_length=6, max_length=6, pattern=r"^\d{6}$", description="6-digit verification code")

class MessageResponse(BaseModel):
    message: str
    cooldown_seconds: Optional[int] = None

class UserResponse(BaseModel):
    id: int
    email: str
    name: Optional[str] = None
    google_id: Optional[str] = None
    created_at: datetime
    last_login: Optional[datetime] = None
    is_verified: bool

    model_config = ConfigDict(from_attributes=True)

class RegisterRequest(BaseModel):
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=6, description="User password (min 6 characters)")
    name: Optional[str] = Field(None, description="User full name")

class LoginRequest(BaseModel):
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=1, description="User password")

class VerifyCodeResponse(BaseModel):
    message: str
    user: UserResponse

class GoogleAuthUrlResponse(BaseModel):
    auth_url: str

