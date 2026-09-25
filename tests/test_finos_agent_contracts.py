"""Tests for FinOS domain agent contracts and base abstractions."""

import pytest
from finos.core.agents import (
    AgentStatus,
    FinOSAgentInput,
    FinOSAgentOutput,
    FinOSDomainAgent,
)


def test_agent_input_initialization():
    agent_input = FinOSAgentInput(
        entity_id="AAPL",
        entity_type="equity",
        as_of_date="2025-01-15",
        request="Perform news and macro evaluation",
    )
    assert agent_input.entity_id == "AAPL"
    assert agent_input.entity_type == "equity"
    assert agent_input.as_of_date == "2025-01-15"
    assert agent_input.request == "Perform news and macro evaluation"
    assert agent_input.context == {}
    assert agent_input.relevant_previous_outputs == {}


def test_agent_output_initialization():
    output = FinOSAgentOutput(
        agent_name="Test Agent",
        entity_id="NVDA",
        as_of_date="2025-01-15",
        summary="Positive outlook",
        findings={"score": 0.85},
        confidence=0.9,
        evidence=["Favorable earnings news"],
        status=AgentStatus.ACTIVE,
    )
    assert output.agent_name == "Test Agent"
    assert output.entity_id == "NVDA"
    assert output.confidence == 0.9
    assert output.status == AgentStatus.ACTIVE
    assert output.findings == {"score": 0.85}


class SampleDomainAgent(FinOSDomainAgent):
    @property
    def name(self) -> str:
        return "Sample Agent"

    def analyze(self, agent_input: FinOSAgentInput) -> FinOSAgentOutput:
        return FinOSAgentOutput(
            agent_name=self.name,
            entity_id=agent_input.entity_id,
            as_of_date=agent_input.as_of_date,
            summary=f"Sample analysis for {agent_input.entity_id}",
            confidence=0.8,
        )


def test_domain_agent_implementation():
    agent = SampleDomainAgent()
    assert agent.name == "Sample Agent"
    assert agent.status == AgentStatus.ACTIVE

    inp = FinOSAgentInput(entity_id="MSFT", as_of_date="2025-02-01")
    out = agent.analyze(inp)
    assert out.agent_name == "Sample Agent"
    assert out.entity_id == "MSFT"
    assert out.summary == "Sample analysis for MSFT"
