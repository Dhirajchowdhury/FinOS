"""Relevance-classification acceptance tests for the sentiment-impact feature.

These exercise the retrieval -> classify -> score path offline (vendor fetch is
monkeypatched) and encode the eight acceptance criteria for evidence relevance:
unrelated articles never reach the company score, per-company exposures are
respected, shared macro stays context-only, and every event/hypothesis cites
evidence that resolves to a returned article.
"""

from __future__ import annotations

import pytest

from tradingagents.agents.sentiment_impact import agent, entities, pipeline
from tradingagents.agents.sentiment_impact.schemas import (
    Direction,
    NewsItem,
    RelevanceClass,
    ReportStatus,
    SentimentBand,
    SentimentSource,
)

pytestmark = pytest.mark.unit


def _md(header: str, articles: list[tuple[str, str, str]]) -> str:
    """Build the vendor markdown shape: (title, body, url)."""
    parts = [f"## {header}\n\n"]
    for title, body, url in articles:
        parts.append(f"### {title} (source: Test)\n{body}\nLink: {url}\n\n")
    return "".join(parts)


_COMPANY_VD = _md(
    "VEDANTA.NS News",
    [("Vedanta to expand aluminium smelter capacity", "The metals and mining major said output will rise.", "https://example.com/v1")],
)
_NOISE_GLOBAL = _md(
    "Global News",
    [
        ("IBM beats estimates as cloud demand surges", "IBM reported strong quarterly results.", "https://example.com/g1"),
        ("Palantir wins a new AI contract", "The software firm signed a deal.", "https://example.com/g2"),
        ("Healthcare stocks rally on drug approval", "Pharma shares rose.", "https://example.com/g3"),
        ("Federal Reserve signals rate cut as inflation eases", "Macro backdrop improves.", "https://example.com/g4"),
    ],
)


def _patch(monkeypatch, company_raw, global_raw, errors=None):
    monkeypatch.setattr(
        agent, "_fetch_news", lambda *a, **k: (company_raw, global_raw, errors or [])
    )
    monkeypatch.setattr(agent, "resolve_llm", lambda *a, **k: None)


def _run(entity_id="VEDANTA.NS"):
    return agent.run_sentiment_impact(
        entity_id=entity_id, as_of_date="2026-01-10", window_days=7, build_llm=False
    )


# 1. Unrelated company articles are excluded from the company sentiment score.
def test_unrelated_company_articles_do_not_contaminate_score(monkeypatch):
    _patch(monkeypatch, _COMPANY_VD, _NOISE_GLOBAL)
    report = _run().report

    by_title = {ref.title: ref for ref in report.observed_facts}
    for title in (
        "IBM beats estimates as cloud demand surges",
        "Palantir wins a new AI contract",
        "Healthcare stocks rally on drug approval",
    ):
        ref = by_title[title]
        assert ref.relevance is not RelevanceClass.COMPANY_SPECIFIC
        assert ref.included_in_sentiment is False

    # Only the single Vedanta article is eligible, so it alone backs the score.
    assert report.sentiment.source is SentimentSource.DETERMINISTIC
    assert report.sentiment.article_count == 1
    assert report.sentiment.evidence_ids == ["ev_1"]
    assert report.relevance_summary.company_specific == 1


# 2. A company-specific article for one ticker is never reused as company news
#    for another.
def test_vedanta_article_is_not_company_specific_for_tata_steel(monkeypatch):
    company = _md(
        "TATASTEEL.NS News",
        [("Tata Steel posts record profit", "The steelmaker beat estimates.", "https://example.com/t1")],
    )
    global_news = _md(
        "Global News",
        [("Vedanta to expand aluminium output", "Metals and mining capex rises.", "https://example.com/v1")],
    )
    _patch(monkeypatch, company, global_news)
    report = _run("TATASTEEL.NS").report

    by_title = {ref.title: ref for ref in report.observed_facts}
    vedanta = by_title["Vedanta to expand aluminium output"]
    assert vedanta.relevance is not RelevanceClass.COMPANY_SPECIFIC
    assert vedanta.included_in_sentiment is False
    assert by_title["Tata Steel posts record profit"].relevance is RelevanceClass.COMPANY_SPECIFIC


# 3. Sector relevance follows each company's verified exposures.
def test_sector_articles_map_to_verified_exposures():
    steel = [
        NewsItem(source="yahoo", title="Steel prices climb on China demand", body="Iron ore rose.")
    ]
    aluminium = [
        NewsItem(source="yahoo", title="Aluminium prices rise on supply crunch", body="")
    ]

    tata = pipeline.classify_articles(steel, "TATASTEEL.NS", ["global_news"])[0]
    vedanta = pipeline.classify_articles(steel, "VEDANTA.NS", ["global_news"])[0]
    vedanta_alu = pipeline.classify_articles(aluminium, "VEDANTA.NS", ["global_news"])[0]

    assert tata.relevance is RelevanceClass.SECTOR_RELEVANT
    assert vedanta.relevance is not RelevanceClass.COMPANY_SPECIFIC  # steel is not a Vedanta exposure
    assert vedanta_alu.relevance is RelevanceClass.SECTOR_RELEVANT


# 4. Shared macro is context only and never becomes positive company direction.
def test_shared_macro_is_context_only(monkeypatch):
    macro = _md(
        "Global News",
        [("Fed signals rate cut as inflation eases", "Macro backdrop improves.", "https://example.com/m1")],
    )
    _patch(monkeypatch, "", macro)
    report = _run("VEDANTA.NS").report

    assert report.observed_facts[0].relevance is RelevanceClass.MACRO_CONTEXT
    assert report.sentiment.source is SentimentSource.NONE
    assert report.sentiment.score is None
    assert all(path.direction is Direction.UNCLEAR for path in report.impact_hypotheses)
    assert all(
        path.supporting_evidence_ids == ["ev_1"]
        for path in report.impact_hypotheses
    )


# 5. Adding irrelevant articles does not change the aggregate score.
def test_irrelevant_articles_do_not_change_score():
    company_item = NewsItem(
        source="yahoo", title="Apple beats estimates on strong demand", body=""
    )
    irrelevant_item = NewsItem(
        source="yahoo", title="IBM surges to a record profit", body="Cloud boom."
    )
    base = pipeline.classify_articles([company_item], "AAPL")
    with_noise = pipeline.classify_articles([company_item, irrelevant_item], "AAPL")

    _r, ids_base, _ = pipeline.evidence_from_classified(base)
    _r, ids_noise, _ = pipeline.evidence_from_classified(with_noise)
    read_base = pipeline.aggregate_sentiment(base, ids_base)
    read_noise = pipeline.aggregate_sentiment(with_noise, ids_noise)

    assert with_noise[1].relevance is RelevanceClass.IRRELEVANT
    assert read_base.score == read_noise.score
    assert read_base.band is read_noise.band


# 6. Insufficient evidence never yields an unjustified BULLISH/BEARISH read.
def test_insufficient_evidence_is_not_directional(monkeypatch):
    _patch(monkeypatch, "", "")
    resp = _run()
    report = resp.report
    assert report.sentiment.source is SentimentSource.NONE
    assert report.sentiment.score is None
    assert report.sentiment.band is SentimentBand.NEUTRAL
    assert resp.data_status is ReportStatus.UNAVAILABLE

    # A single company-specific headline is at most mildly directional.
    single = pipeline.classify_articles(
        [NewsItem(source="yahoo", title="Apple stock surges on record profit and upgrade", body="")],
        "AAPL",
    )
    _r, ids, _ = pipeline.evidence_from_classified(single)
    read = pipeline.aggregate_sentiment(single, ids)
    assert read.band not in (SentimentBand.BULLISH, SentimentBand.BEARISH)


# 7. Dedupe, provider errors and unavailable data are handled honestly.
def test_duplicate_articles_across_feeds_are_deduped(monkeypatch):
    dup = _md(
        "News",
        [("Vedanta wins a new contract", "The company signed a deal.", "https://example.com/dup")],
    )
    _patch(monkeypatch, dup, dup)
    report = _run().report
    assert len(report.observed_facts) == 1
    assert report.relevance_summary.total_retrieved == 1


def test_provider_errors_degrade_to_partial(monkeypatch):
    _patch(monkeypatch, _COMPANY_VD, "", errors=["global news unavailable: boom"])
    resp = _run()
    assert resp.data_status is ReportStatus.PARTIAL
    assert resp.report.data_quality.notes == ["global news unavailable: boom"]


def test_unavailable_vendor_sentinels_yield_no_evidence(monkeypatch):
    _patch(
        monkeypatch,
        "NO_DATA_AVAILABLE: No usable market data for 'VEDANTA.NS'.",
        "DATA_UNAVAILABLE: no configured vendor could serve get_global_news.",
    )
    resp = _run()
    assert resp.data_status is ReportStatus.UNAVAILABLE
    assert resp.report.observed_facts == []
    assert resp.report.sentiment.source is SentimentSource.NONE


# 8. Every event/hypothesis references evidence that resolves to an article.
def test_events_and_hypotheses_resolve_to_returned_articles(monkeypatch):
    macro = _md(
        "Global News",
        [("Commodity prices soar as oil supply tightens", "Crude and gold rallied.", "https://example.com/m1")],
    )
    _patch(monkeypatch, _COMPANY_VD, macro)
    report = _run().report

    evidence_ids = {ref.evidence_id for ref in report.observed_facts}
    assert evidence_ids
    for event in report.events:
        assert event.evidence_ids and set(event.evidence_ids) <= evidence_ids
    for path in report.impact_hypotheses:
        assert path.supporting_evidence_ids
        assert set(path.supporting_evidence_ids) <= evidence_ids
        assert path.is_verified is False


# Supporting unit: word-boundary matching (a substring test would match 'war').
def test_keyword_matching_is_word_bounded():
    assert entities.term_matches("The software firm signed a deal", "war") is False
    assert entities.term_matches("A trade war escalates", "war") is True
    assert entities.term_matches("RBI rate hike", "rbi") is True
