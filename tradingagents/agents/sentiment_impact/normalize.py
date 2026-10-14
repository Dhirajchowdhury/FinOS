"""Normalize vendor news results into ``NewsItem`` records.

Yahoo's news tools (and the feeds routed through them) return a formatted
markdown string, so a caller that expects structured articles silently sees
none. This module reverses that presentation format and also accepts the
list/dict shapes other vendors return, behind one boundary, so downstream stages
only ever handle ``NewsItem``.

The markdown form drops the publication timestamp: the vendor already filtered
articles against the analysis window before formatting, so parsed items carry
``published_at=None``. A supplied ``start_date``/``end_date`` window is still
enforced on any timestamp that *is* present (e.g. raw dict inputs) using the
shared look-ahead-safe :func:`in_window` rule. An undated item is presumed to
have been window-filtered by the vendor upstream and is therefore kept rather
than dropped.

An empty/sentinel vendor string -- "No news found ...", a ``coverage_gap``
``<... unavailable for ...>`` notice, or blank output -- yields
``DataStatus.UNAVAILABLE`` with the notice as the reason, never a fabricated
article.
"""

from __future__ import annotations

import contextlib
import re
from datetime import datetime, timezone

from tradingagents.agents.sentiment_impact.schemas import (
    DataStatus,
    NewsItem,
    NormalizationResult,
)
from tradingagents.dataflows.date_window import in_window

_TITLE_RE = re.compile(r"^###\s+(.*)$")
_SOURCE_SUFFIX_RE = re.compile(r"\s*\(source:\s*(?P<publisher>[^)]*)\)\s*$")
_LINK_PREFIX = "Link: "
_REASON_MAX = 200


def normalize_news(
    raw: object,
    *,
    vendor: str,
    source_type: str = "news",
    ticker: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
) -> NormalizationResult:
    """Normalize one vendor's news result into a :class:`NormalizationResult`.

    Args:
        raw: The vendor result, as returned by the dataflow tool: a formatted
            markdown string, a list of article dicts, a single article dict, or a
            dict wrapping an ``"articles"`` list.
        vendor: Vendor name recorded on every produced item.
        source_type: Logical feed label, e.g. ``"news"`` or ``"global_news"``.
        ticker: Optional ticker to tag produced items with.
        start_date, end_date: Optional ``YYYY-MM-DD`` window; dated items outside
            it are dropped. Undated items pass through (see module docstring).
    """
    if raw is None:
        return _unavailable(vendor, source_type, "vendor returned no result")
    if isinstance(raw, str):
        items = _parse_markdown(raw, vendor, ticker)
        if not items:
            return _unavailable(vendor, source_type, _reason_from_text(raw))
    elif isinstance(raw, list):
        items = _from_mappings(raw, vendor, ticker)
        if not items:
            return _unavailable(vendor, source_type, "no article-like entries in result")
    elif isinstance(raw, dict):
        wrapped = raw.get("articles")
        entries = wrapped if isinstance(wrapped, list) else [raw]
        items = _from_mappings(entries, vendor, ticker)
        if not items:
            return _unavailable(vendor, source_type, "no article-like entries in result")
    else:
        return _unavailable(vendor, source_type, f"unsupported result type {type(raw).__name__}")

    items = _dedupe(items)
    items = _apply_window(items, start_date, end_date)
    if not items:
        return _unavailable(vendor, source_type, "no in-window articles after normalization")
    return NormalizationResult(
        vendor=vendor, source_type=source_type, status=DataStatus.AVAILABLE, items=items
    )


def _unavailable(vendor: str, source_type: str, reason: str) -> NormalizationResult:
    return NormalizationResult(
        vendor=vendor,
        source_type=source_type,
        status=DataStatus.UNAVAILABLE,
        items=[],
        reason=reason,
    )


def _parse_markdown(text: str, vendor: str, ticker: str | None) -> list[NewsItem]:
    """Parse the ``### title (source: pub)`` markdown that the news tools emit."""
    items: list[NewsItem] = []
    title: str | None = None
    publisher: str | None = None
    url: str | None = None
    body_lines: list[str] = []

    def flush() -> None:
        nonlocal title, publisher, url, body_lines
        if title is not None:
            items.append(
                NewsItem(
                    source=vendor,
                    title=title,
                    body="\n".join(body_lines).strip(),
                    url=url,
                    publisher=publisher,
                    tickers=[ticker] if ticker else [],
                )
            )
        title = None
        publisher = None
        url = None
        body_lines = []

    for line in text.splitlines():
        heading = _TITLE_RE.match(line)
        if heading:
            flush()
            title, publisher = _split_title(heading.group(1).strip())
            continue
        if title is None:
            continue  # a report header before the first article
        if line.startswith(_LINK_PREFIX):
            url = line[len(_LINK_PREFIX) :].strip() or None
            continue
        body_lines.append(line)
    flush()
    return items


def _split_title(heading: str) -> tuple[str, str | None]:
    """Split ``"Headline (source: Publisher)"`` into title and publisher."""
    match = _SOURCE_SUFFIX_RE.search(heading)
    if not match:
        return heading, None
    title = heading[: match.start()].strip()
    publisher = match.group("publisher").strip() or None
    return (title or heading), publisher


def _from_mappings(entries: list, vendor: str, ticker: str | None) -> list[NewsItem]:
    items: list[NewsItem] = []
    for entry in entries:
        item = _from_mapping(entry, vendor, ticker)
        if item is not None:
            items.append(item)
    return items


def _from_mapping(article: object, vendor: str, ticker: str | None) -> NewsItem | None:
    """Map a yfinance-style article dict (nested ``content`` or flat) to a NewsItem."""
    if not isinstance(article, dict):
        return None
    content = article.get("content")
    if isinstance(content, dict):
        provider = content.get("provider")
        url_obj = content.get("canonicalUrl") or content.get("clickThroughUrl") or {}
        return NewsItem(
            source=vendor,
            title=content.get("title") or "No title",
            body=content.get("summary") or "",
            published_at=_parse_iso(content.get("pubDate")),
            url=(url_obj.get("url") if isinstance(url_obj, dict) else None) or None,
            publisher=(provider.get("displayName") if isinstance(provider, dict) else None),
            tickers=[ticker] if ticker else [],
        )
    published_at = _parse_epoch(article.get("providerPublishTime")) or _parse_iso(
        article.get("pubDate") or article.get("published_at")
    )
    return NewsItem(
        source=vendor,
        title=article.get("title") or "No title",
        body=article.get("summary") or "",
        published_at=published_at,
        url=article.get("link") or None,
        publisher=article.get("publisher") or None,
        tickers=[ticker] if ticker else [],
    )


def _parse_iso(value: object) -> datetime | None:
    if not isinstance(value, str) or not value:
        return None
    with contextlib.suppress(ValueError, AttributeError):
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    return None


def _parse_epoch(value: object) -> datetime | None:
    if value is None:
        return None
    with contextlib.suppress(ValueError, OSError, TypeError, OverflowError):
        return datetime.fromtimestamp(value, tz=timezone.utc)
    return None


def _dedupe(items: list[NewsItem]) -> list[NewsItem]:
    """Drop duplicate articles, keyed on (normalized title, url)."""
    seen: set[tuple[str, str]] = set()
    unique: list[NewsItem] = []
    for item in items:
        key = (item.title.strip().lower(), (item.url or "").strip().lower())
        if key in seen:
            continue
        seen.add(key)
        unique.append(item)
    return unique


def _apply_window(
    items: list[NewsItem], start_date: str | None, end_date: str | None
) -> list[NewsItem]:
    """Drop dated items outside ``[start_date, end_date]``; keep undated items."""
    if not start_date or not end_date:
        return items
    try:
        start_dt = datetime.strptime(start_date, "%Y-%m-%d")
        end_dt = datetime.strptime(end_date, "%Y-%m-%d")
    except (TypeError, ValueError):
        return items
    return [
        item
        for item in items
        if item.published_at is None or in_window(item.published_at, start_dt, end_dt)
    ]


def _reason_from_text(text: str) -> str:
    stripped = text.strip()
    if not stripped:
        return "vendor returned an empty report"
    return stripped[:_REASON_MAX]
