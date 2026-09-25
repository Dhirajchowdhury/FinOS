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
from app.models.user import User
from app.models.otp import OTPRequest

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

def test_rate_limiting_cooldown(client):
    """Test that requesting code again within 60s cooldown is rejected with 429."""
    # First request
    res1 = client.post("/auth/email/request-code", json={"email": "trader@finos.io"})
    assert res1.status_code == 200

    # Immediate second request
    res2 = client.post("/auth/email/request-code", json={"email": "trader@finos.io"})
    assert res2.status_code == 429
    assert "wait" in res2.json()["detail"].lower()

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

def test_unauthenticated_access(client):
    """Test /auth/me returns 401 when unauthenticated."""
    res = client.get("/auth/me")
    assert res.status_code == 401
