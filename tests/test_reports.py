"""Targeted unit and integration tests for FinOS persistent reports, CSV, and PDF endpoints."""

import json
import sys
from pathlib import Path
from datetime import datetime, timezone
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from app.main import app
from app.db.session import Base, get_db
from app.models.user import User
from app.models.analysis_record import AnalysisRecord
from app.services.csv_generator import generate_report_csv
from app.services.pdf_generator import generate_report_pdf

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
def db_session():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture
def client():
    return TestClient(app)


def test_analysis_record_model(db_session):
    user = User(email="report_test@example.com", name="Report User", is_verified=True)
    db_session.add(user)
    db_session.commit()

    record = AnalysisRecord(
        id="an_test_123",
        user_id=user.id,
        request="What are the risks of RELIANCE.NS?",
        entity_id="RELIANCE.NS",
        market="NSE India",
        as_of_date="2026-09-25",
        state_json=json.dumps({"request": "What are the risks of RELIANCE.NS?"}),
        final_report="# Test Report Markdown",
        status="completed",
    )
    db_session.add(record)
    db_session.commit()

    saved = db_session.query(AnalysisRecord).filter(AnalysisRecord.id == "an_test_123").first()
    assert saved is not None
    assert saved.entity_id == "RELIANCE.NS"
    assert saved.user.email == "report_test@example.com"
    assert "AnalysisRecord" in repr(saved)


def test_csv_generator():
    class DummyRecord:
        id = "an_csv_123"
        request = "Analyze TSLA"
        entity_id = "TSLA"
        market = "NASDAQ"
        as_of_date = "2026-09-25"
        created_at = datetime.now(timezone.utc)
        status = "completed"
        final_report = "Full report text"

    state = {
        "investment": {
            "agent_name": "Investment Agent",
            "status": "ACTIVE",
            "summary": "Hold stance for TSLA",
            "findings": {"rating": "Hold"},
            "evidence": ["High EV competition"],
            "confidence": 0.8,
            "metadata": {"source": "test"},
        }
    }

    csv_out = generate_report_csv(DummyRecord(), state)
    assert "FinOS Financial Analysis Report Dossier" in csv_out
    assert "TSLA" in csv_out
    assert "Investment Agent" in csv_out
    assert "Hold stance for TSLA" in csv_out


def test_pdf_generator():
    class DummyRecord:
        id = "an_pdf_123"
        request = "Analyze NVDA"
        entity_id = "NVDA"
        market = "NASDAQ"
        as_of_date = "2026-09-25"
        created_at = datetime.now(timezone.utc)
        status = "completed"
        final_report = "Full report content for NVDA"

    state = {
        "investment": {
            "agent_name": "Investment Agent",
            "summary": "Buy stance for NVDA",
        }
    }

    pdf_bytes = generate_report_pdf(DummyRecord(), state)
    assert isinstance(pdf_bytes, bytes)
    assert pdf_bytes.startswith(b"%PDF-1.4")
    assert b"%%EOF" in pdf_bytes


@pytest.mark.integration
def test_reports_api_endpoints_ownership(client, db_session):
    # Create User 1
    user1 = User(email="user1_report@example.com", name="User One", is_verified=True)
    db_session.add(user1)
    db_session.commit()

    record1 = AnalysisRecord(
        id="an_user1_rep",
        user_id=user1.id,
        request="Query 1",
        entity_id="AAPL",
        market="NASDAQ",
        as_of_date="2026-09-25",
        state_json=json.dumps({"entity_id": "AAPL"}),
        final_report="User 1 Report Content",
        status="completed",
    )
    db_session.add(record1)

    # Create User 2
    user2 = User(email="user2_report@example.com", name="User Two", is_verified=True)
    db_session.add(user2)
    db_session.commit()

    record2 = AnalysisRecord(
        id="an_user2_rep",
        user_id=user2.id,
        request="Query 2",
        entity_id="MSFT",
        market="NASDAQ",
        as_of_date="2026-09-25",
        state_json=json.dumps({"entity_id": "MSFT"}),
        final_report="User 2 Report Content",
        status="completed",
    )
    db_session.add(record2)
    db_session.commit()

    # Log in as User 1
    from app.core.security import create_access_token
    token1 = create_access_token(subject=str(user1.id))
    client.cookies.set("finos_session", token1)

    # User 1 lists reports -> should only see user 1's report
    res_list = client.get("/reports")
    assert res_list.status_code == 200
    items = res_list.json()
    assert len(items) == 1
    assert items[0]["id"] == "an_user1_rep"

    # User 1 requests own report detail
    res_detail = client.get("/reports/an_user1_rep")
    assert res_detail.status_code == 200
    assert res_detail.json()["entity_id"] == "AAPL"

    # User 1 requests User 2's report detail -> should fail (404/ownership protected)
    res_other = client.get("/reports/an_user2_rep")
    assert res_other.status_code == 404

    # User 1 requests CSV for own report
    res_csv = client.get("/reports/an_user1_rep/csv")
    assert res_csv.status_code == 200
    assert "text/csv" in res_csv.headers["content-type"]
    assert "attachment" in res_csv.headers["content-disposition"]

    # User 1 requests PDF for own report
    res_pdf = client.get("/reports/an_user1_rep/pdf")
    assert res_pdf.status_code == 200
    assert "application/pdf" in res_pdf.headers["content-type"]
    assert "attachment" in res_pdf.headers["content-disposition"]
    assert res_pdf.content.startswith(b"%PDF-1.4")
