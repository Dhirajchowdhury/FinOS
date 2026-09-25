"""Append-only decision and assessment audit log for FinOS Core.

Records financial evaluations with resolution timestamps, allowing historical
workflows to retrieve only lessons known as-of the simulation boundary without lookahead bias.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any


class FinosMemoryLog:
    """Manages append-only markdown and structured decision memory logs."""

    def __init__(self, log_path: str | Path | None = None):
        self.log_path = Path(log_path) if log_path else None

    def record_assessment(
        self,
        entity_id: str,
        as_of_date: str,
        assessment_content: str,
        tags: list[str] | None = None,
    ) -> None:
        """Append an assessment entry to the immutable log."""
        if not self.log_path:
            return
        self.log_path.parent.mkdir(parents=True, exist_ok=True)
        # Entry appending logic will be connected in Phase B3

    def get_past_context(self, entity_id: str, as_of_date: str | None = None) -> str:
        """Retrieve historical lessons resolved on or before as_of_date."""
        return ""
