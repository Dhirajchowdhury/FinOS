import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.models.user
import app.models.otp
import app.models.analysis_record  # noqa: F401 - register tables
from app.main import app as fastapi_app
from app.db.session import Base, get_db
from app.api.auth import get_current_user
from app.models.user import User

from tradingagents.agents.sentiment_impact import agent

_COMPANY_MD = (
    "## RELIANCE.NS News, from 2026-01-04 to 2026-01-10:\n\n"
    "### Reliance beats estimates on strong profit growth (source: Reuters)\n"
    "Strong quarterly revenue.\nLink: https://example.com/a\n\n"
    "### RBI rate hike raises inflation concerns (source: Mint)\n"
    "Macro headwind.\nLink: https://example.com/b\n\n"
)

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


@pytest.fixture(autouse=True)
def setup_database():
    # Set the get_db override per-test (not at import): test_auth.py also installs
    # a module-level override, and whichever imported last would otherwise win.
    previous = fastapi_app.dependency_overrides.get(get_db)
    fastapi_app.dependency_overrides[get_db] = override_get_db
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)
    if previous is not None:
        fastapi_app.dependency_overrides[get_db] = previous
    else:
        fastapi_app.dependency_overrides.pop(get_db, None)


@pytest.fixture
def client():
    return TestClient(fastapi_app)


@pytest.fixture
def offline_engine(monkeypatch):
    """No network and no API key: exercise the deterministic baseline."""
    monkeypatch.setattr(agent, "_fetch_news", lambda *a, **k: (_COMPANY_MD, "", []))
    monkeypatch.setattr(agent, "resolve_llm", lambda *a, **k: None)


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


def test_authenticated_analysis_execution(client, offline_engine):
    """Authenticated POST /analysis returns the versioned sentiment-impact contract."""
    fastapi_app.dependency_overrides[get_current_user] = override_get_current_user
    try:
        res = client.post(
            "/analysis",
            json={
                "entity_id": "RELIANCE.NS",
                "request": "Assess recent news sentiment and market impact for Reliance.",
                "market": "NSE India",
                "as_of_date": "2026-01-10",
            },
        )
        assert res.status_code == 200, res.text
        data = res.json()

        assert data["contract_version"] == "1.0"
        assert data["id"] == data["analysis_id"]
        assert data["request"]["entity_id"] == "RELIANCE.NS"
        assert data["data_status"] in ("AVAILABLE", "PARTIAL", "UNAVAILABLE")
        assert data["report"]["sentiment"]["source"] == "deterministic"
        assert len(data["report"]["observed_facts"]) == 2
    finally:
        fastapi_app.dependency_overrides.pop(get_current_user, None)


def test_authenticated_analysis_is_persisted(client, offline_engine):
    """The response is persisted and retrievable through the reports endpoint."""
    fastapi_app.dependency_overrides[get_current_user] = override_get_current_user
    try:
        created = client.post(
            "/analysis",
            json={
                "entity_id": "RELIANCE.NS",
                "request": "Assess recent news sentiment and market impact for Reliance.",
                "as_of_date": "2026-01-10",
            },
        ).json()

        detail = client.get(f"/reports/{created['id']}")
        assert detail.status_code == 200
        body = detail.json()
        assert body["state"]["contract_version"] == "1.0"
        assert body["final_report"]
    finally:
        fastapi_app.dependency_overrides.pop(get_current_user, None)
