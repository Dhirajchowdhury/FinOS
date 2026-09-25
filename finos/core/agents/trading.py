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

        portfolio_assessment = prev_outputs.get("portfolio") or context.get("portfolio_assessment")

        plan = context.get("trader_investment_plan", "")

        if not plan and self.llm:
            state = {
                "company_of_interest": ticker,
                "asset_type": agent_input.entity_type,
                "trade_date": as_of_date,
                "investment_plan": context.get("investment_plan", "Evaluation plan"),
                "market_report": context.get("market_report", ""),
                "portfolio_context": context.get("portfolio_context", ""),
                "messages": [],
            }

            try:
                res = self.trader_node(state)
                plan = res.get("trader_investment_plan", "")
            except Exception as exc:
                plan = f"Trader proposal note for {ticker}: {exc}"

        action = "Hold"
        for candidate in ["Buy", "Hold", "Sell"]:
            if candidate.lower() in plan.lower():
                action = candidate
                break

        entry_price = None
        stop_loss = None
        target_price = None

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

        position_sizing = "Controlled Allocation (Max 5% Portfolio Risk)"
        risk_notes = "Subject to Portfolio & Risk Agent approval"

        if hasattr(portfolio_assessment, "max_position_size_pct"):
            position_sizing = f"Capped at {portfolio_assessment.max_position_size_pct}% Portfolio Equity"

        assumptions = [
            f"Execution as of {as_of_date}",
            "Order subject to liquidity and spread validation prior to execution",
        ]

        summary_msg = f"Trading proposal for {ticker} on {as_of_date}: Proposed Action - {action}."

        proposal = TradingProposal(
            action=action,
            reasoning=plan[:350] if plan else summary_msg,
            entry_price=entry_price,
            stop_loss=stop_loss,
            target_price=target_price,
            position_sizing=position_sizing,
            risk_limit_notes=risk_notes,
            assumptions=assumptions,
            confidence=0.82 if (entry_price or plan) else 0.70,
        )

        return FinOSAgentOutput(
            agent_name=self.name,
            entity_id=ticker,
            as_of_date=as_of_date,
            summary=summary_msg,
            findings=proposal,
            confidence=proposal.confidence,
            evidence=[plan[:200]] if plan else [summary_msg],
            status=self.status,
            metadata={
                "source": "tradingagents_trader",
                "action": action,
                "entry_price": entry_price,
                "stop_loss": stop_loss,
            },
        )
