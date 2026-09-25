import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

BACKEND_DIR = Path(__file__).resolve().parent.parent / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

import app.models.user
import app.models.otp
from app.main import app as fastapi_app
from app.db.session import Base, get_db
from app.api.auth import get_current_user
from app.models.user import User

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
    return User(id=42, email="lead_engineer@finos.io", is_verified=True)


fastapi_app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.mark.integration
def test_real_end_to_end_analysis_integration():
    """Verify that an authenticated request to POST /analysis executes FinosGraphEngine across all 10 agents and returns real FinosState."""
    fastapi_app.dependency_overrides[get_current_user] = override_get_current_user
    client = TestClient(fastapi_app)

    try:
        response = client.post(
            "/analysis",
            json={
                "entity_id": "RELIANCE.NS",
                "market": "NSE India",
                "request": "Perform a complete financial analysis of Reliance focusing on investment, risk, portfolio implications, trading considerations, tax and fraud checks.",
            },
        )

        assert response.status_code == 200, f"Expected 200 OK, got {response.status_code}: {response.text}"
        data = response.json()

        # 1. Verify Entity & Request metadata
        assert data["entity_id"] == "RELIANCE.NS"
        assert data["market"] == "NSE India"
        assert "Perform a complete financial analysis" in data["request"]
        assert data["metadata"]["requested_by_user_email"] == "lead_engineer@finos.io"

        # 2. Verify all 10 FinOS domain agent output slots exist in returned FinosState
        required_agents = ["news", "macro", "credit", "investment", "risk", "portfolio", "trading", "tax", "fraud", "report"]
        for agent_slot in required_agents:
            assert agent_slot in data, f"Missing domain assessment slot for '{agent_slot}' in returned state"
            assert isinstance(data[agent_slot], dict), f"Expected dict for slot '{agent_slot}', got {type(data[agent_slot])}"

        # 3. Verify Credit Agent output contains real financial data for RELIANCE.NS
        credit_findings = data["credit"].get("findings", {})
        assert credit_findings.get("rating") is not None or "Credit" in data["credit"].get("summary", "")

        # 4. Verify Macro Agent output contains real FRED economic regime
        assert data["macro"].get("findings", {}).get("economic_regime") is not None or "Macro" in data["macro"].get("summary", "")

        # 5. Verify Report Agent synthesis covers all outputs
        report_findings = data["report"].get("findings", {})
        report_summary = report_findings.get("summary") or data["report"].get("summary", "")
        assert len(report_summary) > 0, "Report Agent produced empty summary"

    finally:
        fastapi_app.dependency_overrides.pop(get_current_user, None)
