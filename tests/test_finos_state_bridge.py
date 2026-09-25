"""Tests for state bridge between tradingagents AgentState and FinOS FinosState."""

from finos.core.state.bridge import (
    agent_state_from_finos_state,
    finos_state_from_agent_state,
)


def test_finos_state_from_agent_state_conversion():
    agent_state = {
        "company_of_interest": "NVDA",
        "asset_type": "stock",
        "trade_date": "2025-01-10",
        "sender": "NewsAnalyst",
        "news_report": "Strong earnings news",
        "investment_plan": "Buy NVDA",
        "past_context": "Previous successful trade on NVDA",
        "portfolio_context": "Holdings: 100 shares",
    }

    finos_state = finos_state_from_agent_state(agent_state)

    assert finos_state["entity_id"] == "NVDA"
    assert finos_state["entity_type"] == "stock"
    assert finos_state["as_of_date"] == "2025-01-10"
    assert finos_state["sender"] == "NewsAnalyst"
    assert finos_state["past_context"] == "Previous successful trade on NVDA"
    assert finos_state["artifacts"]["news_report"] == "Strong earnings news"
    assert finos_state["artifacts"]["investment_plan"] == "Buy NVDA"
    assert finos_state["metadata"]["portfolio_context"] == "Holdings: 100 shares"


def test_agent_state_from_finos_state_conversion():
    finos_state = {
        "entity_id": "AAPL",
        "entity_type": "equity",
        "as_of_date": "2025-01-12",
        "sender": "ResearchManager",
        "request": "Analyze AAPL growth",
        "artifacts": {
            "market_report": "Bullish technicals",
            "investment_plan": "Overweight AAPL",
        },
        "metadata": {
            "instrument_context": "AAPL: Apple Inc.",
            "portfolio_context": "Cash: $100,000",
        },
        "past_context": "Lesson learned on tech valuation",
    }

    agent_state = agent_state_from_finos_state(finos_state)

    assert agent_state["company_of_interest"] == "AAPL"
    assert agent_state["asset_type"] == "equity"
    assert agent_state["trade_date"] == "2025-01-12"
    assert agent_state["market_report"] == "Bullish technicals"
    assert agent_state["investment_plan"] == "Overweight AAPL"
    assert agent_state["instrument_context"] == "AAPL: Apple Inc."
    assert agent_state["portfolio_context"] == "Cash: $100,000"
    assert agent_state["past_context"] == "Lesson learned on tech valuation"
