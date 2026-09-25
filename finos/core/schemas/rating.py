"""Domain-neutral financial rating schemas and evaluation scales for FinOS.

Defines standardized assessment tiers for financial intelligence analyses,
supporting risk ratings, qualitative confidence bands, and review sentinels.
Does not hardcode stock-trading transaction calls (Buy/Sell/Hold).
"""

from __future__ import annotations

from enum import Enum


class EvaluationRating(str, Enum):
    """General evaluation tiers for financial entity health and risk."""

    VERY_FAVORABLE = "Very Favorable"
    FAVORABLE = "Favorable"
    NEUTRAL = "Neutral"
    UNFAVORABLE = "Unfavorable"
    VERY_UNFAVORABLE = "Very Unfavorable"
    REVIEW = "REVIEW"


class DomainRating(str, Enum):
    """Categorical risk assessment rating."""

    LOW_RISK = "Low Risk"
    MODERATE_RISK = "Moderate Risk"
    ELEVATED_RISK = "Elevated Risk"
    HIGH_RISK = "High Risk"
    CRITICAL_RISK = "Critical Risk"
    INDETERMINATE = "INDETERMINATE"
