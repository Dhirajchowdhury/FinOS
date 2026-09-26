"""Targeted unit tests for FinOS Dynamic Entity Resolution pipeline."""

import sys
from pathlib import Path
from unittest.mock import patch, MagicMock
import pytest
from fastapi import HTTPException

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from app.services.entity_resolver import resolve_entity, search_dhan_instrument_master
from app.api.analysis import run_financial_analysis, AnalysisRequest


def test_explicit_ticker():
    """1. Explicit ticker preserved directly."""
    assert resolve_entity("Analyze RELIANCE.NS") == "RELIANCE.NS"
    assert resolve_entity("Check VEDL.NS performance") == "VEDL.NS"


def test_yahoo_resolvable_company_vedanta():
    """2. Yahoo-resolvable company: Vedanta -> VEDL.NS."""
    assert resolve_entity("Analyze Vedanta") == "VEDL.NS"


def test_yahoo_resolvable_company_bharti_airtel():
    """3. Yahoo-resolvable company: Bharti Airtel -> BHARTIARTL.NS."""
    assert resolve_entity("Analyze Bharti Airtel") == "BHARTIARTL.NS"


def test_yahoo_resolvable_company_tata_motors():
    """4. Another company: Tata Motors -> valid ticker."""
    res = resolve_entity("Analyze Tata Motors")
    assert res in ("TATAMOTORS.NS", "TMPV.NS", "TMCV.NS")


def test_dhan_fallback_success(monkeypatch):
    """5. Dhan fallback: Mock Yahoo failure, mock Dhan master, candidate derived & validated."""
    monkeypatch.setattr("app.services.entity_resolver.search_yahoo_finance", lambda q, market="NSE India": None)

    fake_dhan_scrips = [
        {"SEM_EXM_EXCH_ID": "NSE", "SEM_SERIES": "EQ", "SM_SYMBOL_NAME": "SPECIAL COMPANY", "SEM_TRADING_SYMBOL": "SPECCOMP"}
    ]
    monkeypatch.setattr("app.services.entity_resolver.fetch_dhan_scrip_master", lambda: fake_dhan_scrips)
    monkeypatch.setattr("app.services.entity_resolver.validate_yahoo_ticker", lambda sym: sym == "SPECCOMP.NS")

    res = resolve_entity("Analyze Special Company")
    assert res == "SPECCOMP.NS"


def test_dhan_candidate_unresolved_by_yahoo(monkeypatch):
    """6. Dhan candidate that Yahoo cannot resolve -> candidate rejected -> unresolved."""
    monkeypatch.setattr("app.services.entity_resolver.search_yahoo_finance", lambda q, market="NSE India": None)

    fake_dhan_scrips = [
        {"SEM_EXM_EXCH_ID": "NSE", "SEM_SERIES": "EQ", "SM_SYMBOL_NAME": "INVALID SCRIP", "SEM_TRADING_SYMBOL": "INVALIDSYMBOL"}
    ]
    monkeypatch.setattr("app.services.entity_resolver.fetch_dhan_scrip_master", lambda: fake_dhan_scrips)
    monkeypatch.setattr("app.services.entity_resolver.validate_yahoo_ticker", lambda sym: False)

    res = resolve_entity("Analyze Invalid Scrip")
    assert res is None


def test_unknown_company_never_reliance():
    """7. Unknown company -> error -> NEVER RELIANCE.NS."""
    res = resolve_entity("Analyze UnknownUnicornIncXYZ99")
    assert res is None

    class MockUser:
        id = 1
        email = "test@finos.io"

    req = AnalysisRequest(request="Analyze UnknownUnicornIncXYZ99")
    with pytest.raises(HTTPException) as exc_info:
        run_financial_analysis(payload=req, current_user=MockUser(), db=None)

    assert exc_info.value.status_code == 400
    assert "Could not uniquely identify" in exc_info.value.detail or "Please provide the ticker" in exc_info.value.detail


def test_ambiguous_candidate(monkeypatch):
    """8. Ambiguous candidate -> clear ambiguity error."""
    monkeypatch.setattr("app.services.entity_resolver.search_yahoo_finance", lambda q, market="NSE India": None)
    monkeypatch.setattr("app.services.entity_resolver.fetch_dhan_scrip_master", lambda: [])

    res = resolve_entity("Analyze FooBarBaz123")
    assert res is None
