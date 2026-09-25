"""FinOS Universal LLM Client Engine.

Provides multi-provider LLM abstraction, capability detection, structured output binding,
and parameter validation across OpenAI, Anthropic, Google Gemini, Azure, Bedrock, and compatible APIs.
"""

from finos.core.llm.base_client import BaseLLMClient
from finos.core.llm.factory import create_llm_client
from finos.core.llm.structured import bind_structured, invoke_structured_or_freetext

__all__ = [
    "BaseLLMClient",
    "bind_structured",
    "create_llm_client",
    "invoke_structured_or_freetext",
]
