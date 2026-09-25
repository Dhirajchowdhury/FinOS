"""Common schema validation and normalization utilities for FinOS Core.

This module houses general-purpose data cleaning functions used across all
Pydantic contracts, particularly for normalizing noisy outputs from LLMs.
"""

from __future__ import annotations

from typing import Any

_NULLISH_VALUES = frozenset({"", "none", "n/a", "na", "null", "nil", "-", "tbd", "unknown"})


def coerce_optional_float(value: Any) -> float | None:
    """Normalize LLM numeric strings to float or None.

    Handles common LLM formatting patterns:
    - Placeholder strings ("None", "N/A", "null") -> None
    - Formatted currencies ("$1,234.50", "€100") -> float
    - Percentage strings ("15%") -> None (cannot infer absolute level)
    - Non-numeric strings or ranges ("100-120") -> None
    """
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    if not isinstance(value, str):
        return None

    cleaned = value.strip()
    if cleaned.lower() in _NULLISH_VALUES or cleaned.endswith("%"):
        return None

    cleaned = cleaned.replace(",", "").lstrip("$€£¥").strip()
    try:
        return float(cleaned)
    except ValueError:
        return None
