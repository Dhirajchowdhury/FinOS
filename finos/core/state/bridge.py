"""State bridge between tradingagents AgentState and FinOS FinosState."""

from __future__ import annotations

from typing import Any
from finos.core.state.base import FinosState


def finos_state_from_agent_state(agent_state: dict[str, Any]) -> FinosState:
    """Convert a tradingagents AgentState dict into a FinOS FinosState dict."""
    entity_id = agent_state.get("company_of_interest", agent_state.get("entity_id", ""))
    entity_type = agent_state.get("asset_type", agent_state.get("entity_type", "equity"))
    as_of_date = agent_state.get("trade_date", agent_state.get("as_of_date", ""))
    request = agent_state.get("request", f"Analyze {entity_id}")
    sender = agent_state.get("sender", "")
    past_context = agent_state.get("past_context", "")

    artifacts = {
        "market_report": agent_state.get("market_report", ""),
        "sentiment_report": agent_state.get("sentiment_report", ""),
        "news_report": agent_state.get("news_report", ""),
        "fundamentals_report": agent_state.get("fundamentals_report", ""),
        "investment_plan": agent_state.get("investment_plan", ""),
        "trader_investment_plan": agent_state.get("trader_investment_plan", ""),
        "final_trade_decision": agent_state.get("final_trade_decision", ""),
        "investment_debate_state": agent_state.get("investment_debate_state", {}),
        "risk_debate_state": agent_state.get("risk_debate_state", {}),
    }
    if "artifacts" in agent_state and isinstance(agent_state["artifacts"], dict):
        artifacts.update(agent_state["artifacts"])

    metadata = {
        "instrument_context": agent_state.get("instrument_context", ""),
        "portfolio_context": agent_state.get("portfolio_context", ""),
    }
    if "metadata" in agent_state and isinstance(agent_state["metadata"], dict):
        metadata.update(agent_state["metadata"])

    messages = agent_state.get("messages", [])

    return {
        "entity_id": entity_id,
        "entity_type": entity_type,
        "as_of_date": as_of_date,
        "request": request,
        "sender": sender,
        "artifacts": artifacts,
        "metadata": metadata,
        "past_context": past_context,
        "messages": messages,
    }


def agent_state_from_finos_state(finos_state: dict[str, Any]) -> dict[str, Any]:
    """Convert a FinOS FinosState dict into a tradingagents AgentState dict."""
    artifacts = finos_state.get("artifacts", {})
    metadata = finos_state.get("metadata", {})

    return {
        "company_of_interest": finos_state.get("entity_id", ""),
        "asset_type": finos_state.get("entity_type", "stock"),
        "trade_date": finos_state.get("as_of_date", ""),
        "request": finos_state.get("request", ""),
        "sender": finos_state.get("sender", ""),
        "past_context": finos_state.get("past_context", ""),
        "instrument_context": metadata.get("instrument_context", ""),
        "portfolio_context": metadata.get("portfolio_context", ""),
        "market_report": artifacts.get("market_report", ""),
        "sentiment_report": artifacts.get("sentiment_report", ""),
        "news_report": artifacts.get("news_report", ""),
        "fundamentals_report": artifacts.get("fundamentals_report", ""),
        "investment_plan": artifacts.get("investment_plan", ""),
        "trader_investment_plan": artifacts.get("trader_investment_plan", ""),
        "final_trade_decision": artifacts.get("final_trade_decision", ""),
        "investment_debate_state": artifacts.get("investment_debate_state", {}),
        "risk_debate_state": artifacts.get("risk_debate_state", {}),
        "messages": finos_state.get("messages", []),
        "entity_id": finos_state.get("entity_id", ""),
        "entity_type": finos_state.get("entity_type", "equity"),
        "as_of_date": finos_state.get("as_of_date", ""),
        "artifacts": artifacts,
        "metadata": metadata,
    }
