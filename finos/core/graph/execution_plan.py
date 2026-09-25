"""Dynamic NodeExecutionPlan for FinOS workflow graphs.

Allows configuring and sequencing arbitrary analysis or processing nodes without
hardcoding static graph topologies.
"""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass, field
from typing import Any


@dataclass(frozen=True)
class NodeSpec:
    """Specification of an executable node in a FinOS graph."""

    name: str
    handler: Callable[[dict[str, Any]], dict[str, Any]]
    clear_after: bool = False
    tools: tuple[Any, ...] = ()


@dataclass(frozen=True)
class NodeExecutionPlan:
    """Ordered collection of node specifications to assemble into a workflow."""

    specs: list[NodeSpec] = field(default_factory=list)
