import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.models.user
import app.models.otp
from app.main import app as fastapi_app
from app.db.session import Base, get_db
from app.api.auth import get_current_user
from app.models.user import User

# Shared in-memory test database
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


def override_get_current_user():
    return User(id=1, email="test_analyst@finos.io", is_verified=True)


fastapi_app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def client():
    return TestClient(fastapi_app)


def test_unauthenticated_analysis_rejected():
    """Verify that POST /analysis without auth headers/session returns 401."""
    clean_app_client = TestClient(fastapi_app)
    res = clean_app_client.post("/analysis", json={"request": "Analyze Reliance"})
    assert res.status_code == 401
    assert "Authentication required" in res.json()["detail"]


def test_empty_request_rejected(client):
    """Verify that empty request prompt returns 400 Bad Request when authenticated."""
    fastapi_app.dependency_overrides[get_current_user] = override_get_current_user
    try:
        res = client.post("/analysis", json={"request": "   "})
        assert res.status_code == 400
    finally:
        fastapi_app.dependency_overrides.pop(get_current_user, None)


def test_authenticated_analysis_execution(client):
    """Verify that authenticated POST /analysis executes FinOS 10-agent engine and returns valid FinosState."""
    fastapi_app.dependency_overrides[get_current_user] = override_get_current_user
    try:
        res = client.post(
            "/analysis",
            json={
                "entity_id": "RELIANCE.NS",
                "request": "Perform a complete financial analysis of Reliance focusing on risk, investment, and credit.",
                "market": "NSE India",
            },
        )
        assert res.status_code == 200
        data = res.json()

        assert data["entity_id"] == "RELIANCE.NS"
        assert "news" in data
        assert "macro" in data
        assert "credit" in data
        assert "investment" in data
        assert "risk" in data
        assert "portfolio" in data
        assert "trading" in data
        assert "tax" in data
        assert "fraud" in data
        assert "report" in data
        assert data["metadata"]["requested_by_user_email"] == "test_analyst@finos.io"
    finally:
        fastapi_app.dependency_overrides.pop(get_current_user, None)
