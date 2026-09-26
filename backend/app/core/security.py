import secrets
import hashlib
import hmac
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
import jwt
from fastapi import Request, HTTPException, status
from app.core.config import settings

def generate_secure_otp(length: int = 6) -> str:
    """
    Generates a cryptographically secure numeric OTP using Python's secrets module.
    """
    # secrets.randbelow is cryptographically secure
    code = "".join(str(secrets.randbelow(10)) for _ in range(length))
    return code

def generate_salt(length: int = 16) -> str:
    """
    Generates a random hex salt for hashing.
    """
    return secrets.token_hex(length)

def hash_otp(otp: str, salt: str) -> str:
    """
    Hashes an OTP with a salt and the server SECRET_KEY using HMAC-SHA256.
    Ensures OTP cannot be reversed even if the database is compromised.
    """
    key = settings.SECRET_KEY.encode("utf-8")
    payload = f"{salt}:{otp}".encode("utf-8")
    return hmac.new(key, payload, hashlib.sha256).hexdigest()

def verify_otp_hash(plain_otp: str, salt: str, hashed_otp: str) -> bool:
    """
    Compares the provided plain OTP against the stored hash in constant time.
    """
    computed = hash_otp(plain_otp, salt)
    return hmac.compare_digest(computed, hashed_otp)

def create_access_token(subject: str, extra_data: Optional[Dict[str, Any]] = None) -> str:
    """
    Generates a signed JWT session token.
    """
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    payload: Dict[str, Any] = {
        "sub": str(subject),
        "iat": now,
        "exp": expire,
    }
    if extra_data:
        payload.update(extra_data)
        
    encoded_jwt = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Dict[str, Any]:
    """
    Decodes and validates a JWT token. Raises HTTPException if invalid or expired.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired. Please log in again.",
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token.",
        )
def hash_password(password: str) -> str:
    """
    Hashes a password using PBKDF2-HMAC-SHA256 with 100,000 iterations and a secure random salt.
    """
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        100000,
    )
    return f"pbkdf2_sha256$100000${salt}${key.hex()}"

def verify_password(plain_password: str, password_hash: str) -> bool:
    """
    Verifies a plain password against a stored PBKDF2-HMAC-SHA256 hash in constant time.
    """
    if not password_hash or not password_hash.startswith("pbkdf2_sha256$"):
        return False
    try:
        parts = password_hash.split("$")
        if len(parts) != 4:
            return False
        iterations = int(parts[1])
        salt = parts[2]
        expected_hash = parts[3]
        
        computed_key = hashlib.pbkdf2_hmac(
            "sha256",
            plain_password.encode("utf-8"),
            salt.encode("utf-8"),
            iterations,
        ).hex()
        return hmac.compare_digest(computed_key, expected_hash)
    except Exception:
        return False
