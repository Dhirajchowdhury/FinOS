"""ContextVar runtime configuration scoping for FinOS data routines.

Allows thread-safe execution-scoped configuration overlays without race conditions
when multiple workflows run concurrently in the same process.
"""

from __future__ import annotations

from contextlib import contextmanager
from contextvars import ContextVar
from copy import deepcopy
from typing import Any

from finos.core.config import FINOS_CONFIG

_run_config: ContextVar[dict[str, Any] | None] = ContextVar("finos_run_config", default=None)


def get_data_config() -> dict[str, Any]:
    """Retrieve execution-scoped configuration or fallback to process defaults."""
    scoped = _run_config.get()
    if scoped is not None:
        return deepcopy(scoped)
    return deepcopy(FINOS_CONFIG)


@contextmanager
def scoped_config(config_override: dict[str, Any]):
    """Context manager binding temporary configuration to current thread/coroutine."""
    merged = deepcopy(get_data_config())
    merged.update(config_override)
    token = _run_config.set(merged)
    try:
        yield
    finally:
        _run_config.reset(token)
