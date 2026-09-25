"""Model capabilities and feature detection for FinOS LLM clients.

Detects support for reasoning effort, thinking budgets, temperature forwarding,
and native structured output modes per provider and model family.
"""

from __future__ import annotations


def supports_thinking(provider: str, model: str) -> bool:
    """Check if model supports reasoning/thinking configuration parameters."""
    prov = provider.lower()
    m = model.lower()
    if prov == "google" and ("gemini-2" in m or "gemini-3" in m):
        return True
    if prov in ("openai", "azure") and (m.startswith("o1") or m.startswith("o3")):
        return True
    if prov == "anthropic" and ("claude-3-7" in m or "claude-4" in m or "claude-5" in m):
        return True
    return False
