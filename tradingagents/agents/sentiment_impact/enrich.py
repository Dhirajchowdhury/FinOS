"""Optional LLM enrichment for the sentiment-impact feature.

The LLM is optional: :func:`resolve_llm` returns ``None`` when no usable client
can be built, and every failure here degrades to the deterministic baseline
rather than raising. This module never fabricates a sentiment read.
"""

from __future__ import annotations

import logging
import os
from typing import Literal

from pydantic import BaseModel

from tradingagents.agents.schemas import SentimentBand
from tradingagents.agents.sentiment_impact.schemas import (
    NewsItem,
    SentimentRead,
    SentimentSource,
)
from tradingagents.agents.structured import bind_structured

logger = logging.getLogger(__name__)

# env var consulted per provider before an LLM is considered configured.
_PROVIDER_KEYS = {
    "google": "GOOGLE_API_KEY",
    "anthropic": "ANTHROPIC_API_KEY",
    "openai": "OPENAI_API_KEY",
    "xai": "XAI_API_KEY",
}


class _LLMSentiment(BaseModel):
    band: SentimentBand
    score: float
    confidence: Literal["low", "medium", "high"]
    rationale: str


def resolve_llm(config: dict | None = None):
    """Return a usable chat client, or ``None`` when none is configured.

    Builds a client only when the configured provider has an API key present.
    Any construction error is swallowed (the caller falls back to the
    deterministic baseline).
    """
    try:
        from tradingagents.default_config import DEFAULT_CONFIG
        from tradingagents.llm_clients.factory import build_llm_kwargs, create_llm_client

        cfg = config or DEFAULT_CONFIG
        provider = str(cfg.get("llm_provider", "")).lower()
        key_var = _PROVIDER_KEYS.get(provider)
        if not key_var or not os.getenv(key_var):
            return None
        kwargs = build_llm_kwargs(cfg)
        kwargs["api_key"] = os.getenv(key_var)
        model = cfg.get("quick_think_llm") or cfg.get("deep_think_llm")
        client = create_llm_client(provider=provider, model=model, **kwargs)
        return client.get_llm()
    except Exception as exc:  # noqa: BLE001 - any failure means "no LLM"
        logger.warning("sentiment-impact: LLM unavailable (%s); using deterministic baseline", exc)
        return None


def enrich_sentiment(
    items: list[NewsItem], evidence_ids: list[str], llm
) -> SentimentRead | None:
    """Ask the LLM for a sentiment read; ``None`` on any failure or no client."""
    if llm is None or not items:
        return None
    structured = bind_structured(llm, _LLMSentiment, "Sentiment Impact Enrichment")
    if structured is None:
        return None
    headlines = "\n".join(f"- {item.title}" for item in items[:20])
    prompt = (
        "You are a financial sentiment analyst. Based only on the headlines "
        "below, return the overall sentiment as one of the allowed bands, a "
        "0-10 score, a confidence level and a one-paragraph rationale. Do not "
        "invent facts not present in the headlines.\n\n"
        f"Headlines:\n{headlines}"
    )
    try:
        result = structured.invoke(prompt)
        if result is None:
            raise ValueError("structured output returned no parsed result")
        return SentimentRead(
            band=result.band,
            score=max(0.0, min(10.0, float(result.score))),
            confidence=result.confidence,
            rationale=f"LLM enrichment: {result.rationale}",
            evidence_ids=list(evidence_ids),
            source=SentimentSource.LLM,
            method="llm_sentiment",
            article_count=len(items),
        )
    except Exception as exc:  # noqa: BLE001 - fall back to deterministic
        logger.warning("sentiment-impact: LLM enrichment failed (%s); using baseline", exc)
        return None
