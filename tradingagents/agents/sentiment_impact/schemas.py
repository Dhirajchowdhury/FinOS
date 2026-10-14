"""Structured contracts for the sentiment & market-impact feature.

Phase 1 supplied the news-normalization boundary (``DataStatus``, ``NewsItem``,
``NormalizationResult``). The MVP layers the report contracts on top so the
``POST /analysis`` response can distinguish observed facts from interpretation,
hypotheses, uncertainty and unavailable evidence.

Design rules enforced by these models:
- Every interpretation or impact hypothesis references evidence by id; the
  evidence records live in ``observed_facts``.
- A score is optional and never invented; a missing conclusion is represented by
  an explicit ``DataStatus``/``ValidationStatus`` plus a reason.
- An impact pathway is a hypothesis, never proof of causation.
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Literal

from pydantic import BaseModel, Field

from tradingagents.agents.schemas import SentimentBand


class DataStatus(str, Enum):
    """Availability of a stage's inputs or output."""

    AVAILABLE = "AVAILABLE"
    INSUFFICIENT_DATA = "INSUFFICIENT_DATA"
    UNAVAILABLE = "UNAVAILABLE"
    FAILED = "FAILED"


class ReportStatus(str, Enum):
    """Availability of the whole report (response-level).

    Distinct from :class:`DataStatus`: a report can be ``PARTIAL`` when a
    defensible conclusion exists but some evidence was unavailable.
    """

    AVAILABLE = "AVAILABLE"
    PARTIAL = "PARTIAL"
    UNAVAILABLE = "UNAVAILABLE"
    FAILED = "FAILED"


class SentimentSource(str, Enum):
    """How a sentiment read was produced."""

    LLM = "llm"
    DETERMINISTIC = "deterministic"
    NONE = "none"


class RelevanceClass(str, Enum):
    """How a retrieved article relates to the requested entity.

    A ticker association returned by a vendor is not proof an article is about
    the company, so every article is classified by content. Only
    ``COMPANY_SPECIFIC`` articles are allowed to drive the headline sentiment
    score; the others are retained as labelled context or dropped from scoring.
    """

    COMPANY_SPECIFIC = "COMPANY_SPECIFIC"
    SECTOR_RELEVANT = "SECTOR_RELEVANT"
    MACRO_CONTEXT = "MACRO_CONTEXT"
    IRRELEVANT = "IRRELEVANT"


class EventType(str, Enum):
    EARNINGS = "earnings"
    GUIDANCE = "guidance"
    PRODUCT = "product"
    REGULATORY = "regulatory"
    MNA = "mna"
    MACRO = "macro"
    GEOPOLITICAL = "geopolitical"
    OTHER = "other"


class Direction(str, Enum):
    POSITIVE = "positive"
    NEGATIVE = "negative"
    MIXED = "mixed"
    UNCLEAR = "unclear"


class Horizon(str, Enum):
    INTRADAY = "intraday"
    DAYS = "days"
    ONE_TO_THREE_MONTHS = "1-3m"
    THREE_TO_SIX_MONTHS = "3-6m"
    SIX_TO_TWELVE_MONTHS = "6-12m"
    OVER_ONE_YEAR = ">1y"
    UNKNOWN = "unknown"


class EntityKind(str, Enum):
    EQUITY = "equity"
    SECTOR = "sector"
    MACRO = "macro"
    COMMODITY = "commodity"
    FX = "fx"


class ValidationStatus(str, Enum):
    AVAILABLE = "AVAILABLE"
    INSUFFICIENT_DATA = "INSUFFICIENT_DATA"
    UNAVAILABLE = "UNAVAILABLE"
    FAILED = "FAILED"


class NewsItem(BaseModel):
    """A single normalized news article."""

    source: str = Field(description="Vendor or feed the item came from, e.g. 'yahoo'.")
    title: str = Field(description="Headline; 'No title' when the vendor omits one.")
    body: str = Field(default="", description="Summary or body text; empty when absent.")
    published_at: datetime | None = Field(
        default=None,
        description="UTC-aware publication time; None when the vendor supplied none.",
    )
    url: str | None = Field(default=None, description="Canonical article link, when available.")
    publisher: str | None = Field(default=None, description="Publisher name, when available.")
    tickers: list[str] = Field(
        default_factory=list, description="Tickers this item is associated with, when known."
    )


class NormalizationResult(BaseModel):
    """Outcome of normalizing one vendor's news result."""

    vendor: str = Field(description="Vendor the raw result came from.")
    source_type: str = Field(default="news", description="Logical feed, e.g. 'news' or 'global_news'.")
    status: DataStatus = Field(description="Availability of the normalization.")
    items: list[NewsItem] = Field(default_factory=list, description="Normalized articles.")
    reason: str | None = Field(
        default=None, description="Explanation when the status is not AVAILABLE."
    )


class EvidenceRef(BaseModel):
    """Identifiable source record supporting a fact, interpretation or pathway."""

    evidence_id: str
    source: str
    title: str
    url: str | None = None
    publisher: str | None = None
    published_at: datetime | None = None
    retrieved_at: datetime | None = None
    relevance: RelevanceClass = Field(
        default=RelevanceClass.IRRELEVANT,
        description="Content-based relevance of this article to the requested entity.",
    )
    relevance_reason: str = Field(
        default="", description="Human-readable justification for the relevance class."
    )
    matched_entity: str | None = Field(
        default=None, description="The alias/sector/macro term that produced the class."
    )
    included_in_sentiment: bool = Field(
        default=False, description="True only for COMPANY_SPECIFIC articles used in the score."
    )
    source_feed: str | None = Field(
        default=None, description="Logical feed the article came from ('company_news'/'global_news')."
    )


class SentimentRead(BaseModel):
    """Sentiment direction, with an explicit producer and evidence basis."""

    band: SentimentBand
    score: float | None = Field(default=None, ge=0.0, le=10.0)
    confidence: Literal["low", "medium", "high"] = "low"
    rationale: str = ""
    evidence_ids: list[str] = Field(default_factory=list)
    source: SentimentSource = SentimentSource.NONE
    method: str = Field(
        default="deterministic_keyword_v2",
        description="Named scoring method, so the number is explainable.",
    )
    positive_signals: int = Field(default=0, ge=0, description="Positive keyword hits used.")
    negative_signals: int = Field(default=0, ge=0, description="Negative keyword hits used.")
    article_count: int = Field(
        default=0, ge=0, description="Company-specific articles that fed the score."
    )
    total_retrieved: int = Field(
        default=0, ge=0, description="Articles retrieved before relevance filtering."
    )


class EventClaim(BaseModel):
    """A reported event observed in the evidence (not an inferred consequence)."""

    event_id: str
    event_type: EventType = EventType.OTHER
    summary: str
    entities: list[str] = Field(default_factory=list)
    sectors: list[str] = Field(default_factory=list)
    macro_factors: list[str] = Field(default_factory=list)
    published_at: datetime | None = None
    evidence_ids: list[str] = Field(default_factory=list)
    confidence: Literal["low", "medium", "high"] = "low"
    uncertainty: Literal["low", "moderate", "high"] = "high"
    relevance: RelevanceClass = Field(
        default=RelevanceClass.IRRELEVANT,
        description="Relevance class of the article this event was derived from.",
    )
    relevance_reason: str = Field(default="", description="Why the source article was classified so.")


class EntityLink(BaseModel):
    entity_id: str
    kind: EntityKind = EntityKind.EQUITY
    confidence: Literal["low", "medium", "high"] = "low"


class TransmissionPath(BaseModel):
    """A plausible, evidence-backed impact hypothesis (never causal proof)."""

    pathway_id: str
    source_factor: str
    target: EntityLink
    direction: Direction = Direction.UNCLEAR
    mechanism: str = ""
    horizon: Horizon = Horizon.UNKNOWN
    supporting_evidence_ids: list[str] = Field(default_factory=list)
    counterevidence_ids: list[str] = Field(default_factory=list)
    confidence: Literal["low", "medium", "high"] = "low"
    uncertainty: Literal["low", "moderate", "high"] = "high"
    is_verified: bool = False


class SourceQuality(BaseModel):
    vendor: str
    retrieved_at: datetime | None = None
    freshness: str = "unknown"
    status: DataStatus = DataStatus.UNAVAILABLE


class DataQuality(BaseModel):
    sources: list[SourceQuality] = Field(default_factory=list)
    missing_inputs: list[str] = Field(default_factory=list)
    notes: list[str] = Field(default_factory=list)


class UnavailableEvidence(BaseModel):
    capability: str
    status: DataStatus = DataStatus.UNAVAILABLE
    reason: str = ""


class HistoricalValidation(BaseModel):
    """OPTIONAL event-study result; metrics stay null unless AVAILABLE."""

    status: ValidationStatus = ValidationStatus.UNAVAILABLE
    method: str | None = None
    window: str | None = None
    benchmark: str | None = None
    abnormal_return: float | None = None
    sample_size: int | None = None
    notes: list[str] = Field(default_factory=list)
    reason: str | None = None


class CausalAssessment(BaseModel):
    """OPTIONAL causal result; defaults to UNAVAILABLE (association != causation)."""

    status: ValidationStatus = ValidationStatus.UNAVAILABLE
    design: str | None = None
    assumptions: list[str] = Field(default_factory=list)
    limitations: list[str] = Field(default_factory=list)
    reason: str | None = None


class RelevanceSummary(BaseModel):
    """Counts of retrieved articles by relevance class (audit of the filter)."""

    total_retrieved: int = Field(default=0, ge=0)
    company_specific: int = Field(default=0, ge=0)
    sector_relevant: int = Field(default=0, ge=0)
    macro_context: int = Field(default=0, ge=0)
    irrelevant: int = Field(default=0, ge=0)
    included_in_sentiment: int = Field(default=0, ge=0)


class SentimentImpactReport(BaseModel):
    observed_facts: list[EvidenceRef] = Field(default_factory=list)
    sentiment: SentimentRead
    events: list[EventClaim] = Field(default_factory=list)
    impact_hypotheses: list[TransmissionPath] = Field(default_factory=list)
    relevance_summary: RelevanceSummary = Field(default_factory=RelevanceSummary)
    data_quality: DataQuality = Field(default_factory=DataQuality)
    unavailable_evidence: list[UnavailableEvidence] = Field(default_factory=list)
    validation: HistoricalValidation | None = None
    causal: CausalAssessment | None = None


class ReportRequest(BaseModel):
    entity_id: str
    entity_type: str | None = None
    market: str | None = None
    as_of_date: str | None = None
    window_days: int = 7


class SentimentImpactResponse(BaseModel):
    """The versioned ``POST /analysis`` response contract."""

    contract_version: str = "1.0"
    id: str | None = None
    analysis_id: str | None = None
    request: ReportRequest
    data_status: ReportStatus
    report: SentimentImpactReport
    errors: list[str] = Field(default_factory=list)
