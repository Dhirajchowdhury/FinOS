"""Parameter validation for FinOS LLM client configurations.

Validates max_retries, max_tokens, and temperature boundaries.
"""

from __future__ import annotations

from typing import Any


def validate_max_retries(value: Any) -> int | None:
    """Validate max_retries parameter as non-negative integer."""
    if value is None:
        return None
    if isinstance(value, bool):
        raise ValueError(f"max_retries must be an integer, not boolean: {value!r}")
    try:
        n = int(value)
    except (TypeError, ValueError) as exc:
        raise ValueError(f"max_retries must be an integer, got {value!r}") from exc
    if n < 0:
        raise ValueError(f"max_retries must be >= 0, got {n}")
    return n


def validate_max_tokens(value: Any) -> int | None:
    """Validate max_tokens parameter as positive integer."""
    if value is None:
        return None
    if isinstance(value, bool):
        raise ValueError(f"max_tokens must be an integer, not boolean: {value!r}")
    try:
        n = int(value)
    except (TypeError, ValueError) as exc:
        raise ValueError(f"max_tokens must be an integer, got {value!r}") from exc
    if n <= 0:
        raise ValueError(f"max_tokens must be > 0, got {n}")
    return n
