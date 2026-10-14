"""API contract, persistence and export tests for POST /analysis (offline).

The vendor fetch is monkeypatched so the suite never touches the network and no
API key is required: the deterministic baseline is exercised end to end through
FastAPI, the DB record, and the CSV/PDF exports.
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.models.user  # noqa: F401 - register tables
import app.models.otp  # noqa: F401
import app.models.analysis_record  # noqa: F401
from app.main import app as fastapi_app
from app.db.session import Base, get_db
from app.api.auth import get_current_user
from app.models.user import User

from tradingagents.agents.sentiment_impact import agent

pytestmark = pytest.mark.unit


@pytest.fixture(autouse=True)
def _no_network():
    """Override the repo-wide network block for this module.

    Starlette's ``TestClient`` spins up an event-loop portal via
    ``socket.socketpair()`` (loopback), which the repo-wide blocker rejects. The
    vendor fetch is monkeypatched in every test here, so no external network is
    reachable regardless.
    """
    yield

_COMPANY_MD = (
    "## TCS.NS News, from 2026-01-04 to 2026-01-10:\n\n"
    "### TCS beats estimates on strong profit growth (source: Reuters)\n"
    "Strong quarterly revenue and record profit.\n"
    "Link: https://example.com/a\n\n"
    "### RBI rate hike raises inflation concerns (source: Mint)\n"
    "Macro headwind.\n"
    "Link: https://example.com/b\n\n"
)


@pytest.fixture
def test_db():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    previous_override = fastapi_app.dependency_overrides.get(get_db)
    fastapi_app.dependency_overrides[get_db] = override_get_db
    yield
    if previous_override is not None:
        fastapi_app.dependency_overrides[get_db] = previous_override
    else:
        fastapi_app.dependency_overrides.pop(get_db, None)
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def auth_client(test_db, monkeypatch):
    monkeypatch.setattr(agent, "_fetch_news", lambda *a, **k: (_COMPANY_MD, "", []))
    monkeypatch.setattr(agent, "resolve_llm", lambda *a, **k: None)
    fastapi_app.dependency_overrides[get_current_user] = lambda: User(
        id=1, email="analyst@finos.io", is_verified=True
    )
    yield TestClient(fastapi_app)
    fastapi_app.dependency_overrides.pop(get_current_user, None)


@pytest.fixture
def anon_client(test_db):
    return TestClient(fastapi_app)


def _payload():
    return {
        "entity_id": "TCS.NS",
        "request": "Assess recent news sentiment and market impact for TCS.",
        "market": "NSE India",
        "as_of_date": "2026-01-10",
    }


def test_unauthenticated_analysis_rejected(anon_client):
    res = anon_client.post("/analysis", json=_payload())
    assert res.status_code == 401


def test_empty_request_rejected(auth_client):
    res = auth_client.post("/analysis", json={"request": "   "})
    assert res.status_code == 400


def test_analysis_returns_versioned_contract(auth_client):
    res = auth_client.post("/analysis", json=_payload())
    assert res.status_code == 200, res.text
    data = res.json()

    assert data["contract_version"] == "1.0"
    assert data["id"] == data["analysis_id"]
    assert data["request"]["entity_id"] == "TCS.NS"
    assert data["data_status"] in ("AVAILABLE", "PARTIAL", "UNAVAILABLE")

    report = data["report"]
    for key in (
        "observed_facts",
        "sentiment",
        "events",
        "impact_hypotheses",
        "data_quality",
        "unavailable_evidence",
    ):
        assert key in report

    assert report["sentiment"]["source"] == "deterministic"
    assert len(report["observed_facts"]) == 2
    assert report["observed_facts"][0]["evidence_id"] == "ev_1"
    assert report["events"]
    assert report["impact_hypotheses"]


def test_analysis_is_persisted_and_retrievable(auth_client):
    created = auth_client.post("/analysis", json=_payload()).json()
    record_id = created["id"]

    listing = auth_client.get("/reports")
    assert listing.status_code == 200
    ids = {item["id"] for item in listing.json()}
    assert record_id in ids

    detail = auth_client.get(f"/reports/{record_id}")
    assert detail.status_code == 200
    body = detail.json()
    assert body["entity_id"] == "TCS.NS"
    assert body["final_report"]
    assert body["state"]["contract_version"] == "1.0"
    assert body["state"]["report"]["sentiment"]["band"]


def test_report_detail_404_for_unknown_id(auth_client):
    res = auth_client.get("/reports/an_does_not_exist")
    assert res.status_code == 404


def test_csv_export_contains_report_sections(auth_client):
    record_id = auth_client.post("/analysis", json=_payload()).json()["id"]
    res = auth_client.get(f"/reports/{record_id}/csv")
    assert res.status_code == 200
    assert "text/csv" in res.headers["content-type"]
    body = res.text
    assert "OBSERVED FACTS" in body
    assert "IMPACT HYPOTHESES (unverified)" in body


def test_pdf_export_is_a_pdf_document(auth_client):
    record_id = auth_client.post("/analysis", json=_payload()).json()["id"]
    res = auth_client.get(f"/reports/{record_id}/pdf")
    assert res.status_code == 200
    assert res.headers["content-type"] == "application/pdf"
    assert res.content.startswith(b"%PDF-1.4")


def test_vendor_failure_degrades_to_unavailable(auth_client, monkeypatch):
    monkeypatch.setattr(
        agent,
        "_fetch_news",
        lambda *a, **k: (
            "NO_DATA_AVAILABLE: No usable market data for 'TCS.NS'.",
            "DATA_UNAVAILABLE: no configured vendor could serve get_global_news.",
            [],
        ),
    )
    data = auth_client.post("/analysis", json=_payload()).json()
    assert data["data_status"] == "UNAVAILABLE"
    assert data["report"]["observed_facts"] == []
    assert data["report"]["sentiment"]["source"] == "none"
