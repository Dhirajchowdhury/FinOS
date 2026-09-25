"""FinOS Core Configuration Module.

Provides configuration defaults and environment-variable resolution for FinOS Core.
Standard prefix: FINOS_* (e.g. FINOS_LLM_PROVIDER, FINOS_RESULTS_DIR).
Maintains fallback compatibility with TRADINGAGENTS_* and standard provider keys.
"""

from __future__ import annotations

import os
from copy import deepcopy
from pathlib import Path
from typing import Any

# Default FinOS home directory
_FINOS_HOME = os.getenv("FINOS_HOME") or os.path.join(os.path.expanduser("~"), ".finos")

_ENV_KEY_MAP: dict[str, tuple[str, ...]] = {
    "llm_provider": ("FINOS_LLM_PROVIDER", "TRADINGAGENTS_LLM_PROVIDER"),
    "deep_think_llm": ("FINOS_DEEP_THINK_LLM", "TRADINGAGENTS_DEEP_THINK_LLM"),
    "quick_think_llm": ("FINOS_QUICK_THINK_LLM", "TRADINGAGENTS_QUICK_THINK_LLM"),
    "backend_url": ("FINOS_LLM_BACKEND_URL", "TRADINGAGENTS_LLM_BACKEND_URL"),
    "results_dir": ("FINOS_RESULTS_DIR", "TRADINGAGENTS_RESULTS_DIR"),
    "cache_dir": ("FINOS_CACHE_DIR", "TRADINGAGENTS_CACHE_DIR"),
    "memory_log_path": ("FINOS_MEMORY_LOG_PATH", "TRADINGAGENTS_MEMORY_LOG_PATH"),
    "output_language": ("FINOS_OUTPUT_LANGUAGE", "TRADINGAGENTS_OUTPUT_LANGUAGE"),
    "checkpoint_enabled": ("FINOS_CHECKPOINT_ENABLED", "TRADINGAGENTS_CHECKPOINT_ENABLED"),
    "temperature": ("FINOS_TEMPERATURE", "TRADINGAGENTS_TEMPERATURE"),
    "max_retries": ("FINOS_LLM_MAX_RETRIES", "TRADINGAGENTS_LLM_MAX_RETRIES"),
    "max_tokens": ("FINOS_MAX_TOKENS", "TRADINGAGENTS_MAX_TOKENS"),
}

_BOOL_TRUE = frozenset({"true", "1", "yes", "on"})
_BOOL_FALSE = frozenset({"false", "0", "no", "off"})


def _coerce(val: str, default: Any) -> Any:
    """Coerce string value to the type of reference default."""
    if isinstance(default, bool):
        norm = val.strip().lower()
        if norm in _BOOL_TRUE:
            return True
        if norm in _BOOL_FALSE:
            return False
        raise ValueError(f"Expected boolean ({'/'.join(_BOOL_TRUE | _BOOL_FALSE)}), got {val!r}")
    if isinstance(default, int) and not isinstance(default, bool):
        return int(val)
    if isinstance(default, float):
        return float(val)
    return val


def _resolve_env(key: str, default: Any) -> Any:
    """Check FINOS_* first, then fallbacks, then default value."""
    env_vars = _ENV_KEY_MAP.get(key, ())
    for var in env_vars:
        raw = os.getenv(var)
        if raw is not None and raw.strip() != "":
            try:
                return _coerce(raw, default)
            except ValueError as exc:
                raise ValueError(f"Invalid value for {var}: {exc}") from exc
    return default


FINOS_CONFIG: dict[str, Any] = {
    # System Paths
    "results_dir": _resolve_env("results_dir", str(Path(_FINOS_HOME) / "reports")),
    "cache_dir": _resolve_env("cache_dir", str(Path(_FINOS_HOME) / "cache")),
    "memory_log_path": _resolve_env("memory_log_path", str(Path(_FINOS_HOME) / "memory" / "finos_memory.md")),
    # LLM Settings
    "llm_provider": _resolve_env("llm_provider", "openai"),
    "deep_think_llm": _resolve_env("deep_think_llm", "gpt-4o"),
    "quick_think_llm": _resolve_env("quick_think_llm", "gpt-4o-mini"),
    "backend_url": _resolve_env("backend_url", None),
    "temperature": _resolve_env("temperature", None),
    "max_retries": _resolve_env("max_retries", None),
    "max_tokens": _resolve_env("max_tokens", None),
    # Workflow Execution Settings
    "checkpoint_enabled": _resolve_env("checkpoint_enabled", False),
    "output_language": _resolve_env("output_language", "English"),
    "max_recur_limit": 100,
    # Data Vendor Routing (Core data categories)
    "data_vendors": {
        "core_market_data": "yfinance",
        "fundamentals": "sec_edgar",
        "macro_data": "fred",
        "prediction_markets": "polymarket",
        "news_data": "yahoo",
    },
    "tool_vendors": {},
}


def get_core_config() -> dict[str, Any]:
    """Return a deep copy of current FinOS Core configuration."""
    return deepcopy(FINOS_CONFIG)
