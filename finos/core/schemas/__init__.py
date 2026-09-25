"""FinOS Structured Schemas.

Pydantic models and data validation contracts for domain-neutral financial
intelligence outputs, ratings, and sentiment scoring.
"""

from finos.core.schemas.common import coerce_optional_float
from finos.core.schemas.rating import DomainRating, EvaluationRating
from finos.core.schemas.sentiment import SentimentBand, SentimentScore

__all__ = [
    "DomainRating",
    "EvaluationRating",
    "SentimentBand",
    "SentimentScore",
    "coerce_optional_float",
]
