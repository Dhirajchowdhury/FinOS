"""Tests for the sentiment-impact structured schemas (Phase 1)."""

from __future__ import annotations

import pytest

from tradingagents.agents.sentiment_impact.schemas import (
    DataStatus,
    NewsItem,
    NormalizationResult,
)


@pytest.mark.unit
class TestDataStatus:
    def test_members_cover_the_four_availability_states(self):
        assert {s.value for s in DataStatus} == {
            "AVAILABLE",
            "INSUFFICIENT_DATA",
            "UNAVAILABLE",
            "FAILED",
        }


@pytest.mark.unit
class TestNewsItem:
    def test_defaults_are_empty_not_shared(self):
        first = NewsItem(source="yahoo", title="A")
        second = NewsItem(source="yahoo", title="B")
        first.tickers.append("AAPL")
        assert second.tickers == []          # default_factory, not a shared list
        assert first.body == ""
        assert first.published_at is None
        assert first.url is None
        assert first.publisher is None

    def test_holds_all_fields(self):
        item = NewsItem(
            source="yahoo",
            title="T",
            body="body",
            url="https://example.com/a",
            publisher="Reuters",
            tickers=["AAPL"],
        )
        assert item.publisher == "Reuters"
        assert item.tickers == ["AAPL"]


@pytest.mark.unit
class TestNormalizationResult:
    def test_status_is_required(self):
        with pytest.raises(Exception):
            NormalizationResult(vendor="yahoo")

    def test_carries_reason_and_status(self):
        result = NormalizationResult(
            vendor="yahoo",
            source_type="global_news",
            status=DataStatus.UNAVAILABLE,
            reason="vendor returned no result",
        )
        assert result.items == []
        assert result.source_type == "global_news"
        assert result.reason == "vendor returned no result"
