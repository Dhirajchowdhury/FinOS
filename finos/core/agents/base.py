"""Base domain agent abstractions and contracts for FinOS."""

from __future__ import annotations

from abc import ABC, abstractmethod
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class AgentStatus(str, Enum):
    """Implementation status of a FinOS domain agent."""
    ACTIVE = "active"
    ADAPTED = "adapted"
    PARTIAL = "partial"
    PLANNED = "planned"


class FinOSAgentInput(BaseModel):
    """Standardized input contract for all FinOS domain agents.

    Attributes:
        entity_id: Primary identifier for the financial subject (e.g., 'NVDA', 'CPIAUCSL', 'PORT-01').
        entity_type: Subject category (e.g., 'equity', 'macro_series', 'portfolio', 'credit_obligor').
        as_of_date: Strict point-in-time cutoff date ('YYYY-MM-DD').
        request: Task prompt, objective, or query string.
        context: Supplemental context data (e.g., portfolio holdings, market data).
        relevant_previous_outputs: Structured outputs from upstream domain agents.
    """
    entity_id: str
    entity_type: str = "equity"
    as_of_date: str
    request: str = ""
    context: dict[str, Any] = Field(default_factory=dict)
    relevant_previous_outputs: dict[str, Any] = Field(default_factory=dict)


class FinOSAgentOutput(BaseModel):
    """Standardized output contract for all FinOS domain agents.

    Attributes:
        agent_name: Name of the domain agent emitting the assessment (e.g., 'News Agent').
        entity_id: Primary identifier for the subject under analysis.
        as_of_date: Strict point-in-time observation date ('YYYY-MM-DD').
        summary: High-level summary of findings or recommendations.
        findings: Structured domain-specific assessment or dictionary.
        confidence: Analytical confidence score between 0.0 and 1.0.
        evidence: Supporting data points, quotes, or metric references.
        status: Implementation status (active, adapted, partial, planned).
        metadata: Execution parameters, timing, and provenance information.
    """
    agent_name: str
    entity_id: str
    as_of_date: str
    summary: str
    findings: Any = Field(default_factory=dict)
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    evidence: list[str] = Field(default_factory=list)
    status: AgentStatus = AgentStatus.ACTIVE
    metadata: dict[str, Any] = Field(default_factory=dict)


class FinOSDomainAgent(ABC):
    """Abstract base class for FinOS domain-level agents."""

    @property
    @abstractmethod
    def name(self) -> str:
        """Domain agent name."""
        pass

    @property
    def status(self) -> AgentStatus:
        """Domain agent implementation status."""
        return AgentStatus.ACTIVE

    @abstractmethod
    def analyze(self, agent_input: FinOSAgentInput) -> FinOSAgentOutput:
        """Synchronously execute domain analysis.

        Args:
            agent_input: Standardized input containing entity, date, and context.

        Returns:
            Standardized output containing structured domain findings.
        """
        pass

    async def aanalyze(self, agent_input: FinOSAgentInput) -> FinOSAgentOutput:
        """Asynchronously execute domain analysis (default delegates to analyze)."""
        return self.analyze(agent_input)
