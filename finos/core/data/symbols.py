"""Symbol normalization and path-traversal security guards for FinOS.

Normalizes financial symbols across vendor formats (e.g. crypto, forex, indices)
and validates entity identifier strings against filesystem path traversal attacks.
"""

from __future__ import annotations

import re

_SAFE_PATH_COMPONENT = re.compile(r"^[A-Za-z0-9._\-\^=+]+$")


def validate_safe_entity_path(value: str, max_len: int = 64) -> str:
    """Validate that value is safe to use in a filesystem path without directory escape."""
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"Entity identifier must be a non-empty string, got {value!r}")
    if len(value) > max_len:
        raise ValueError(f"Entity identifier exceeds max length {max_len}: {value!r}")
    if not _SAFE_PATH_COMPONENT.fullmatch(value):
        raise ValueError(f"Entity identifier contains illegal characters: {value!r}")
    if set(value) == {"."}:
        raise ValueError(f"Entity identifier cannot consist solely of dots: {value!r}")
    return value
