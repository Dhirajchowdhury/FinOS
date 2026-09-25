"""ConditionalRouter for dynamic workflow transitions and iterative debate loops.

Provides routing evaluation functions determining next node execution based on
state counters, completion signals, or consensus flags without assuming fixed stock debate roles.
"""

from __future__ import annotations

from typing import Any


class ConditionalRouter:
    """Evaluates conditional edges within FinOS workflows."""

    def __init__(self, max_rounds: int = 1):
        self.max_rounds = max_rounds

    def evaluate_loop(self, state: dict[str, Any], counter_key: str, next_node: str, end_node: str) -> str:
        """Evaluate whether to continue an iterative cycle or proceed to termination."""
        count = state.get("metadata", {}).get(counter_key, 0)
        if count >= self.max_rounds:
            return end_node
        return next_node
