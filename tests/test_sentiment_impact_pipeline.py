"""Deterministic baseline tests for the sentiment & market-impact pipeline."""

import pytest

from tradingagents.agents.sentiment_impact import entities, pipeline
from tradingagents.agents.sentiment_impact.schemas import (
    Direction,
    NewsItem,
    RelevanceClass,
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


def test_single_bullish_article_is_not_extreme():
    items = [_item("Apple stock surges on record profit and analyst upgrade")]
    classified = pipeline.classify_articles(items, "AAPL")
    assert classified[0].relevance is RelevanceClass.COMPANY_SPECIFIC
    _refs, ids, _ = pipeline.evidence_from_classified(classified)
    read = pipeline.aggregate_sentiment(classified, ids)
    assert read.source is SentimentSource.DETERMINISTIC
    assert read.band is SentimentBand.MILDLY_BULLISH
    assert read.score is not None and 5.0 < read.score < 8.0
    assert read.article_count == 1
    assert read.evidence_ids == ids


def test_no_company_specific_evidence_never_invents_a_score():
    classified = pipeline.classify_articles(
        [_item("Gold prices rise as investors seek safety", "Commodities rallied.")],
        "AAPL",
        ["global_news"],
    )
    _refs, ids, _ = pipeline.evidence_from_classified(classified)
    read = pipeline.aggregate_sentiment(classified, ids)
    assert read.source is SentimentSource.NONE
    assert read.score is None
    assert read.band is SentimentBand.NEUTRAL


def test_irrelevant_articles_are_excluded_from_scoring():
    items = [
        _item("Apple beats estimates on strong demand"),
        _item("IBM wins a large cloud contract"),
    ]
    classified = pipeline.classify_articles(items, "AAPL")
    assert [c.relevance for c in classified] == [
        RelevanceClass.COMPANY_SPECIFIC,
        RelevanceClass.IRRELEVANT,
    ]
    _refs, ids, _ = pipeline.evidence_from_classified(classified)
    read = pipeline.aggregate_sentiment(classified, ids)
    assert read.article_count == 1
    assert set(read.evidence_ids) == {"ev_1"}


def test_events_and_hypotheses_cite_their_evidence():
    items = [
        _item(
            "Vedanta faces RBI rate hike as inflation rises",
            "The central bank flagged price pressure.",
        )
    ]
    classified = pipeline.classify_articles(items, "VEDANTA.NS")
    assert classified[0].relevance is RelevanceClass.COMPANY_SPECIFIC
    _refs, ids, by_index = pipeline.evidence_from_classified(classified)
    events = pipeline.deterministic_events(classified, by_index, "VEDANTA.NS")
    assert len(events) == 1
    assert events[0].evidence_ids == ids
    assert "interest_rates" in events[0].macro_factors
    assert "inflation" in events[0].macro_factors

    paths = pipeline.build_impact_hypotheses(
        events, "VEDANTA.NS", entities.profile_for_ticker("VEDANTA.NS")
    )
    assert paths
    assert paths[0].target.entity_id == "VEDANTA.NS"
    assert paths[0].supporting_evidence_ids == ids
    assert paths[0].is_verified is False


def test_macro_context_never_creates_positive_company_direction():
    items = [
        _item("Federal Reserve signals rate cut as inflation eases", "Macro backdrop improves.")
    ]
    classified = pipeline.classify_articles(items, "VEDANTA.NS", ["global_news"])
    assert classified[0].relevance is RelevanceClass.MACRO_CONTEXT
    _refs, ids, by_index = pipeline.evidence_from_classified(classified)
    events = pipeline.deterministic_events(classified, by_index, "VEDANTA.NS")
    paths = pipeline.build_impact_hypotheses(
        events, "VEDANTA.NS", entities.profile_for_ticker("VEDANTA.NS")
    )
    assert paths
    assert all(path.direction is Direction.UNCLEAR for path in paths)
    read = pipeline.aggregate_sentiment(classified, ids)
    assert read.source is SentimentSource.NONE  # shared macro is not company sentiment


def test_events_default_to_other_without_keywords():
    classified = pipeline.classify_articles([_item("Apple names a new board member")], "AAPL")
    _refs, _ids, by_index = pipeline.evidence_from_classified(classified)
    events = pipeline.deterministic_events(classified, by_index, "AAPL")
    assert events[0].event_type.value == "other"
    assert events[0].sectors == []


def test_overall_status_reflects_availability():
    empty = pipeline.aggregate_sentiment([], [])
    assert pipeline.overall_status(empty, [], []) is ReportStatus.UNAVAILABLE

    classified = pipeline.classify_articles([_item("Apple beats estimates")], "AAPL")
    _refs, ids, _ = pipeline.evidence_from_classified(classified)
    read = pipeline.aggregate_sentiment(classified, ids)
    assert pipeline.overall_status(read, classified, []) is ReportStatus.AVAILABLE
    assert pipeline.overall_status(read, classified, ["upstream error"]) is ReportStatus.PARTIAL


def test_render_report_markdown_has_all_sections():
    items = [_item("Vedanta profit beats as RBI rate hike lifts inflation concerns")]
    classified = pipeline.classify_articles(items, "VEDANTA.NS")
    _refs, ids, by_index = pipeline.evidence_from_classified(classified)
    read = pipeline.aggregate_sentiment(classified, ids)
    events = pipeline.deterministic_events(classified, by_index, "VEDANTA.NS")
    paths = pipeline.build_impact_hypotheses(
        events, "VEDANTA.NS", entities.profile_for_ticker("VEDANTA.NS")
    )
    report = pipeline.assemble_report(
        request_entity="VEDANTA.NS",
        classified=classified,
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
        "## Evidence Relevance",
        "## Observed Facts",
        "## Events",
        "## Impact Hypotheses",
        "## Data Quality",
        "## Unavailable Evidence",
    ):
        assert header in markdown
