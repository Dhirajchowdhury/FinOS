"""Factory for instantiating FinOS LLM clients lazily.

Defines create_llm_client to instantiate provider clients without eager imports
of heavyweight provider SDKs. Full client wiring happens in Phase B2.
"""

from __future__ import annotations

from typing import Any
from finos.core.llm.base_client import BaseLLMClient


def create_llm_client(
    provider: str,
    model: str,
    base_url: str | None = None,
    **kwargs: Any,
) -> BaseLLMClient:
    """Create and return a configured BaseLLMClient for the requested provider."""
    raise NotImplementedError(
        f"Provider factory for '{provider}' will be connected in Phase B2 migration."
    )
