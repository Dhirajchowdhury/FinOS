"""Tests for Risk, Portfolio, Trading, and Report FinOS agent adapters."""

from pathlib import Path
from finos.core.agents import (
    AgentStatus,
    FinOSAgentInput,
    PortfolioAgent,
    PortfolioAssessment,
    ReportAgent,
    ReportAssessment,
    RiskAgent,
    RiskAssessment,
    TradingAgent,
    TradingProposal,
)


def test_risk_agent_adapter():
    agent = RiskAgent()
    assert agent.name == "Risk Agent"
    assert agent.status == AgentStatus.ADAPTED

    inp = FinOSAgentInput(
        entity_id="NVDA",
        as_of_date="2025-01-15",
        context={"final_trade_decision": "Consensus rating: Buy. Volatility controlled."},
    )
    out = agent.analyze(inp)
    assert out.agent_name == "Risk Agent"
    assert isinstance(out.findings, RiskAssessment)
    assert out.status == AgentStatus.ADAPTED


def test_portfolio_agent_adapter():
    agent = PortfolioAgent()
    assert agent.name == "Portfolio Agent"
    assert agent.status == AgentStatus.ADAPTED

    inp = FinOSAgentInput(
        entity_id="AAPL",
        as_of_date="2025-01-15",
        context={"final_trade_decision": "Rating: Overweight"},
    )
    out = agent.analyze(inp)
    assert out.agent_name == "Portfolio Agent"
    assert isinstance(out.findings, PortfolioAssessment)
    assert out.findings.recommended_rating == "Overweight"


def test_trading_agent_adapter():
    agent = TradingAgent()
    assert agent.name == "Trading Agent"
    assert agent.status == AgentStatus.ADAPTED

    inp = FinOSAgentInput(
        entity_id="MSFT",
        as_of_date="2025-01-15",
        context={"trader_investment_plan": "Action: Buy at 420.0, Stop loss 405.0"},
    )
    out = agent.analyze(inp)
    assert out.agent_name == "Trading Agent"
    assert isinstance(out.findings, TradingProposal)
    assert out.findings.action == "Buy"


def test_report_agent_adapter(tmp_path: Path):
    agent = ReportAgent()
    assert agent.name == "Report Agent"
    assert agent.status == AgentStatus.ADAPTED

    inp = FinOSAgentInput(
        entity_id="GOOGL",
        as_of_date="2025-01-15",
        context={
            "save_path": str(tmp_path),
            "market_report": "Google market report",
            "news_report": "Google news report",
        },
    )
    out = agent.analyze(inp)
    assert out.agent_name == "Report Agent"
    assert isinstance(out.findings, ReportAssessment)
    assert out.findings.report_path is not None
    assert Path(out.findings.report_path).exists()
