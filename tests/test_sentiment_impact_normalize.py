"""Tests for vendor news normalization (Phase 1).

These exercise the boundary that reverses the news tools' markdown presentation
format (and accepts the list/dict shapes other vendors return) without touching
the network.
"""

from __future__ import annotations

from datetime import datetime, timezone

import pytest

from tradingagents.agents.sentiment_impact.normalize import normalize_news
from tradingagents.agents.sentiment_impact.schemas import DataStatus

# Mirrors the exact shape emitted by
# tradingagents/dataflows/vendors/yahoo/news.py:get_news_yfinance.
_TICKER_MARKDOWN = (
    "## AAPL News, from 2026-09-01 to 2026-09-20:\n"
    "\n"
    "### Apple unveils new chip (source: Reuters)\n"
    "Apple announced a new chip today.\n"
    "Link: https://example.com/a\n"
    "\n"
    "### Analysts weigh in (source: Bloomberg)\n"
    "Mixed reactions from analysts.\n"
    "\n"
)

# Mirrors get_global_news_yfinance's header wording.
_GLOBAL_MARKDOWN = (
    "## Global Market News, from 2026-09-01 to 2026-09-20:\n"
    "\n"
    "### Fed holds rates steady (source: AP)\n"
    "Rates unchanged.\n"
    "Link: https://example.com/b\n"
)


@pytest.mark.unit
class TestMarkdownNormalization:
    def test_parses_ticker_report_into_items(self):
        result = normalize_news(_TICKER_MARKDOWN, vendor="yahoo", ticker="AAPL")
        assert result.status is DataStatus.AVAILABLE
        assert len(result.items) == 2
        first, second = result.items
        assert first.title == "Apple unveils new chip"
        assert first.publisher == "Reuters"
        assert first.body == "Apple announced a new chip today."
        assert first.url == "https://example.com/a"
        assert first.source == "yahoo"
        assert first.tickers == ["AAPL"]
        # The markdown form carries no timestamp; the vendor already windowed it.
        assert first.published_at is None
        assert second.title == "Analysts weigh in"
        assert second.publisher == "Bloomberg"
        assert second.url is None

    def test_parses_global_report_header(self):
        result = normalize_news(_GLOBAL_MARKDOWN, vendor="yahoo", source_type="global_news")
        assert result.status is DataStatus.AVAILABLE
        assert result.source_type == "global_news"
        assert [i.title for i in result.items] == ["Fed holds rates steady"]

    def test_reason_is_capped_and_preserved(self):
        result = normalize_news(
            "No news found for AAPL between 2026-09-01 and 2026-09-20",
            vendor="yahoo",
        )
        assert result.status is DataStatus.UNAVAILABLE
        assert result.items == []
        assert result.reason == "No news found for AAPL between 2026-09-01 and 2026-09-20"


@pytest.mark.unit
class TestUnavailableNotices:
    def test_no_news_sentinel_is_unavailable(self):
        result = normalize_news("No global news found between 2026-09-01 and 2026-09-20", vendor="yahoo")
        assert result.status is DataStatus.UNAVAILABLE
        assert result.reason is not None

    def test_coverage_gap_notice_is_unavailable(self):
        notice = "<Yahoo Finance news unavailable for 2026-09-01..2026-09-20: it only serves recent items, so this is not an absence of news for AAPL>"
        result = normalize_news(notice, vendor="yahoo")
        assert result.status is DataStatus.UNAVAILABLE
        assert "unavailable for" in result.reason

    def test_blank_string_is_unavailable(self):
        result = normalize_news("   \n  ", vendor="yahoo")
        assert result.status is DataStatus.UNAVAILABLE
        assert result.reason == "vendor returned an empty report"

    def test_none_is_unavailable(self):
        result = normalize_news(None, vendor="yahoo")
        assert result.status is DataStatus.UNAVAILABLE
        assert result.reason == "vendor returned no result"

    def test_unsupported_type_is_unavailable(self):
        result = normalize_news(42, vendor="yahoo")
        assert result.status is DataStatus.UNAVAILABLE
        assert "int" in result.reason


@pytest.mark.unit
class TestDictNormalization:
    def test_flat_article_with_epoch_timestamp(self):
        raw = [
            {
                "title": "Flat article",
                "summary": "body",
                "publisher": "AP",
                "link": "https://example.com/1",
                "providerPublishTime": 1757000000,
            }
        ]
        result = normalize_news(raw, vendor="yahoo", ticker="MSFT")
        assert result.status is DataStatus.AVAILABLE
        item = result.items[0]
        assert item.title == "Flat article"
        assert item.publisher == "AP"
        assert item.url == "https://example.com/1"
        assert item.tickers == ["MSFT"]
        assert item.published_at is not None
        assert item.published_at.tzinfo is not None

    def test_nested_content_article(self):
        raw = [
            {
                "content": {
                    "title": "Nested article",
                    "summary": "s",
                    "provider": {"displayName": "WSJ"},
                    "canonicalUrl": {"url": "https://example.com/2"},
                    "pubDate": "2026-09-10T12:00:00Z",
                }
            }
        ]
        result = normalize_news(raw, vendor="yahoo")
        item = result.items[0]
        assert item.title == "Nested article"
        assert item.publisher == "WSJ"
        assert item.url == "https://example.com/2"
        assert item.published_at == datetime(2026, 9, 10, 12, 0, tzinfo=timezone.utc)

    def test_articles_wrapper_dict(self):
        raw = {"articles": [{"title": "Wrapped", "summary": ""}]}
        result = normalize_news(raw, vendor="alpha_vantage")
        assert result.status is DataStatus.AVAILABLE
        assert result.items[0].title == "Wrapped"

    def test_empty_list_is_unavailable(self):
        result = normalize_news([], vendor="yahoo")
        assert result.status is DataStatus.UNAVAILABLE


@pytest.mark.unit
class TestWindowFiltering:
    def test_dated_item_outside_window_is_dropped(self):
        raw = [
            {"title": "In window", "providerPublishTime": 1788998400},   # 2026-09-10
            {"title": "Too early", "providerPublishTime": 1767225600},   # 2026-01-01
        ]
        result = normalize_news(raw, vendor="yahoo", start_date="2026-09-01", end_date="2026-09-20")
        assert [i.title for i in result.items] == ["In window"]

    def test_all_dated_items_out_of_window_is_unavailable(self):
        raw = [{"title": "Too early", "providerPublishTime": 1767225600}]
        result = normalize_news(raw, vendor="yahoo", start_date="2026-09-01", end_date="2026-09-20")
        assert result.status is DataStatus.UNAVAILABLE
        assert result.reason == "no in-window articles after normalization"

    def test_undated_markdown_items_survive_a_window(self):
        # Markdown items are undated because the vendor already windowed them,
        # so an explicit window must not drop them.
        result = normalize_news(
            _TICKER_MARKDOWN, vendor="yahoo", start_date="2020-01-01", end_date="2020-01-31"
        )
        assert result.status is DataStatus.AVAILABLE
        assert len(result.items) == 2
