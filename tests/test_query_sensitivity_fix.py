"""Targeted tests for query-sensitivity fix across FinOS agents and prompt builders."""

from unittest.mock import MagicMock
from finos.core.agents import FinOSAgentInput, InvestmentAgent, ReportAgent, RiskAgent, PortfolioAgent, TradingAgent
from tradingagents.agents.context import get_user_query_from_state
from tradingagents.agents.researchers.bull_researcher import create_bull_researcher
from tradingagents.agents.managers.research_manager import create_research_manager
from tradingagents.agents.risk_mgmt.aggressive_debator import create_aggressive_debator
from tradingagents.agents.trader.trader import create_trader


def test_get_user_query_from_state_formatting():
    state = {"user_query": "What are the major risks of RELIANCE.NS?"}
    context_str = get_user_query_from_state(state)
    assert "User Inquiry / Request: \"What are the major risks of RELIANCE.NS?\"" in context_str
    assert "Focus your reasoning" in context_str

    empty_state = {}
    assert get_user_query_from_state(empty_state) == ""


def test_llm_prompt_builders_receive_user_query():
    mock_llm = MagicMock()
    mock_llm.invoke.return_value = MagicMock(content="Bullish outlook based on market growth")

    bull_node = create_bull_researcher(mock_llm)
    state = {
        "company_of_interest": "RELIANCE.NS",
        "asset_type": "stock",
        "trade_date": "2026-09-25",
        "user_query": "How does inflation impact RELIANCE.NS?",
        "market_report": "Stable",
        "sentiment_report": "Positive",
        "news_report": "Strong earnings",
        "fundamentals_report": "Solid debt ratio",
        "investment_debate_state": {"history": "", "bull_history": "", "count": 0},
    }

    bull_node(state)

    # Inspect the prompt passed to mock_llm.invoke
    assert mock_llm.invoke.called
    prompt_used = mock_llm.invoke.call_args[0][0]
    assert "How does inflation impact RELIANCE.NS?" in prompt_used


def test_report_agent_uses_user_request():
    agent = ReportAgent()
    inp = FinOSAgentInput(
        entity_id="RELIANCE.NS",
        as_of_date="2026-09-25",
        request="What are the main growth drivers for RELIANCE.NS?",
        context={"market": "NSE India"},
    )

    out = agent.analyze(inp)

    assert out.agent_name == "Report Agent"
    assert "What are the main growth drivers for RELIANCE.NS?" in out.summary
    markdown_content = out.metadata.get("full_report_markdown", "")
    assert "What are the main growth drivers for RELIANCE.NS?" in markdown_content


def test_investment_agent_passes_user_query_to_state():
    mock_llm = MagicMock()
    mock_llm.invoke.return_value = MagicMock(content="Buy recommendation")

    agent = InvestmentAgent(llm=mock_llm)
    inp = FinOSAgentInput(
        entity_id="TCS.NS",
        as_of_date="2026-09-25",
        request="Is TCS.NS a good long-term dividend stock?",
    )

    out = agent.analyze(inp)

    assert out.agent_name == "Investment Agent"
    assert out.entity_id == "TCS.NS"
    assert mock_llm.invoke.called
    prompt_used = mock_llm.invoke.call_args[0][0]
    assert "Is TCS.NS a good long-term dividend stock?" in prompt_used
