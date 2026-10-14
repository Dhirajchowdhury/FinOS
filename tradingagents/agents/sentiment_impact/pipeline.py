"""Deterministic baseline + report assembly for the sentiment-impact feature.

Everything in this module is a pure function over normalized :class:`NewsItem`
records: no LLM, no network. It produces a defensible, honest baseline that runs
with no API keys configured. The optional LLM enrichment in :mod:`enrich` layers
on top; when it is unavailable the deterministic result stands and the affected
capability is marked ``UNAVAILABLE``.

Relevance is established *before* scoring. Each article is classified by its own
text against the requested entity's verified metadata (:mod:`entities`) as
``COMPANY_SPECIFIC``, ``SECTOR_RELEVANT``, ``MACRO_CONTEXT`` or ``IRRELEVANT``.
Only ``COMPANY_SPECIFIC`` articles may move the headline score; sector and macro
articles are retained as labelled context. This prevents unrelated company or
shared-macro articles that a vendor happened to associate with the ticker from
leaking into the sentiment number.

Guarantees:
- No fabricated dates, urls, bodies, scores or products.
- The score is derived only from eligible, company-specific evidence, with a
  small-sample shrinkage so a single article cannot produce a 10/10.
- Impact pathways cite the evidence ids that support them and are hypotheses,
  never causal claims.
- Insufficient evidence yields explicit ``UNAVAILABLE``/``PARTIAL`` statuses.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone

from tradingagents.agents.sentiment_impact import entities
from tradingagents.agents.sentiment_impact.entities import EntityProfile
from tradingagents.agents.sentiment_impact.schemas import (
    DataQuality,
    Direction,
    EntityKind,
    EntityLink,
    EventClaim,
    EventType,
    EvidenceRef,
    Horizon,
    NewsItem,
    RelevanceClass,
    RelevanceSummary,
    ReportStatus,
    SentimentBand,
    SentimentImpactReport,
    SentimentRead,
    SentimentSource,
    SourceQuality,
    TransmissionPath,
    UnavailableEvidence,
)

_POSITIVE = {
    "beat", "beats", "surge", "surges", "rally", "rallies", "gain", "gains",
    "upgrade", "upgrades", "record", "growth", "profit", "profits", "strong",
    "boost", "boosts", "expand", "expansion", "win", "wins", "approval",
    "approved", "partnership", "dividend", "buyback", "outperform", "bullish",
    "rise", "rises", "higher", "optimistic", "recovery",
}
_NEGATIVE = {
    "miss", "misses", "plunge", "plunges", "fall", "falls", "drop", "drops",
    "downgrade", "downgrades", "loss", "losses", "weak", "decline", "declines",
    "cut", "cuts", "layoff", "layoffs", "lawsuit", "probe", "investigation",
    "fine", "penalty", "default", "bankruptcy", "bearish", "fear", "fears",
    "lower", "slump", "warning", "warns", "risk", "recession", "fraud",
}

_EVENT_KEYWORDS: list[tuple[EventType, tuple[str, ...]]] = [
    (EventType.EARNINGS, ("earnings", "quarterly", "q1", "q2", "q3", "q4", "results", "revenue")),
    (EventType.GUIDANCE, ("guidance", "outlook", "forecast", "estimates", "target")),
    (EventType.PRODUCT, ("launch", "product", "chip", "release", "unveil", "partnership", "contract", "deal")),
    (EventType.REGULATORY, ("regulator", "regulatory", "sec", "fine", "penalty", "approval", "probe", "investigation", "lawsuit", "antitrust")),
    (EventType.MNA, ("merger", "acquisition", "acquire", "acquires", "takeover", "buyout", "stake")),
    (EventType.MACRO, ("inflation", "interest rate", "fed", "rbi", "gdp", "unemployment", "macro", "central bank", "rate hike", "rate cut")),
    (EventType.GEOPOLITICAL, ("sanction", "tariff", "war", "conflict", "geopolitical", "trade war", "election")),
]

_SECTOR_KEYWORDS: dict[str, tuple[str, ...]] = {
    "Energy": ("oil", "gas", "refining", "refinery", "energy", "petroleum"),
    "Technology": ("software", "semiconductor", "chip", "cloud", "ai", "artificial intelligence", "technology"),
    "Financials": ("bank", "lending", "insurance", "credit", "financial"),
    "Healthcare": ("pharma", "drug", "health", "biotech", "medicine"),
    "Consumer": ("retail", "consumer", "apparel", "beverage", "food"),
    "Industrials": ("manufacturing", "industrial", "machinery", "defense", "aerospace"),
}

_MACRO_KEYWORDS: dict[str, tuple[str, ...]] = {
    "interest_rates": ("interest rate", "rate hike", "rate cut", "fed", "rbi", "central bank", "monetary"),
    "inflation": ("inflation", "cpi", "price pressure"),
    "growth": ("gdp", "economic growth", "recession", "slowdown"),
    "commodities": ("oil", "commodity", "gold", "crude"),
    "geopolitics": ("sanction", "tariff", "war", "conflict", "trade war"),
    "employment": ("unemployment", "jobs", "payroll", "labor"),
}

_MECHANISMS: dict[str, str] = {
    "interest_rates": "Higher/lower rates change financing cost and demand sensitivity.",
    "inflation": "Input-cost and pricing pressure can affect margins.",
    "growth": "Aggregate demand shifts affect revenue and volumes.",
    "commodities": "Input or output commodity prices affect cost and revenue.",
    "geopolitics": "Trade/geopolitical friction can affect supply chains and demand.",
    "employment": "Labour-market strength affects demand and wage costs.",
}

_SECTOR_MECHANISMS: dict[str, str] = {
    "Energy": "Energy prices and refining margins drive sector revenue and costs.",
    "Technology": "IT/digital demand and deal pipelines drive sector revenue.",
    "Financials": "Credit growth, spreads and asset quality drive sector earnings.",
    "Healthcare": "Regulatory and pipeline developments drive sector valuation.",
    "Consumer": "Discretionary demand and input costs drive sector margins.",
    "Industrials": "Order books and capex cycles drive sector revenue.",
    "Metals & Mining": "Metal prices and ore/mining volumes drive sector margins.",
    "Steel": "Steel prices and iron-ore/coking-coal spreads drive sector margins.",
    "Energy & Conglomerate": "Energy prices and consumer/telecom demand drive conglomerate earnings.",
    "Information Technology": "IT demand and deal pipelines drive sector revenue.",
}


@dataclass
class ClassifiedArticle:
    """An article paired with its content-based relevance classification."""

    item: NewsItem
    feed: str
    relevance: RelevanceClass
    reason: str
    matched_entity: str | None
    positive: int
    negative: int

    @property
    def included(self) -> bool:
        return self.relevance is RelevanceClass.COMPANY_SPECIFIC


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _score_text(text: str) -> tuple[int, int]:
    pos = sum(1 for word in _POSITIVE if entities.term_matches(text, word))
    neg = sum(1 for word in _NEGATIVE if entities.term_matches(text, word))
    return pos, neg


def _match_macro(text: str) -> str | None:
    for factor, keywords in _MACRO_KEYWORDS.items():
        if any(entities.term_matches(text, word) for word in keywords):
            return factor
    return None


def classify_articles(
    items: list[NewsItem], ticker: str, feeds: list[str] | None = None
) -> list[ClassifiedArticle]:
    """Classify each article against the requested entity's verified metadata.

    A vendor ticker association is deliberately ignored: relevance is decided
    from the article text only, so unrelated company/market articles the feed
    returned are never scored as company news.
    """
    profile = entities.profile_for_ticker(ticker)
    classified: list[ClassifiedArticle] = []
    for index, item in enumerate(items):
        feed = feeds[index] if feeds and index < len(feeds) else "company_news"
        text = f"{item.title} {item.body}"
        company = entities.match_company(text, profile)
        if company:
            relevance, reason, matched = (
                RelevanceClass.COMPANY_SPECIFIC,
                f"mentions {profile.name or ticker} ('{company}')",
                company,
            )
        else:
            sector = entities.match_sector(text, profile)
            if sector:
                relevance, reason, matched = (
                    RelevanceClass.SECTOR_RELEVANT,
                    f"relates to {profile.sector} exposure ('{sector}')",
                    sector,
                )
            else:
                macro = _match_macro(text)
                if macro:
                    relevance, reason, matched = (
                        RelevanceClass.MACRO_CONTEXT,
                        f"shared macro context: {macro}",
                        macro,
                    )
                else:
                    relevance, reason, matched = (
                        RelevanceClass.IRRELEVANT,
                        f"no verified link to {ticker}",
                        None,
                    )
        positive, negative = _score_text(text)
        classified.append(
            ClassifiedArticle(
                item=item,
                feed=feed,
                relevance=relevance,
                reason=reason,
                matched_entity=matched,
                positive=positive,
                negative=negative,
            )
        )
    return classified


def aggregate_sentiment(
    classified: list[ClassifiedArticle], evidence_ids: list[str]
) -> SentimentRead:
    """A transparent keyword baseline over company-specific evidence only.

    The raw polarity is shrunk by ``n / (n + 2)`` so small samples cannot reach
    the extremes: a single bullish headline yields a mildly-bullish read, not a
    fabricated 10/10. With no eligible evidence the score is withheld.
    """
    total_retrieved = len(classified)
    eligible = [
        (article, evidence_ids[index])
        for index, article in enumerate(classified)
        if article.included and index < len(evidence_ids)
    ]
    if not eligible:
        return SentimentRead(
            band=SentimentBand.NEUTRAL,
            score=None,
            confidence="low",
            rationale=(
                "No company-specific evidence was found, so no sentiment score is "
                "defensible; unrelated and shared-macro articles were excluded."
            ),
            evidence_ids=[],
            source=SentimentSource.NONE,
            method="deterministic_keyword_v2",
            article_count=0,
            total_retrieved=total_retrieved,
        )
    pos_total = sum(article.positive for article, _ in eligible)
    neg_total = sum(article.negative for article, _ in eligible)
    ids = [evidence_id for _, evidence_id in eligible]
    n = len(eligible)
    if pos_total + neg_total == 0:
        score = 5.0
        band = SentimentBand.NEUTRAL
        rationale = (
            f"No directional keywords in {n} company-specific article(s); "
            "neutral with low confidence."
        )
    else:
        raw = (pos_total - neg_total) / (pos_total + neg_total)
        reliability = n / (n + 2.0)
        adjusted = raw * reliability
        score = round(5.0 + 5.0 * adjusted, 1)
        band = _band_for_adjusted(adjusted, pos_total, neg_total)
        rationale = (
            f"Company-specific sentiment from {n} article(s): {pos_total} positive vs "
            f"{neg_total} negative keyword signals; adjusted polarity {adjusted:+.2f} "
            "after small-sample shrinkage (n/(n+2))."
        )
    return SentimentRead(
        band=band,
        score=score,
        confidence=_confidence_for(n, pos_total + neg_total),
        rationale=rationale,
        evidence_ids=ids,
        source=SentimentSource.DETERMINISTIC,
        method="deterministic_keyword_v2",
        positive_signals=pos_total,
        negative_signals=neg_total,
        article_count=n,
        total_retrieved=total_retrieved,
    )


def _band_for_adjusted(adjusted: float, pos: int, neg: int) -> SentimentBand:
    if adjusted >= 0.35:
        return SentimentBand.BULLISH
    if adjusted >= 0.12:
        return SentimentBand.MILDLY_BULLISH
    if adjusted <= -0.35:
        return SentimentBand.BEARISH
    if adjusted <= -0.12:
        return SentimentBand.MILDLY_BEARISH
    if pos and neg:
        return SentimentBand.MIXED
    return SentimentBand.NEUTRAL


def _confidence_for(article_count: int, signal_count: int) -> str:
    if article_count >= 3 and signal_count >= 3:
        return "medium"
    return "low"


def deterministic_events(
    classified: list[ClassifiedArticle], evidence_by_index: dict[int, str], ticker: str
) -> list[EventClaim]:
    """Extract events from non-irrelevant articles, each citing its evidence."""
    events: list[EventClaim] = []
    for index, article in enumerate(classified):
        if article.relevance is RelevanceClass.IRRELEVANT:
            continue
        item = article.item
        text = f"{item.title} {item.body}"
        event_type = EventType.OTHER
        for candidate, keywords in _EVENT_KEYWORDS:
            if any(entities.term_matches(text, word) for word in keywords):
                event_type = candidate
                break
        sectors = [
            name
            for name, kws in _SECTOR_KEYWORDS.items()
            if any(entities.term_matches(text, w) for w in kws)
        ]
        macros = [
            name
            for name, kws in _MACRO_KEYWORDS.items()
            if any(entities.term_matches(text, w) for w in kws)
        ]
        events.append(
            EventClaim(
                event_id=f"e{len(events) + 1}",
                event_type=event_type,
                summary=item.title,
                entities=[ticker] if ticker and article.included else [],
                sectors=sectors,
                macro_factors=macros,
                published_at=item.published_at,
                evidence_ids=[evidence_by_index[index]],
                confidence="low",
                uncertainty="high",
                relevance=article.relevance,
                relevance_reason=article.reason,
                matched_entity=article.matched_entity,
            )
        )
    return events


def build_impact_hypotheses(
    events: list[EventClaim], ticker: str, profile: EntityProfile
) -> list[TransmissionPath]:
    """Hypotheses only where the company has a *verified* exposure to the factor.

    A shared macro article never becomes a positive company call: when the
    source article is not company-specific the direction is left ``UNCLEAR``.
    Macro factors the company is not exposed to (per :mod:`entities`) are
    ignored rather than assigned an invented mechanism.
    """
    paths: list[TransmissionPath] = []
    seen: set[tuple[str, str]] = set()
    for event in events:
        if event.relevance is RelevanceClass.IRRELEVANT:
            continue
        for factor in event.macro_factors:
            if factor not in profile.macro_factors:
                continue
            key = (factor, ticker)
            if key in seen:
                continue
            seen.add(key)
            direction = (
                _direction_from_event(event)
                if event.relevance is RelevanceClass.COMPANY_SPECIFIC
                else Direction.UNCLEAR
            )
            paths.append(
                _path(
                    index=len(paths),
                    source_factor=factor,
                    ticker=ticker,
                    direction=direction,
                    mechanism=_MECHANISMS.get(factor, "Plausible transmission channel."),
                    evidence_ids=event.evidence_ids,
                )
            )
        if event.relevance is RelevanceClass.SECTOR_RELEVANT and profile.sector:
            factor = event.matched_entity or profile.sector
            key = (factor, ticker)
            if key not in seen:
                seen.add(key)
                paths.append(
                    _path(
                        index=len(paths),
                        source_factor=factor,
                        ticker=ticker,
                        direction=_direction_from_event(event),
                        mechanism=_SECTOR_MECHANISMS.get(
                            profile.sector,
                            f"{profile.sector} demand/cost conditions can affect {profile.name}.",
                        ),
                        evidence_ids=event.evidence_ids,
                    )
                )
    return paths


def _path(
    *, index: int, source_factor: str, ticker: str, direction: Direction,
    mechanism: str, evidence_ids: list[str],
) -> TransmissionPath:
    return TransmissionPath(
        pathway_id=f"p{index + 1}",
        source_factor=source_factor,
        target=EntityLink(entity_id=ticker, kind=EntityKind.EQUITY, confidence="low"),
        direction=direction,
        mechanism=mechanism,
        horizon=Horizon.THREE_TO_SIX_MONTHS,
        supporting_evidence_ids=list(evidence_ids),
        counterevidence_ids=[],
        confidence="low",
        uncertainty="high",
        is_verified=False,
    )


def _direction_from_event(event: EventClaim) -> Direction:
    pos, neg = _score_text(event.summary)
    if pos and neg:
        return Direction.MIXED
    if pos:
        return Direction.POSITIVE
    if neg:
        return Direction.NEGATIVE
    return Direction.UNCLEAR


def evidence_from_items(items: list[NewsItem]) -> tuple[list[EvidenceRef], list[str], dict[int, str]]:
    """Build evidence records, preserving order; returns (refs, ids, index->id)."""
    classified = [
        ClassifiedArticle(
            item=item,
            feed="company_news",
            relevance=RelevanceClass.IRRELEVANT,
            reason="",
            matched_entity=None,
            positive=0,
            negative=0,
        )
        for item in items
    ]
    return evidence_from_classified(classified)


def evidence_from_classified(
    classified: list[ClassifiedArticle],
) -> tuple[list[EvidenceRef], list[str], dict[int, str]]:
    """Build evidence records carrying the relevance classification."""
    refs: list[EvidenceRef] = []
    ids: list[str] = []
    by_index: dict[int, str] = {}
    retrieved = _now()
    for index, article in enumerate(classified):
        evidence_id = f"ev_{index + 1}"
        by_index[index] = evidence_id
        ids.append(evidence_id)
        refs.append(
            EvidenceRef(
                evidence_id=evidence_id,
                source=article.item.source,
                title=article.item.title,
                url=article.item.url,
                publisher=article.item.publisher,
                published_at=article.item.published_at,
                retrieved_at=retrieved,
                relevance=article.relevance,
                relevance_reason=article.reason,
                matched_entity=article.matched_entity,
                included_in_sentiment=article.included,
                source_feed=article.feed,
            )
        )
    return refs, ids, by_index


def build_relevance_summary(classified: list[ClassifiedArticle]) -> RelevanceSummary:
    def count(target: RelevanceClass) -> int:
        return sum(1 for article in classified if article.relevance is target)

    return RelevanceSummary(
        total_retrieved=len(classified),
        company_specific=count(RelevanceClass.COMPANY_SPECIFIC),
        sector_relevant=count(RelevanceClass.SECTOR_RELEVANT),
        macro_context=count(RelevanceClass.MACRO_CONTEXT),
        irrelevant=count(RelevanceClass.IRRELEVANT),
        included_in_sentiment=sum(1 for article in classified if article.included),
    )


def build_data_quality(
    sources: list[SourceQuality], missing_inputs: list[str], notes: list[str]
) -> DataQuality:
    return DataQuality(sources=sources, missing_inputs=missing_inputs, notes=notes)


def assemble_report(
    *,
    request_entity: str,
    classified: list[ClassifiedArticle],
    sentiment: SentimentRead,
    events: list[EventClaim],
    hypotheses: list[TransmissionPath],
    data_quality: DataQuality,
    unavailable: list[UnavailableEvidence],
) -> SentimentImpactReport:
    refs, _ids, _by_index = evidence_from_classified(classified)
    return SentimentImpactReport(
        observed_facts=refs,
        sentiment=sentiment,
        events=events,
        impact_hypotheses=hypotheses,
        relevance_summary=build_relevance_summary(classified),
        data_quality=data_quality,
        unavailable_evidence=unavailable,
    )


def overall_status(
    sentiment: SentimentRead, classified: list[ClassifiedArticle], errors: list[str]
) -> ReportStatus:
    if not classified:
        return ReportStatus.UNAVAILABLE
    has_company = any(article.included for article in classified)
    if has_company:
        return ReportStatus.PARTIAL if errors else ReportStatus.AVAILABLE
    has_context = any(
        article.relevance in (RelevanceClass.SECTOR_RELEVANT, RelevanceClass.MACRO_CONTEXT)
        for article in classified
    )
    return ReportStatus.PARTIAL if has_context else ReportStatus.UNAVAILABLE


def render_report_markdown(report: SentimentImpactReport) -> str:
    """Render a plain-markdown view of the report for exports and the UI."""
    lines: list[str] = ["# Sentiment & Market Impact Report", ""]
    sentiment = report.sentiment
    score = "n/a" if sentiment.score is None else f"{sentiment.score:.1f}/10"
    lines += [
        "## Sentiment",
        f"- Band: **{sentiment.band.value}**",
        f"- Score: {score}",
        f"- Confidence: {sentiment.confidence}",
        f"- Source: {sentiment.source.value}",
        f"- Method: {sentiment.method}",
        f"- Signals: {sentiment.positive_signals} positive / {sentiment.negative_signals} negative",
        f"- Eligible articles: {sentiment.article_count} of {sentiment.total_retrieved} retrieved",
        f"- Rationale: {sentiment.rationale}",
        "",
    ]
    summary = report.relevance_summary
    lines += [
        "## Evidence Relevance",
        f"- Retrieved: {summary.total_retrieved}",
        f"- Company-specific (scored): {summary.company_specific}",
        f"- Sector-relevant (context): {summary.sector_relevant}",
        f"- Macro context (context): {summary.macro_context}",
        f"- Irrelevant (excluded): {summary.irrelevant}",
        "",
    ]
    lines += ["## Observed Facts", ""]
    if report.observed_facts:
        for ref in report.observed_facts:
            when = ref.published_at.isoformat() if ref.published_at else "date unknown"
            link = f" — {ref.url}" if ref.url else ""
            flag = "" if ref.included_in_sentiment else " [excluded from score]"
            lines.append(
                f"- [{ref.evidence_id}] ({when}) {ref.title}{link} "
                f"— {ref.relevance.value}{flag}: {ref.relevance_reason}"
            )
    else:
        lines.append("- No evidence available.")
    lines += ["", "## Events", ""]
    if report.events:
        for event in report.events:
            lines.append(
                f"- [{event.event_id}] {event.event_type.value}: {event.summary} "
                f"({event.relevance.value}; confidence: {event.confidence}, "
                f"uncertainty: {event.uncertainty})"
            )
    else:
        lines.append("- No events identified.")
    lines += ["", "## Impact Hypotheses", ""]
    if report.impact_hypotheses:
        lines.append("_Hypotheses only; not verified causal claims._")
        lines.append("")
        for path in report.impact_hypotheses:
            lines.append(
                f"- [{path.pathway_id}] {path.source_factor} → {path.target.entity_id} "
                f"({path.direction.value}, {path.horizon.value}): {path.mechanism} "
                f"[evidence: {', '.join(path.supporting_evidence_ids) or 'none'}]"
            )
    else:
        lines.append("- No impact hypotheses derived.")
    lines += ["", "## Data Quality", ""]
    for source in report.data_quality.sources:
        lines.append(
            f"- {source.vendor}: {source.status.value} (freshness: {source.freshness})"
        )
    for missing in report.data_quality.missing_inputs:
        lines.append(f"- Missing: {missing}")
    lines += ["", "## Unavailable Evidence", ""]
    if report.unavailable_evidence:
        for item in report.unavailable_evidence:
            lines.append(f"- {item.capability}: {item.status.value} — {item.reason}")
    else:
        lines.append("- None.")
    if report.validation is not None:
        lines += ["", "## Historical Validation", "", f"- {report.validation.status.value}"]
    if report.causal is not None:
        lines += ["", "## Causal Assessment", "", f"- {report.causal.status.value}"]
    lines.append("")
    return "\n".join(lines)
