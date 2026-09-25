"""Tests for FinOS Macro Economy Agent."""

from unittest.mock import patch
from finos.core.agents import FinOSAgentInput, MacroAssessment, MacroEconomyAgent


def test_macro_agent_execution():
    agent = MacroEconomyAgent()
    assert agent.name == "Macro Economy Agent"

    inp = FinOSAgentInput(
        entity_id="MACRO_US",
        as_of_date="2025-01-15",
    )

    with patch(
        "finos.core.agents.macro.get_macro_data",
        side_effect=lambda indicator, curr_date, look_back_days=180: f"Mock FRED data for {indicator}: 3.2%",
    ):
        out = agent.analyze(inp)

    assert out.agent_name == "Macro Economy Agent"
    assert out.entity_id == "MACRO_US"
    assert isinstance(out.findings, MacroAssessment)
    assert "Mock FRED data for cpi" in out.findings.inflation
    assert "Mock FRED data for fed_funds_rate" in out.findings.interest_rates
    assert out.confidence >= 0.7


def test_macro_agent_empty_as_of_date():
    agent = MacroEconomyAgent()
    inp = FinOSAgentInput(entity_id="MACRO_US", as_of_date="")
    out = agent.analyze(inp)

    assert out.confidence == 0.0
    assert "empty" in out.summary.lower()


def test_macro_agent_yield_curve_inversion_detection():
    agent = MacroEconomyAgent()
    inp = FinOSAgentInput(
        entity_id="MACRO_US",
        as_of_date="2025-01-15",
        context={
            "yield_curve_data": "10Y-2Y Spread: -0.45% (inverted)",
            "cpi_data": "CPI 3.1%",
        },
    )

    out = agent.analyze(inp)

    assert isinstance(out.findings, MacroAssessment)
    assert "Inverted" in out.findings.yield_curve
    assert any("recession risk" in r.lower() for r in out.findings.macro_risks)
