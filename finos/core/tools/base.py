"""Base tool abstractions and registry for FinOS Core.

Tools registered here take runtime as_of_date constraints via LangGraph InjectedState,
ensuring data access adheres strictly to point-in-time boundaries.
"""

from __future__ import annotations

from typing import Any, Callable


class FinosToolRegistry:
    """Registry managing available tools and their categories."""

    def __init__(self):
        self._tools: dict[str, Callable] = {}

    def register(self, name: str, func: Callable) -> None:
        """Register a callable tool with a unique name."""
        self._tools[name] = func

    def get(self, name: str) -> Callable | None:
        """Retrieve tool by name."""
        return self._tools.get(name)

    def list_tools(self) -> list[str]:
        """List all registered tool names."""
        return list(self._tools.keys())
