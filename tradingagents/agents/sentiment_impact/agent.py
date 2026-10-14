"""Orchestration entry point for the sentiment & market-impact analysis.

This is the single callable the backend uses for ``POST /analysis``. It:

1. fetches company + market news through the existing vendor router,
2. normalizes the vendor payloads into :class:`NewsItem` records,
3. builds a deterministic, evidence-backed report baseline,
4. optionally layers an LLM sentiment read on top (never required),
5. returns the versioned :class:`SentimentImpactResponse`.

It runs end-to-end with no API keys: any provider failure degrades to an
explicit ``UNAVAILABLE``/``PARTIAL`` status rather than raising.
"""

from __future__ import annotations

import logging
from datetime import date, datetime, timezone

from tradingagents.agents.sentiment_impact import entities, pipeline
from tradingagents.agents.sentiment_impact.enrich import enrich_sentiment, resolve_llm
from tradingagents.agents.sentiment_impact.normalize import normalize_news
from tradingagents.agents.sentiment_impact.schemas import (
    DataStatus,
    NewsItem,
    ReportRequest,
    SentimentImpactResponse,
    SourceQuality,
    UnavailableEvidence,
)

logger = logging.getLogger(__name__)


def _today_iso() -> str:
    return date.today().isoformat()


def _shift_days(iso_date: str, days: int) -> str:
    try:
        base = datetime.strptime(iso_date, "%Y-%m-%d").date()
    except (TypeError, ValueError):
        base = date.today()
    from datetime import timedelta

    return (base - timedelta(days=days)).isoformat()


def _vendor_label() -> str:
    try:
        from tradingagents.dataflows.router import get_vendor

        configured = get_vendor("news_data", "get_news") or "yfinance"
        first = configured.split(",")[0].strip()
        return "yahoo" if first.startswith("yfinance") else first
    except Exception:  # noqa: BLE001 - label only; never fatal
        return "yahoo"


def _fetch_news(ticker: str, start_date: str, end_date: str, look_back_days: int):
    """Fetch company + global news. Returns (raw_company, raw_global, errors)."""
    from tradingagents.dataflows.router import route_to_vendor

    errors: list[str] = []
    company_raw = ""
    global_raw = ""
    try:
        company_raw = route_to_vendor("get_news", ticker, start_date, end_date)
    except Exception as exc:  # noqa: BLE001
        logger.warning("sentiment-impact: company news fetch failed (%s)", exc)
        errors.append(f"company news unavailable: {exc}")
    try:
        global_raw = route_to_vendor("get_global_news", end_date, look_back_days, 10)
    except Exception as exc:  # noqa: BLE001
        logger.warning("sentiment-impact: global news fetch failed (%s)", exc)
        errors.append(f"global news unavailable: {exc}")
    return company_raw, global_raw, errors


def run_sentiment_impact(
    *,
    entity_id: str,
    request: str = "",
    market: str | None = None,
    as_of_date: str | None = None,
    window_days: int = 7,
    context: dict | None = None,
    llm=None,
    config: dict | None = None,
    build_llm: bool = True,
) -> SentimentImpactResponse:
    """Run the sentiment & market-impact pipeline and return the response."""
    as_of = as_of_date or _today_iso()
    start = _shift_days(as_of, max(1, window_days) - 1)
    vendor = _vendor_label()
    errors: list[str] = []

    company_raw, global_raw, fetch_errors = _fetch_news(entity_id, start, as_of, window_days)
    errors.extend(fetch_errors)

    company_norm = normalize_news(
        company_raw, vendor=vendor, source_type="news",
        ticker=entity_id, start_date=start, end_date=as_of,
    )
    global_norm = normalize_news(
        global_raw, vendor=vendor, source_type="global_news",
        ticker=None, start_date=start, end_date=as_of,
    )

    # Keep each article's feed provenance, then drop duplicates across feeds.
    # The ticker is NOT stamped onto global items: relevance is decided later
    # from article content, not from a vendor/feed association.
    paired: list[tuple[NewsItem, str]] = [
        (item, "company_news") for item in company_norm.items
    ] + [(item, "global_news") for item in global_norm.items]
    seen: set[tuple[str, str]] = set()
    items: list[NewsItem] = []
    feeds: list[str] = []
    for item, feed in paired:
        key = (item.title.strip().lower(), (item.url or "").strip().lower())
        if key in seen:
            continue
        seen.add(key)
        items.append(item)
        feeds.append(feed)

    classified = pipeline.classify_articles(items, entity_id, feeds)
    _evidence_refs, evidence_ids, by_index = pipeline.evidence_from_classified(classified)
    sentiment = pipeline.aggregate_sentiment(classified, evidence_ids)
    events = pipeline.deterministic_events(classified, by_index, entity_id)
    hypotheses = pipeline.build_impact_hypotheses(
        events, entity_id, entities.profile_for_ticker(entity_id)
    )

    unavailable: list[UnavailableEvidence] = []
    if company_norm.status is not DataStatus.AVAILABLE:
        unavailable.append(
            UnavailableEvidence(
                capability="company_news",
                status=company_norm.status,
                reason=company_norm.reason or "company news not available",
            )
        )
    if global_norm.status is not DataStatus.AVAILABLE:
        unavailable.append(
            UnavailableEvidence(
                capability="global_news",
                status=global_norm.status,
                reason=global_norm.reason or "global news not available",
            )
        )

    if llm is None and build_llm:
        llm = resolve_llm(config)
    # The LLM may only summarise the same eligible company-specific evidence that
    # the deterministic score uses; it is never given unrelated/macro articles.
    eligible_items = [article.item for article in classified if article.included]
    eligible_ids = [
        evidence_ids[index] for index, article in enumerate(classified) if article.included
    ]
    enriched = (
        enrich_sentiment(eligible_items, eligible_ids, llm)
        if llm is not None and eligible_items
        else None
    )
    if enriched is not None:
        sentiment = enriched.model_copy(update={"total_retrieved": len(items)})
    else:
        unavailable.append(
            UnavailableEvidence(
                capability="llm_enrichment",
                status=DataStatus.UNAVAILABLE,
                reason="no LLM configured or enrichment failed; deterministic baseline used",
            )
        )

    retrieved = datetime.now(timezone.utc)
    sources = [
        SourceQuality(
            vendor=company_norm.vendor, retrieved_at=retrieved,
            freshness=_freshness(company_norm.items, as_of), status=company_norm.status,
        ),
        SourceQuality(
            vendor=global_norm.vendor, retrieved_at=retrieved,
            freshness=_freshness(global_norm.items, as_of), status=global_norm.status,
        ),
    ]
    missing_inputs = [u.capability for u in unavailable if u.status is not DataStatus.AVAILABLE]
    data_quality = pipeline.build_data_quality(sources, missing_inputs, list(errors))

    report = pipeline.assemble_report(
        request_entity=entity_id,
        classified=classified,
        sentiment=sentiment,
        events=events,
        hypotheses=hypotheses,
        data_quality=data_quality,
        unavailable=unavailable,
    )

    status = pipeline.overall_status(sentiment, classified, errors)
    return SentimentImpactResponse(
        request=ReportRequest(
            entity_id=entity_id, market=market, as_of_date=as_of, window_days=window_days,
        ),
        data_status=status,
        report=report,
        errors=errors,
    )


def _freshness(items: list[NewsItem], as_of: str) -> str:
    """Coarse freshness label from the newest dated item, relative to as_of."""
    dated = [i.published_at for i in items if i.published_at is not None]
    if not dated:
        return "unknown"
    try:
        as_of_dt = datetime.strptime(as_of, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    except (TypeError, ValueError):
        return "unknown"
    newest = max(dated)
    if newest.tzinfo is None:
        newest = newest.replace(tzinfo=timezone.utc)
    age_days = (as_of_dt - newest).days
    if age_days <= 1:
        return "current"
    if age_days <= 7:
        return "recent"
    return "stale"
