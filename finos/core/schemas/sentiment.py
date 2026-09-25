"""Sentiment schemas and structured signal models for FinOS Core.

Defines schemas for extracting structured sentiment direction, intensity,
confidence levels, and supporting evidence from textual or social feeds.
"""

from __future__ import annotations

from enum import Enum
from typing import Literal
from pydantic import BaseModel, Field


class SentimentBand(str, Enum):
    """Discrete sentiment categories across market and macro narratives."""

    BULLISH = "Bullish"
    MILDLY_BULLISH = "Mildly Bullish"
    NEUTRAL = "Neutral"
    MIXED = "Mixed"
    MILDLY_BEARISH = "Mildly Bearish"
    BEARISH = "Bearish"


class SentimentScore(BaseModel):
    """Structured sentiment measurement contract.

    Attributes:
        band: Qualitative sentiment direction category.
        score: Numeric intensity score between 0.0 (bearish) and 10.0 (bullish).
        confidence: Assessment reliability based on data availability.
        summary: Terse natural-language summary of core narrative themes.
    """

    band: SentimentBand = Field(
        description="Categorical sentiment direction."
    )
    score: float = Field(
        ge=0.0,
        le=10.0,
        description="Numeric sentiment score: 0 = extreme negative/bearish, 10 = extreme positive/bullish."
    )
    confidence: Literal["low", "medium", "high"] = Field(
        default="medium",
        description="Confidence level in the assessment."
    )
    summary: str = Field(
        default="",
        description="Concise synthesis of evidence driving the score."
    )
