"""State propagation helpers for FinOS workflows.

Initializes root FinosState and configures invocation parameters (recursion limits,
callbacks, stream modes).
"""

from __future__ import annotations

from typing import Any
from finos.core.state.base import FinosState


class StatePropagator:
    """Manages initial state seeding and graph invocation configuration."""

    def __init__(self, max_recur_limit: int = 100):
        self.max_recur_limit = max_recur_limit

    def create_initial_state(
        self,
        entity_id: str,
        as_of_date: str,
        entity_type: str = "equity",
        market: str = "NSE India",
        request: str = "",
        past_context: str = "",
        metadata: dict[str, Any] | None = None,
    ) -> FinosState:
        """Create clean initial state for graph execution."""
        return {
            "messages": [],
            "entity_id": entity_id,
            "entity_type": entity_type,
            "market": market,
            "as_of_date": as_of_date,
            "request": request,
            "sender": "system",
            "market_data": {},
            "news": {},
            "macro": {},
            "fundamentals": {},
            "credit": {},
            "investment": {},
            "risk": {},
            "portfolio": {},
            "tax": {},
            "fraud": {},
            "trading": {},
            "report": {},
            "data_quality": {},
            "missing_data": [],
            "errors": [],
            "provenance": {},
            "artifacts": {},
            "metadata": metadata or {},
            "past_context": past_context,
        }

