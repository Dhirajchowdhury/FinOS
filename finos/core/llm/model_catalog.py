"""Known model catalogs and provider default mappings for FinOS.

Maintains registries of validated models for OpenAI, Google, Anthropic, Bedrock,
Azure, and OpenAI-compatible providers.
"""

from __future__ import annotations

KNOWN_MODELS: dict[str, tuple[str, ...]] = {
    "openai": ("gpt-4o", "gpt-4o-mini", "o1", "o3-mini"),
    "anthropic": ("claude-3-5-sonnet-latest", "claude-3-7-sonnet-latest", "claude-3-5-haiku-latest"),
    "google": ("gemini-2.0-flash", "gemini-2.0-pro-exp", "gemini-1.5-pro"),
    "deepseek": ("deepseek-chat", "deepseek-reasoner"),
}
