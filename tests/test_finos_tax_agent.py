"""Tests for FinOS Tax Agent calculation engine."""

from finos.core.agents import FinOSAgentInput, TaxAgent, TaxAssessment


def test_tax_agent_short_term_capital_gain():
    agent = TaxAgent()
    assert agent.name == "Tax Agent"

    inp = FinOSAgentInput(
        entity_id="NVDA",
        as_of_date="2025-06-01",
        context={
            "jurisdiction": "US",
            "acquisition_date": "2025-01-01",  # 151 days (< 365 days) -> Short-Term
            "acquisition_price": 100.0,
            "disposal_price": 150.0,
            "quantity": 100.0,
        },
    )

    out = agent.analyze(inp)

    assert out.agent_name == "Tax Agent"
    assert out.entity_id == "NVDA"
    assert isinstance(out.findings, TaxAssessment)
    assert out.findings.holding_period_category == "Short-Term Capital Gain"
    assert out.findings.taxable_gain_loss == 5000.0
    assert out.findings.estimated_tax_liability == 1500.0  # 30% of $5,000
    assert out.confidence >= 0.85


def test_tax_agent_long_term_capital_gain():
    agent = TaxAgent()

    inp = FinOSAgentInput(
        entity_id="AAPL",
        as_of_date="2025-06-01",
        context={
            "jurisdiction": "US",
            "acquisition_date": "2023-01-01",  # > 365 days -> Long-Term
            "acquisition_price": 120.0,
            "disposal_price": 180.0,
            "quantity": 10.0,
        },
    )

    out = agent.analyze(inp)

    assert isinstance(out.findings, TaxAssessment)
    assert out.findings.holding_period_category == "Long-Term Capital Gain"
    assert out.findings.taxable_gain_loss == 600.0
    assert out.findings.estimated_tax_liability == 90.0  # 15% of $600


def test_tax_agent_tax_loss_harvesting():
    agent = TaxAgent()

    inp = FinOSAgentInput(
        entity_id="TSLA",
        as_of_date="2025-06-01",
        context={
            "jurisdiction": "US",
            "acquisition_price": 250.0,
            "disposal_price": 180.0,
            "quantity": 10.0,
            "unrealized_positions": [{"symbol": "AMZN", "unrealized_loss": 1200.0}],
        },
    )

    out = agent.analyze(inp)

    assert isinstance(out.findings, TaxAssessment)
    assert out.findings.taxable_gain_loss == -700.0
    assert len(out.findings.tax_harvesting_opportunities) >= 2


def test_tax_agent_empty_entity_id():
    agent = TaxAgent()
    inp = FinOSAgentInput(entity_id="", as_of_date="2025-01-15")
    out = agent.analyze(inp)

    assert out.confidence == 0.0
    assert "empty" in out.summary.lower()
