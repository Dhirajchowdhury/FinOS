from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from typing import Optional

from app.db.session import get_db
from app.core.config import settings
from app.core.security import create_access_token, decode_access_token
from app.schemas.auth import (
    EmailRequest,
    VerifyCodeRequest,
    MessageResponse,
    UserResponse,
    VerifyCodeResponse,
    GoogleAuthUrlResponse,
    RegisterRequest,
    LoginRequest,
)
from app.services.auth_service import auth_service
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])

COOKIE_NAME = "finos_session"

def set_auth_cookie(response: Response, token: str):
    """
    Sets a secure, HttpOnly session cookie containing the JWT.
    """
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        httponly=True,
        samesite="lax",
        secure=False,  # Set to True when running over HTTPS in production
        path="/",
    )

def clear_auth_cookie(response: Response):
    """
    Clears the session cookie.
    """
    response.delete_cookie(
        key=COOKIE_NAME,
        path="/",
        httponly=True,
        samesite="lax",
    )

def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    """
    Dependency to authenticate requests via the HttpOnly finos_session cookie.
    """
    token = request.cookies.get(COOKIE_NAME)
    has_cookie = token is not None

    if not token:
        # Also check Authorization header as fallback
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]

    if not token:
        print(f"[AUTH DIAGNOSTIC] GET /auth/me -> 401 Unauthorized (has_cookie={has_cookie})")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. No active session.",
        )

    payload = decode_access_token(token)
    user_id = payload.get("sub")
    if not user_id:
        print(f"[AUTH DIAGNOSTIC] GET /auth/me -> 401 Malformed Token (has_cookie={has_cookie})")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed session token.",
        )

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        print(f"[AUTH DIAGNOSTIC] GET /auth/me -> 401 User Not Found ID={user_id} (has_cookie={has_cookie})")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or account removed.",
        )

    masked_email = user.email[:3] + "***@" + user.email.split("@")[-1] if user.email and "@" in user.email else "user"
    print(f"[AUTH DIAGNOSTIC] GET /auth/me -> 200 OK User ID={user.id} Email={masked_email} (has_cookie={has_cookie})")
    return user

@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
    description="Registers a new account using email and password, creates user, and sets HttpOnly session cookie.",
)
def register(
    payload: RegisterRequest,
    response: Response,
    db: Session = Depends(get_db),
):
    user = auth_service.register_user(db, payload.email, payload.password, payload.name)
    token = create_access_token(
        subject=str(user.id),
        extra_data={"email": user.email, "verified": user.is_verified},
    )
    set_auth_cookie(response, token)
    return UserResponse.model_validate(user)

@router.post(
    "/login",
    response_model=UserResponse,
    summary="Authenticate user with email and password",
    description="Authenticates credentials, updates last login timestamp, and sets HttpOnly session cookie.",
)
def login(
    payload: LoginRequest,
    response: Response,
    db: Session = Depends(get_db),
):
    user = auth_service.authenticate_user(db, payload.email, payload.password)
    token = create_access_token(
        subject=str(user.id),
        extra_data={"email": user.email, "verified": user.is_verified},
    )
    set_auth_cookie(response, token)
    return UserResponse.model_validate(user)


@router.post(
    "/email/request-code",
    response_model=MessageResponse,
    summary="Request 6-digit email verification code",
    description="Generates a cryptographically random 6-digit OTP and dispatches it to the given email.",
)
def request_verification_code(payload: EmailRequest, db: Session = Depends(get_db)):
    cooldown = auth_service.request_otp(db, payload.email)
    return MessageResponse(
        message="Verification code sent successfully.",
        cooldown_seconds=cooldown,
    )

@router.post(
    "/email/verify-code",
    response_model=VerifyCodeResponse,
    summary="Verify 6-digit code and create session",
    description="Validates the OTP against the stored salted hash. On success, issues an HttpOnly session cookie.",
)
def verify_code(
    payload: VerifyCodeRequest,
    response: Response,
    db: Session = Depends(get_db),
):
    user = auth_service.verify_otp(db, payload.email, payload.code)
    
    # Generate signed JWT session token
    token = create_access_token(
        subject=str(user.id),
        extra_data={"email": user.email, "verified": user.is_verified},
    )
    
    # Set HttpOnly session cookie
    set_auth_cookie(response, token)
    
    return VerifyCodeResponse(
        message="Verification successful. Welcome to FinOS.",
        user=UserResponse.model_validate(user),
    )

@router.get(
    "/google/login",
    response_model=GoogleAuthUrlResponse,
    summary="Get Google OAuth authorization URL",
    description="Returns the Google OAuth 2.0 redirection URL.",
)
def google_login():
    auth_url = auth_service.get_google_auth_url()
    return GoogleAuthUrlResponse(auth_url=auth_url)

@router.get(
    "/google/callback",
    summary="Google OAuth 2.0 callback",
    description="Exchanges the Google authorization code, authenticates or creates user, and sets session cookie.",
)
async def google_callback(
    request: Request,
    code: Optional[str] = None,
    error: Optional[str] = None,
    error_description: Optional[str] = None,
    state: Optional[str] = None,
    db: Session = Depends(get_db),
):
    print(f"[OAUTH STEP 1] Callback reached: code_present={code is not None}, state_present={state is not None}, error_present={error is not None}")

    if error or not code:
        err_msg = error_description or error or "Google authorization failed."
        print(f"[OAUTH STEP 1 FAIL] {err_msg}")
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/auth/callback?error={err_msg}"
        )

    try:
        user = await auth_service.exchange_google_code(db, code)
        print(f"[OAUTH STEP 4] User lookup/create success: user_id={user.id}")

        token = create_access_token(
            subject=str(user.id),
            extra_data={"email": user.email, "verified": user.is_verified},
        )
        print("[OAUTH STEP 5] JWT creation success")
        
        redirect = RedirectResponse(
            url=f"{settings.FRONTEND_URL}/dashboard",
            status_code=status.HTTP_303_SEE_OTHER,
        )
        set_auth_cookie(redirect, token)
        print("[OAUTH STEP 6] Cookie set success, redirecting to /dashboard")
        return redirect
    except HTTPException as e:
        print(f"[OAUTH FAIL HTTP_ERROR] detail={e.detail}")
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/auth/callback?error={e.detail}"
        )
    except Exception as e:
        print(f"[OAUTH FAIL UNEXPECTED_ERROR] type={type(e).__name__} msg={str(e)}")
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/auth/callback?error=Authentication%20failed"
        )

@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get currently authenticated user",
    description="Validates session cookie and retrieves the current user profile.",
)
def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)

@router.post(
    "/logout",
    response_model=MessageResponse,
    summary="Log out and destroy session",
    description="Invalidates the session by clearing the HttpOnly cookie.",
)
def logout(response: Response):
    clear_auth_cookie(response)
    return MessageResponse(message="Successfully logged out of FinOS.")
