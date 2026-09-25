"""Factory for instantiating FinOS LLM clients lazily.

Adapts tradingagents.llm_clients.factory to create provider clients
without code duplication.
"""

from __future__ import annotations

from typing import Any
from tradingagents.llm_clients.factory import create_llm_client as _create_trading_llm_client


def create_llm_client(
    provider: str,
    model: str,
    base_url: str | None = None,
    **kwargs: Any,
) -> Any:
    """Create and return a configured LLM client for the requested provider."""
    return _create_trading_llm_client(provider=provider, model=model, base_url=base_url, **kwargs)

