"""Tests for FinOS Credit Agent."""

from finos.core.agents import CreditAgent, CreditAssessment, FinOSAgentInput


def test_credit_agent_strong_balance_sheet():
    agent = CreditAgent()
    assert agent.name == "Credit Agent"

    inp = FinOSAgentInput(
        entity_id="AAPL",
        as_of_date="2025-01-15",
        context={
            "total_debt": 50000000.0,
            "ebitda": 30000000.0,  # Leverage 1.67x (< 2.0x)
            "interest_expense": 1000000.0,  # Coverage 30x (> 2.0x)
        },
    )

    out = agent.analyze(inp)

    assert out.agent_name == "Credit Agent"
    assert out.entity_id == "AAPL"
    assert isinstance(out.findings, CreditAssessment)
    assert out.findings.credit_rating == "AA"
    assert out.findings.leverage_ratio_debt_ebitda == 1.67
    assert out.findings.balance_sheet_strength == "Strong"
    assert out.findings.default_probability_1y < 0.01
    assert out.confidence >= 0.85


def test_credit_agent_high_leverage_distressed_case():
    agent = CreditAgent()

    inp = FinOSAgentInput(
        entity_id="DISTRESSED_CO",
        as_of_date="2025-01-15",
        context={
            "total_debt": 600000000.0,
            "ebitda": 100000000.0,  # Leverage 6.0x (> 5.0x)
            "interest_expense": 60000000.0,  # Coverage 1.67x (< 2.0x)
        },
    )

    out = agent.analyze(inp)

    assert isinstance(out.findings, CreditAssessment)
    assert out.findings.credit_rating in ["CCC", "BB"]
    assert out.findings.balance_sheet_strength == "Distressed"
    assert out.findings.default_probability_1y > 0.05
    assert any("covenant" in c.lower() for c in out.findings.covenant_analysis)


def test_credit_agent_empty_entity_id():
    agent = CreditAgent()
    inp = FinOSAgentInput(entity_id="", as_of_date="2025-01-15")
    out = agent.analyze(inp)

    assert out.confidence == 0.0
    assert "empty" in out.summary.lower()
