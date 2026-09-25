from datetime import datetime, timedelta, timezone
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
import httpx
import secrets

from app.core.config import settings
from app.core.security import (
    generate_secure_otp,
    generate_salt,
    hash_otp,
    verify_otp_hash,
)
from app.models.user import User
from app.models.otp import OTPRequest
from app.services.email_service import email_service

def ensure_utc(dt: Optional[datetime]) -> Optional[datetime]:
    """
    Normalizes a datetime to be timezone-aware in UTC, handling SQLite naive datetimes.
    """
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)

class AuthService:
    def request_otp(self, db: Session, email: str) -> int:
        """
        Validates rate limiting, creates a secure hashed OTP record, and dispatches it via email.
        Returns the cooldown duration in seconds.
        """
        now = datetime.now(timezone.utc)
        normalized_email = email.strip().lower()

        # Check for recent active OTP within cooldown window
        cooldown_threshold = now - timedelta(seconds=settings.OTP_COOLDOWN_SECONDS)
        recent_request = (
            db.query(OTPRequest)
            .filter(
                OTPRequest.email == normalized_email,
                OTPRequest.is_used == False,
                OTPRequest.created_at >= cooldown_threshold,
            )
            .order_by(OTPRequest.created_at.desc())
            .first()
        )

        if recent_request:
            created_at_utc = ensure_utc(recent_request.created_at)
            elapsed = (now - created_at_utc).total_seconds()
            remaining = int(settings.OTP_COOLDOWN_SECONDS - elapsed)
            if remaining > 0:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Please wait {remaining} seconds before requesting a new verification code.",
                )

        # Invalidate any previously active OTPs for this email address
        db.query(OTPRequest).filter(
            OTPRequest.email == normalized_email,
            OTPRequest.is_used == False,
        ).update({"is_used": True})
        db.commit()

        # Generate cryptographically secure 6-digit OTP and unique salt
        raw_otp = generate_secure_otp(length=6)
        salt = generate_salt(length=16)
        hashed_otp = hash_otp(raw_otp, salt)
        expires_at = now + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)

        otp_record = OTPRequest(
            email=normalized_email,
            hashed_otp=hashed_otp,
            salt=salt,
            attempts=0,
            is_used=False,
            expires_at=expires_at,
            created_at=now,
        )
        db.add(otp_record)
        db.commit()

        # Dispatch via email service
        email_service.send_verification_otp(normalized_email, raw_otp)

        return settings.OTP_COOLDOWN_SECONDS

    def verify_otp(self, db: Session, email: str, code: str) -> User:
        """
        Verifies the user-submitted OTP against the stored salted hash.
        Enforces expiration and maximum attempt limits.
        """
        now = datetime.now(timezone.utc)
        normalized_email = email.strip().lower()

        # Fetch latest active OTP request for this email
        otp_record = (
            db.query(OTPRequest)
            .filter(
                OTPRequest.email == normalized_email,
                OTPRequest.is_used == False,
            )
            .order_by(OTPRequest.created_at.desc())
            .first()
        )

        if not otp_record:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No active verification code found. Please request a new code.",
            )

        # Check expiration
        record_expires_at = ensure_utc(otp_record.expires_at)
        if now > record_expires_at:
            otp_record.is_used = True
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This verification code has expired. Request a new code.",
            )

        # Check maximum attempts
        if otp_record.attempts >= settings.OTP_MAX_ATTEMPTS:
            otp_record.is_used = True
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many failed attempts. For your security, this code is now invalid. Please request a new code.",
            )

        # Verify hash
        is_valid = verify_otp_hash(code, otp_record.salt, otp_record.hashed_otp)
        if not is_valid:
            otp_record.attempts += 1
            remaining = settings.OTP_MAX_ATTEMPTS - otp_record.attempts
            if remaining <= 0:
                otp_record.is_used = True
                db.commit()
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Too many failed attempts. This code is now invalid. Please request a new code.",
                )
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Incorrect verification code. Please try again. ({remaining} attempts remaining)",
            )

        # Mark OTP as consumed
        otp_record.is_used = True

        # Find or create user
        user = db.query(User).filter(User.email == normalized_email).first()
        if not user:
            user = User(
                email=normalized_email,
                is_verified=True,
                created_at=now,
                last_login=now,
            )
            db.add(user)
        else:
            user.is_verified = True
            user.last_login = now

        db.commit()
        db.refresh(user)
        return user

    def get_google_auth_url(self) -> str:
        from app.core.config import Settings
        cfg = Settings()
        if not cfg.GOOGLE_CLIENT_ID or not cfg.GOOGLE_CLIENT_SECRET:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Google OAuth credentials are not configured. "
                    "Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in backend/.env."
                ),
            )

        state = secrets.token_urlsafe(16)
        params = {
            "client_id": cfg.GOOGLE_CLIENT_ID,
            "redirect_uri": cfg.GOOGLE_REDIRECT_URI,
            "response_type": "code",
            "scope": "openid email profile",
            "access_type": "offline",
            "prompt": "select_account",
            "state": state,
        }
        query_string = "&".join(f"{k}={v}" for k, v in params.items())
        return f"https://accounts.google.com/o/oauth2/v2/auth?{query_string}"

    async def exchange_google_code(self, db: Session, code: str) -> User:
        """
        Exchanges Google OAuth code for tokens and fetches user profile.
        """
        from app.core.config import Settings
        cfg = Settings()
        if not cfg.GOOGLE_CLIENT_ID or not cfg.GOOGLE_CLIENT_SECRET:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Google OAuth is not configured on the backend.",
            )

        token_url = "https://oauth2.googleapis.com/token"
        data = {
            "client_id": cfg.GOOGLE_CLIENT_ID,
            "client_secret": cfg.GOOGLE_CLIENT_SECRET,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": cfg.GOOGLE_REDIRECT_URI,
        }

        async with httpx.AsyncClient() as client:
            token_resp = await client.post(token_url, data=data, timeout=10)
            if token_resp.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to authenticate with Google. Invalid authorization code.",
                )
            
            token_data = token_resp.json()
            access_token = token_data.get("access_token")

            # Fetch user info
            userinfo_url = "https://www.googleapis.com/oauth2/v3/userinfo"
            headers = {"Authorization": f"Bearer {access_token}"}
            userinfo_resp = await client.get(userinfo_url, headers=headers, timeout=10)
            if userinfo_resp.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to retrieve user profile from Google.",
                )

            profile = userinfo_resp.json()

        google_id = profile.get("sub")
        email = profile.get("email")
        name = profile.get("name")

        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Google account does not have a verified email address.",
            )

        now = datetime.now(timezone.utc)
        normalized_email = email.strip().lower()

        # Find by google_id or email
        user = (
            db.query(User)
            .filter((User.google_id == google_id) | (User.email == normalized_email))
            .first()
        )

        if not user:
            user = User(
                email=normalized_email,
                name=name,
                google_id=google_id,
                is_verified=True,
                created_at=now,
                last_login=now,
            )
            db.add(user)
        else:
            user.google_id = google_id
            if name and not user.name:
                user.name = name
            user.is_verified = True
            user.last_login = now

        db.commit()
        db.refresh(user)
        return user

auth_service = AuthService()
