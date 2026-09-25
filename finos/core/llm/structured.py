"""Shared helpers for invoking LLMs with structured schemas and fallback handling.

Enables type-safe extraction via Pydantic schemas with automatic free-text fallback
when structured output is unsupported by the provider or fails to parse.
"""

from __future__ import annotations

import logging
from collections.abc import Callable
from typing import Any, TypeVar
from pydantic import BaseModel

logger = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)

NO_EXTERNAL_TOOLS = (
    "Use only the evidence provided in this prompt. Do not call external tools "
    "or search the web; if something is missing, state it explicitly."
)


def bind_structured(llm: Any, schema: type[T], component_name: str) -> Any | None:
    """Bind schema to LLM using with_structured_output or return None if unsupported."""
    try:
        return llm.with_structured_output(schema)
    except (NotImplementedError, AttributeError) as exc:
        logger.warning(
            "%s: provider does not support with_structured_output (%s); falling back to plain text",
            component_name, exc,
        )
        return None


def invoke_structured_or_freetext(
    structured_llm: Any | None,
    plain_llm: Any,
    prompt: Any,
    render: Callable[[T], str],
    component_name: str,
) -> str:
    """Execute structured LLM invocation with graceful fallback to plain-text."""
    if structured_llm is not None:
        try:
            result = structured_llm.invoke(prompt)
            if result is None:
                raise ValueError("structured output returned no parsed result")
            return render(result)
        except Exception as exc:
            logger.warning(
                "%s: structured invocation failed (%s); retrying as free text",
                component_name, exc,
            )

    response = plain_llm.invoke(prompt)
    return getattr(response, "content", str(response))
