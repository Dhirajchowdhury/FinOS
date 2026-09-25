"""WorkflowBuilder for FinOS Core StateGraphs.

Responsible for assembling LangGraph StateGraph instances from dynamic node
execution plans without hardcoding specific agent personas or topologies.
"""

from __future__ import annotations

from typing import Any
from langgraph.graph import StateGraph
from finos.core.state.base import FinosState
from finos.core.graph.execution_plan import NodeExecutionPlan


class WorkflowBuilder:
    """Constructs LangGraph StateGraph workflows dynamically."""

    def __init__(self, state_schema: type = FinosState):
        self.state_schema = state_schema

    def build_graph(self, plan: NodeExecutionPlan) -> StateGraph:
        """Construct an uncompiled StateGraph from a given execution plan."""
        workflow = StateGraph(self.state_schema)
        for spec in plan.specs:
            workflow.add_node(spec.name, spec.handler)
        return workflow
