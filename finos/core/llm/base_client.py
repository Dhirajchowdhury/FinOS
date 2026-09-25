"""Base LLM client interface and response normalization for FinOS Core.

Defines the BaseLLMClient abstract class and response content extractors that normalize
complex multi-part reasoning blocks (e.g. OpenAI Responses API, Gemini 3) into clean text.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any


def normalize_content(response: Any) -> Any:
    """Extract plain text string from multi-block or typed LLM response content."""
    content = getattr(response, "content", response)
    if isinstance(content, list):
        texts = [
            item.get("text", "") if isinstance(item, dict) and item.get("type") == "text"
            else item if isinstance(item, str) else ""
            for item in content
        ]
        response.content = "\n".join(t for t in texts if t)
    return response


class BaseLLMClient(ABC):
    """Abstract interface for all FinOS LLM provider clients."""

    def __init__(self, model: str, base_url: str | None = None, **kwargs: Any):
        self.model = model
        self.base_url = base_url
        self.kwargs = kwargs

    @abstractmethod
    def get_llm(self) -> Any:
        """Return the underlying LangChain chat model instance."""
        pass

    @abstractmethod
    def validate_model(self) -> bool:
        """Validate whether the specified model is supported by this provider."""
        pass
