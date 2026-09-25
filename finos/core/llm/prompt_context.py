"""Prompt context utilities and message management for FinOS LLM workflows.

Provides language instructions, message history reduction/pruning, and missing artifact
notices so agents never hallucinate content for omitted reports.
"""

from __future__ import annotations

from typing import Any
from langchain_core.messages import HumanMessage, RemoveMessage


def get_language_instruction(language: str = "English") -> str:
    """Return prompt instruction enforcing output localization."""
    if language.strip().lower() == "english":
        return ""
    return f" Write your entire response in {language}."


def create_msg_cleaner(anchor_prompt: str):
    """Return a node function that prunes message history and seeds an anchor prompt."""
    def clean_messages(state: dict[str, Any]) -> dict[str, Any]:
        messages = state.get("messages", [])
        removals = [RemoveMessage(id=m.id) for m in messages if hasattr(m, "id")]
        placeholder = HumanMessage(content=anchor_prompt)
        return {"messages": removals + [placeholder]}
    return clean_messages
