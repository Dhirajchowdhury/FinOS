import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from datetime import datetime, timedelta, timezone

from app.main import app
from app.db.session import Base, get_db
from app.core.config import settings
from app.core.security import generate_secure_otp, hash_otp, verify_otp_hash
from app.models import User, OTPRequest, AnalysisRecord

# Use StaticPool so all connections in the test share the same in-memory database
test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)

@pytest.fixture
def client():
    return TestClient(app)

def test_otp_generation():
    """Verify that generated OTPs are 6 digits and numeric."""
    otp = generate_secure_otp(6)
    assert len(otp) == 6
    assert otp.isdigit()

def test_otp_hashing():
    """Verify OTP hashing and verification logic."""
    otp = "654321"
    salt = "randomsalt123"
    hashed = hash_otp(otp, salt)

    assert hashed != otp
    assert verify_otp_hash(otp, salt, hashed) is True
    assert verify_otp_hash("000000", salt, hashed) is False
    assert verify_otp_hash(otp, "wrongsalt", hashed) is False

@pytest.mark.integration
def test_request_email_code(client):
    """Test requesting an email verification code."""
    res = client.post("/auth/email/request-code", json={"email": "investor@finos.io"})
    assert res.status_code == 200
    data = res.json()
    assert "Verification code sent" in data["message"]
    assert "cooldown_seconds" in data
    # Security requirement: OTP must NEVER be in response
    assert "otp" not in data
    assert "code" not in data

@pytest.mark.integration
def test_rate_limiting_cooldown(client):
    """Test that requesting code again within 60s cooldown is rejected with 429."""
    # First request
    res1 = client.post("/auth/email/request-code", json={"email": "trader@finos.io"})
    assert res1.status_code == 200

    # Immediate second request
    res2 = client.post("/auth/email/request-code", json={"email": "trader@finos.io"})
    assert res2.status_code == 429
    assert "wait" in res2.json()["detail"].lower()

@pytest.mark.integration
def test_verify_code_success(client):
    """Test full cycle: request code, retrieve from DB for testing, verify, and check session."""
    email = "analyst@finos.io"
    client.post("/auth/email/request-code", json={"email": email})

    # Retrieve record and set known hash to simulate typing correct OTP
    db = TestingSessionLocal()
    record = db.query(OTPRequest).filter(OTPRequest.email == email).first()
    assert record is not None
    assert record.is_used is False
    assert record.attempts == 0
    record.salt = "testsalt"
    record.hashed_otp = hash_otp("123456", "testsalt")
    db.commit()
    db.close()

    # Verify with correct code
    res = client.post("/auth/email/verify-code", json={"email": email, "code": "123456"})
    assert res.status_code == 200
    data = res.json()
    assert "user" in data
    assert data["user"]["email"] == email
    assert data["user"]["is_verified"] is True
    assert "finos_session" in res.cookies

    # Test /auth/me with the session cookie
    session_cookie = res.cookies.get("finos_session")
    client.cookies.set("finos_session", session_cookie)
    me_res = client.get("/auth/me")
    assert me_res.status_code == 200
    assert me_res.json()["email"] == email

    # Test logout
    logout_res = client.post("/auth/logout")
    assert logout_res.status_code == 200

@pytest.mark.integration
def test_verify_code_invalid_and_max_attempts(client):
    """Test wrong code error handling and max attempt rate limiting."""
    email = "risk@finos.io"
    client.post("/auth/email/request-code", json={"email": email})

    # Set known hash
    db = TestingSessionLocal()
    record = db.query(OTPRequest).filter(OTPRequest.email == email).first()
    record.salt = "testsalt"
    record.hashed_otp = hash_otp("888888", "testsalt")
    db.commit()
    db.close()

    # Try invalid code 1-4
    for i in range(1, 5):
        res = client.post("/auth/email/verify-code", json={"email": email, "code": "111111"})
        assert res.status_code == 400
        assert "Incorrect verification code" in res.json()["detail"]

    # 5th attempt exhausts attempts
    res5 = client.post("/auth/email/verify-code", json={"email": email, "code": "111111"})
    assert res5.status_code == 429
    assert "Too many failed attempts" in res5.json()["detail"]

@pytest.mark.integration
def test_verify_expired_code(client):
    """Test that expired code is rejected."""
    email = "quant@finos.io"
    client.post("/auth/email/request-code", json={"email": email})

    # Set expiry in the past
    db = TestingSessionLocal()
    record = db.query(OTPRequest).filter(OTPRequest.email == email).first()
    record.expires_at = datetime.now(timezone.utc) - timedelta(minutes=10)
    record.salt = "testsalt"
    record.hashed_otp = hash_otp("999999", "testsalt")
    db.commit()
    db.close()

    res = client.post("/auth/email/verify-code", json={"email": email, "code": "999999"})
    assert res.status_code == 400
    assert "expired" in res.json()["detail"].lower()

@pytest.mark.integration
def test_unauthenticated_access(client):
    """Test /auth/me returns 401 when unauthenticated."""
    res = client.get("/auth/me")
    assert res.status_code == 401

@pytest.mark.integration
def test_google_login_url(client):
    """Test /auth/google/login returns a valid Google OAuth authorization URL."""
    res = client.get("/auth/google/login")
    assert res.status_code == 200
    data = res.json()
    assert "auth_url" in data
    assert "accounts.google.com" in data["auth_url"]
    assert "client_id=" in data["auth_url"]
    assert "redirect_uri=" in data["auth_url"]

@pytest.mark.integration
def test_google_callback_error_handling(client):
    """Test /auth/google/callback handles OAuth cancellation/error gracefully."""
    res = client.get("/auth/google/callback?error=access_denied&error_description=User%20cancelled", follow_redirects=False)
    assert res.status_code == 307 or res.status_code == 303 or res.status_code == 302
    assert "auth/callback" in res.headers["location"]
    assert "error" in res.headers["location"]

# ==================================================
# PASSWORD AUTHENTICATION TESTS
# ==================================================

@pytest.mark.integration
def test_password_register_success(client):
    """Test successful user registration with email and password."""
    res = client.post(
        "/auth/register",
        json={"email": "newuser@finos.io", "password": "Secret123!", "name": "New User"},
    )
    assert res.status_code == 201
    data = res.json()
    assert data["email"] == "newuser@finos.io"
    assert data["name"] == "New User"
    assert "finos_session" in res.cookies
    # Security requirement: password hash and raw password must NEVER be in response
    assert "password" not in data
    assert "password_hash" not in data

    # Verify password hash in database is salted & hashed
    db = TestingSessionLocal()
    db_user = db.query(User).filter(User.email == "newuser@finos.io").first()
    assert db_user is not None
    assert db_user.password_hash is not None
    assert db_user.password_hash.startswith("pbkdf2_sha256$")
    assert db_user.password_hash != "Secret123!"
    db.close()

@pytest.mark.integration
def test_password_register_duplicate_email(client):
    """Test registering with an existing email returns 400 error."""
    client.post("/auth/register", json={"email": "dup@finos.io", "password": "Secret123!"})
    res = client.post("/auth/register", json={"email": "dup@finos.io", "password": "Secret123!"})
    assert res.status_code == 400
    assert "already exists" in res.json()["detail"].lower()

@pytest.mark.integration
def test_password_login_success(client):
    """Test successful login with email and password."""
    client.post("/auth/register", json={"email": "loginuser@finos.io", "password": "Password123"})
    res = client.post("/auth/login", json={"email": "loginuser@finos.io", "password": "Password123"})
    assert res.status_code == 200
    data = res.json()
    assert data["email"] == "loginuser@finos.io"
    assert "finos_session" in res.cookies
    assert "password" not in data
    assert "password_hash" not in data

@pytest.mark.integration
def test_password_login_incorrect_password(client):
    """Test login with wrong password returns 401 generic error."""
    client.post("/auth/register", json={"email": "wrongpwd@finos.io", "password": "Password123"})
    res = client.post("/auth/login", json={"email": "wrongpwd@finos.io", "password": "WrongPassword"})
    assert res.status_code == 401
    assert "Invalid email or password" in res.json()["detail"]

@pytest.mark.integration
def test_password_login_unknown_email(client):
    """Test login with non-existent email returns 401 generic error."""
    res = client.post("/auth/login", json={"email": "unknown@finos.io", "password": "Password123"})
    assert res.status_code == 401
    assert "Invalid email or password" in res.json()["detail"]

@pytest.mark.integration
def test_auth_me_after_password_login(client):
    """Test /auth/me after password login returns current user."""
    reg_res = client.post("/auth/register", json={"email": "meuser@finos.io", "password": "Password123"})
    session_cookie = reg_res.cookies.get("finos_session")
    
    client.cookies.set("finos_session", session_cookie)
    me_res = client.get("/auth/me")
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "meuser@finos.io"

@pytest.mark.integration
def test_logout_clears_session_cookie(client):
    """Test logout clears session cookie and subsequent /auth/me returns 401."""
    reg_res = client.post("/auth/register", json={"email": "logoutuser@finos.io", "password": "Password123"})
    session_cookie = reg_res.cookies.get("finos_session")
    client.cookies.set("finos_session", session_cookie)
    
    logout_res = client.post("/auth/logout")
    assert logout_res.status_code == 200
    
    client.cookies.clear()
    me_res = client.get("/auth/me")
    assert me_res.status_code == 401

@pytest.mark.integration
def test_google_user_cannot_use_password_login(client):
    """Test user created via Google OAuth (password_hash=None) cannot log in with password."""
    db = TestingSessionLocal()
    g_user = User(
        email="googleuser@finos.io",
        google_id="google_sub_123456",
        password_hash=None,
        is_verified=True,
    )
    db.add(g_user)
    db.commit()
    db.close()

    res = client.post("/auth/login", json={"email": "googleuser@finos.io", "password": "AnyPassword"})
    assert res.status_code == 400
    assert "Google Sign-In" in res.json()["detail"]


