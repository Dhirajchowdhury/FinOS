"""Sentiment & market-impact feature.

Phase 1 provides the news-normalization boundary: vendor news results (markdown
strings, flat dicts, nested ``content`` dicts) are turned into structured
:class:`NewsItem` records so later phases can reason over articles without
re-parsing each vendor's presentation format.

The MVP layer adds the report contracts, a deterministic baseline pipeline, an
optional LLM enrichment, and the :func:`run_sentiment_impact` orchestrator used
by ``POST /analysis``.
"""

from tradingagents.agents.sentiment_impact.agent import run_sentiment_impact
from tradingagents.agents.sentiment_impact.normalize import normalize_news
from tradingagents.agents.sentiment_impact.schemas import (
    DataQuality,
    DataStatus,
    Direction,
    EntityLink,
    EventClaim,
    EventType,
    EvidenceRef,
    Horizon,
    NewsItem,
    NormalizationResult,
    RelevanceClass,
    RelevanceSummary,
    ReportRequest,
    ReportStatus,
    SentimentImpactReport,
    SentimentImpactResponse,
    SentimentRead,
    SentimentSource,
    SourceQuality,
    TransmissionPath,
    UnavailableEvidence,
)

__all__ = [
    "DataQuality",
    "DataStatus",
    "Direction",
    "EntityLink",
    "EventClaim",
    "EventType",
    "EvidenceRef",
    "Horizon",
    "NewsItem",
    "NormalizationResult",
    "RelevanceClass",
    "RelevanceSummary",
    "ReportRequest",
    "ReportStatus",
    "SentimentImpactReport",
    "SentimentImpactResponse",
    "SentimentRead",
    "SentimentSource",
    "SourceQuality",
    "TransmissionPath",
    "UnavailableEvidence",
    "normalize_news",
    "run_sentiment_impact",
]
