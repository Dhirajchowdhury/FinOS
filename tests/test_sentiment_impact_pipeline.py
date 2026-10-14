"""Deterministic baseline tests for the sentiment & market-impact pipeline."""

import pytest

from tradingagents.agents.sentiment_impact import pipeline
from tradingagents.agents.sentiment_impact.schemas import (
    NewsItem,
    ReportStatus,
    SentimentBand,
    SentimentSource,
)

pytestmark = pytest.mark.unit


def _item(title: str, body: str = "", url: str | None = None) -> NewsItem:
    return NewsItem(source="yahoo", title=title, body=body, url=url)


def test_evidence_ids_are_stable_and_ordered():
    refs, ids, by_index = pipeline.evidence_from_items([_item("A"), _item("B")])
    assert ids == ["ev_1", "ev_2"]
    assert by_index == {0: "ev_1", 1: "ev_2"}
    assert refs[0].title == "A"
    assert refs[0].retrieved_at is not None


def test_deterministic_sentiment_bullish():
    items = [_item("Stock surges on record profit and analyst upgrade")]
    _refs, ids, _ = pipeline.evidence_from_items(items)
    read = pipeline.deterministic_sentiment(items, ids)
    assert read.source is SentimentSource.DETERMINISTIC
    assert read.score == 10.0
    assert read.band is SentimentBand.BULLISH
    assert read.evidence_ids == ids


def test_deterministic_sentiment_without_items_never_invents_a_score():
    read = pipeline.deterministic_sentiment([], [])
    assert read.source is SentimentSource.NONE
    assert read.score is None
    assert read.band is SentimentBand.NEUTRAL


def test_events_and_hypotheses_cite_their_evidence():
    items = [
        _item(
            "RBI rate hike raises inflation and interest rate concerns",
            "The central bank flagged price pressure.",
        )
    ]
    _refs, ids, by_index = pipeline.evidence_from_items(items)
    events = pipeline.deterministic_events(items, by_index, "TCS.NS")
    assert len(events) == 1
    assert events[0].evidence_ids == ids
    assert "interest_rates" in events[0].macro_factors
    assert "inflation" in events[0].macro_factors

    read = pipeline.deterministic_sentiment(items, ids)
    paths = pipeline.build_impact_hypotheses(events, "TCS.NS", read)
    assert paths
    assert paths[0].target.entity_id == "TCS.NS"
    assert paths[0].supporting_evidence_ids == ids
    assert paths[0].is_verified is False


def test_events_default_to_other_without_keywords():
    items = [_item("Company names a new board member")]
    _refs, _ids, by_index = pipeline.evidence_from_items(items)
    events = pipeline.deterministic_events(items, by_index, "X")
    assert events[0].event_type.value == "other"
    assert events[0].sectors == []


def test_overall_status_reflects_availability():
    read = pipeline.deterministic_sentiment([], [])
    assert pipeline.overall_status(read, [], []) is ReportStatus.UNAVAILABLE

    items = [_item("Company beats estimates")]
    _refs, ids, _ = pipeline.evidence_from_items(items)
    read = pipeline.deterministic_sentiment(items, ids)
    assert pipeline.overall_status(read, items, []) is ReportStatus.AVAILABLE
    assert pipeline.overall_status(read, items, ["upstream error"]) is ReportStatus.PARTIAL


def test_render_report_markdown_has_all_sections():
    items = [_item("RBI rate hike lifts inflation concerns as profit beats")]
    _refs, ids, by_index = pipeline.evidence_from_items(items)
    read = pipeline.deterministic_sentiment(items, ids)
    events = pipeline.deterministic_events(items, by_index, "X")
    paths = pipeline.build_impact_hypotheses(events, "X", read)
    report = pipeline.assemble_report(
        request_entity="X",
        items=items,
        sentiment=read,
        events=events,
        hypotheses=paths,
        data_quality=pipeline.build_data_quality([], [], []),
        unavailable=[],
    )
    markdown = pipeline.render_report_markdown(report)
    assert "Hypotheses only" in markdown
    for header in (
        "# Sentiment & Market Impact Report",
        "## Sentiment",
        "## Observed Facts",
        "## Events",
        "## Impact Hypotheses",
        "## Data Quality",
        "## Unavailable Evidence",
    ):
        assert header in markdown
