"""Tests for FinOS Investment Agent composite abstraction."""

from finos.core.agents import FinOSAgentInput, InvestmentAgent, InvestmentAssessment


def test_investment_agent_execution_with_context():
    agent = InvestmentAgent()
    assert agent.name == "Investment Agent"

    inp = FinOSAgentInput(
        entity_id="AMZN",
        as_of_date="2025-01-20",
        context={
            "investment_plan": "Recommendation: Buy\nRationale: AWS cloud growth and margin expansion.",
            "bull_case": "AWS revenue accelerated",
            "bear_case": "Retail margin pressure",
        },
    )

    out = agent.analyze(inp)

    assert out.agent_name == "Investment Agent"
    assert out.entity_id == "AMZN"
    assert isinstance(out.findings, InvestmentAssessment)
    assert out.findings.rating == "Buy"
    assert "AWS revenue" in out.findings.bull_case
    assert "Retail margin" in out.findings.bear_case
    assert out.confidence >= 0.75


def test_investment_agent_empty_entity_id():
    agent = InvestmentAgent()
    inp = FinOSAgentInput(entity_id="", as_of_date="2025-01-20")
    out = agent.analyze(inp)

    assert out.confidence == 0.0
    assert "empty" in out.summary.lower()


def test_investment_agent_missing_context_fallback():
    agent = InvestmentAgent()
    inp = FinOSAgentInput(entity_id="MSFT", as_of_date="2025-01-20")

    out = agent.analyze(inp)

    assert out.agent_name == "Investment Agent"
    assert isinstance(out.findings, InvestmentAssessment)
    assert out.findings.rating == "Hold"
