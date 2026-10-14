"""End-to-end orchestration tests for the sentiment-impact agent (no network)."""

import pytest

from tradingagents.agents.sentiment_impact import agent
from tradingagents.agents.sentiment_impact.schemas import ReportStatus, SentimentSource

pytestmark = pytest.mark.unit

_COMPANY_MD = (
    "## TCS.NS News, from 2026-01-04 to 2026-01-10:\n\n"
    "### TCS beats estimates on strong profit growth (source: Reuters)\n"
    "Strong quarterly revenue and record profit lifted the stock.\n"
    "Link: https://example.com/a\n\n"
    "### TCS launches new AI platform (source: Mint)\n"
    "The product launch was well received.\n"
    "Link: https://example.com/b\n\n"
)

_GLOBAL_MD = (
    "## Global News\n\n"
    "### Fed signals rate cut as inflation eases (source: Bloomberg)\n"
    "Macro backdrop improves.\n"
    "Link: https://example.com/c\n\n"
)


def _patch_fetch(monkeypatch, company_raw, global_raw, errors=None):
    monkeypatch.setattr(
        agent, "_fetch_news", lambda *a, **k: (company_raw, global_raw, errors or [])
    )
    # No LLM in these tests; keep the deterministic baseline authoritative.
    monkeypatch.setattr(agent, "resolve_llm", lambda *a, **k: None)


def test_run_offline_builds_evidence_backed_report(monkeypatch):
    _patch_fetch(monkeypatch, _COMPANY_MD, _GLOBAL_MD)
    resp = agent.run_sentiment_impact(
        entity_id="TCS.NS", as_of_date="2026-01-10", window_days=7, build_llm=False
    )

    assert resp.contract_version == "1.0"
    assert resp.request.entity_id == "TCS.NS"
    assert resp.data_status in (ReportStatus.AVAILABLE, ReportStatus.PARTIAL)
    assert len(resp.report.observed_facts) == 3
    assert resp.report.sentiment.source is SentimentSource.DETERMINISTIC
    assert resp.report.sentiment.score is not None
    assert resp.report.events
    assert resp.report.impact_hypotheses

    evidence_ids = {ref.evidence_id for ref in resp.report.observed_facts}
    for event in resp.report.events:
        assert set(event.evidence_ids) <= evidence_ids
    for path in resp.report.impact_hypotheses:
        assert set(path.supporting_evidence_ids) <= evidence_ids
        assert path.is_verified is False

    capabilities = {item.capability for item in resp.report.unavailable_evidence}
    assert "llm_enrichment" in capabilities


def test_run_without_news_is_unavailable(monkeypatch):
    _patch_fetch(monkeypatch, "", "")
    resp = agent.run_sentiment_impact(
        entity_id="TCS.NS", as_of_date="2026-01-10", window_days=7, build_llm=False
    )

    assert resp.data_status is ReportStatus.UNAVAILABLE
    assert resp.report.observed_facts == []
    assert resp.report.sentiment.source is SentimentSource.NONE
    assert resp.report.sentiment.score is None
    capabilities = {item.capability for item in resp.report.unavailable_evidence}
    assert {"company_news", "global_news"}.issubset(capabilities)


def test_run_with_vendor_sentinels_is_unavailable(monkeypatch):
    _patch_fetch(
        monkeypatch,
        "NO_DATA_AVAILABLE: No usable market data for 'TCS.NS'. Do not fabricate.",
        "DATA_UNAVAILABLE: no configured vendor could serve get_global_news right now.",
    )
    resp = agent.run_sentiment_impact(
        entity_id="TCS.NS", as_of_date="2026-01-10", window_days=7, build_llm=False
    )

    assert resp.data_status is ReportStatus.UNAVAILABLE
    assert resp.report.observed_facts == []
    reasons = " ".join(item.reason for item in resp.report.unavailable_evidence)
    assert "NO_DATA_AVAILABLE" in reasons or "DATA_UNAVAILABLE" in reasons


def test_run_records_fetch_errors_as_partial(monkeypatch):
    _patch_fetch(monkeypatch, _COMPANY_MD, _GLOBAL_MD, errors=["global news unavailable: boom"])
    resp = agent.run_sentiment_impact(
        entity_id="TCS.NS", as_of_date="2026-01-10", window_days=7, build_llm=False
    )

    assert resp.errors == ["global news unavailable: boom"]
    assert resp.data_status is ReportStatus.PARTIAL
    assert resp.report.data_quality.notes == ["global news unavailable: boom"]
