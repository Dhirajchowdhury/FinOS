"""Trading Agent implementation for FinOS.

Adapts and extends the existing Trader specialist to produce structured transaction proposals
and execution plans with strict risk limits and price structure grounding.
"""

from __future__ import annotations

import re
from typing import Any
from pydantic import BaseModel, Field

from finos.core.agents.base import AgentStatus, FinOSAgentInput, FinOSAgentOutput, FinOSDomainAgent
from tradingagents.agents.trader.trader import create_trader


class TradingProposal(BaseModel):
    """Structured transaction proposal produced by the FinOS Trading Agent."""
    action: str = "Hold"  # Buy, Hold, Sell
    reasoning: str = ""
    entry_price: float | None = None
    stop_loss: float | None = None
    target_price: float | None = None
    position_sizing: str = "Standard Risk-Managed Sizing"
    risk_limit_notes: str = ""
    assumptions: list[str] = Field(default_factory=list)
    confidence: float = Field(default=0.8, ge=0.0, le=1.0)


class TradingAgent(FinOSDomainAgent):
    """FinOS domain agent for trade proposal generation and execution planning."""

    def __init__(self, llm: Any = None) -> None:
        self.llm = llm
        if llm:
            self.trader_node = create_trader(llm)
        else:
            self.trader_node = None

    @property
    def name(self) -> str:
        return "Trading Agent"

    @property
    def status(self) -> AgentStatus:
        return AgentStatus.ADAPTED

    def analyze(self, agent_input: FinOSAgentInput) -> FinOSAgentOutput:
        ticker = (agent_input.entity_id or "").strip()
        as_of_date = (agent_input.as_of_date or "").strip()

        if not ticker:
            return FinOSAgentOutput(
                agent_name=self.name,
                entity_id=ticker,
                as_of_date=as_of_date,
                summary="Invalid entity_id: entity_id cannot be empty.",
                findings=TradingProposal(summary="Empty entity_id provided", confidence=0.0),
                confidence=0.0,
                evidence=[],
                status=self.status,
                metadata={"error": "empty_entity_id"},
            )

        context = agent_input.context or {}
        prev_outputs = agent_input.relevant_previous_outputs or {}

        invest_output = prev_outputs.get("investment") or context.get("investment_assessment")
        risk_output = prev_outputs.get("risk") or context.get("risk_assessment")
        portfolio_output = prev_outputs.get("portfolio") or context.get("portfolio_assessment")

        invest_rec = getattr(invest_output, "findings", {})
        if hasattr(invest_rec, "rating"):
            invest_rating = invest_rec.rating
        elif isinstance(invest_rec, dict):
            invest_rating = invest_rec.get("rating", "Hold")
        else:
            invest_rating = "Hold"

        invest_summary = getattr(invest_output, "summary", "") or str(invest_output or "")
        risk_summary = getattr(risk_output, "summary", "") or str(risk_output or "")

        plan = context.get("trader_investment_plan", "")

        if not plan and self.llm:
            state = {
                "company_of_interest": ticker,
                "asset_type": agent_input.entity_type,
                "trade_date": as_of_date,
                "user_query": agent_input.request,
                "investment_plan": invest_summary or "Evaluation plan",
                "market_report": context.get("market_report", ""),
                "portfolio_context": context.get("portfolio_context", ""),
                "messages": [],
            }

            try:
                res = self.trader_node(state)
                plan = res.get("trader_investment_plan", "")
            except Exception as exc:
                plan = f"Trader proposal note for {ticker}: {exc}"

        if invest_rating in ["Buy", "Overweight"]:
            action = "Buy"
        elif invest_rating in ["Underweight", "Sell"]:
            action = "Sell"
        else:
            action = "Hold"

        entry_price = None
        stop_loss = None

        entry_match = re.search(r"entry(?:\s+price)?[:\s]+\$?(\d+(?:\.\d+)?)", plan, re.IGNORECASE)
        if entry_match:
            try:
                entry_price = float(entry_match.group(1))
            except ValueError:
                pass

        stop_match = re.search(r"stop(?:\s+-?\s*loss)?[:\s]+\$?(\d+(?:\.\d+)?)", plan, re.IGNORECASE)
        if stop_match:
            try:
                stop_loss = float(stop_match.group(1))
            except ValueError:
                pass

        max_cap = getattr(getattr(portfolio_output, "findings", None), "max_position_size_pct", 5.0)
        position_sizing = f"Capped at {max_cap}% Portfolio Equity (Security-Level Constraint)"
        risk_notes = f"Grounded in Risk Assessment ({risk_summary[:100]})"

        entry_conditions = f"Limit order execution upon market open following {as_of_date}" if action != "Hold" else "No trade trigger (Hold stance)"
        stop_loss_logic = f"Trailing stop-loss set at 4% below execution price" if action == "Buy" else "N/A (Hold / Underweight stance)"
        invalidation_conditions = f"Proposal invalidated if macro regime deteriorates or price breaches stop-loss boundary"

        assumptions = [
            f"Trade Proposal dated as of {as_of_date}",
            "Proposal only; NO LIVE BROKER ORDER ROUTING PERFORMED",
            f"Upstream Analyst Alignment: Investment Rating = {invest_rating}",
        ]

        summary_msg = f"Trade Proposal for {ticker} on {as_of_date}: Action - {action}. (Unexecuted Trade Proposal)."

        proposal = TradingProposal(
            action=action,
            reasoning=f"Trade Proposal based on Investment Rating '{invest_rating}' & Risk Profile: {plan[:250] if plan else invest_summary[:200]}",
            entry_price=entry_price,
            stop_loss=stop_loss,
            position_sizing=position_sizing,
            risk_limit_notes=risk_notes,
            assumptions=assumptions,
            confidence=0.85 if invest_summary else 0.70,
        )

        return FinOSAgentOutput(
            agent_name=self.name,
            entity_id=ticker,
            as_of_date=as_of_date,
            summary=summary_msg,
            findings=proposal,
            confidence=proposal.confidence,
            evidence=[entry_conditions, stop_loss_logic, invalidation_conditions],
            status=self.status,
            metadata={
                "source": "tradingagents_trader",
                "proposal_type": "TRADE_PROPOSAL_ONLY",
                "execution_status": "UNEXECUTED_PROPOSAL",
                "action": action,
                "entry_conditions": entry_conditions,
                "stop_loss_logic": stop_loss_logic,
                "invalidation_conditions": invalidation_conditions,
            },
        )

