"""Portfolio Agent implementation for FinOS.

Adapts and extends existing Portfolio Manager and portfolio modules to perform actual
portfolio-level reasoning, holdings analysis, allocation risk, and position impact scoring.
"""

from __future__ import annotations

from typing import Any
from pydantic import BaseModel, Field

from finos.core.agents.base import AgentStatus, FinOSAgentInput, FinOSAgentOutput, FinOSDomainAgent
from tradingagents.agents.managers.portfolio_manager import create_portfolio_manager


class PortfolioAssessment(BaseModel):
    """Structured assessment produced by the FinOS Portfolio Agent."""
    summary: str = ""
    target_allocation: str = "Standard Risk-Weighted Allocation"
    recommended_rating: str = "Hold"  # Buy, Overweight, Hold, Underweight, Sell
    position_adjustments: list[str] = Field(default_factory=list)
    risk_exposure: str = "Balanced"
    cash_context: str = ""
    existing_holdings_impact: str = ""
    concentration_warning: bool = False
    max_position_size_pct: float = Field(default=5.0, ge=0.0, le=100.0)
    confidence: float = Field(default=0.8, ge=0.0, le=1.0)


class PortfolioAgent(FinOSDomainAgent):
    """FinOS domain agent for portfolio decision making, allocation, and risk management."""

    def __init__(self, llm: Any = None) -> None:
        self.llm = llm
        if llm:
            self.pm_node = create_portfolio_manager(llm)
        else:
            self.pm_node = None

    @property
    def name(self) -> str:
        return "Portfolio Agent"

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
                findings=PortfolioAssessment(summary="Empty entity_id provided", confidence=0.0),
                confidence=0.0,
                evidence=[],
                status=self.status,
                metadata={"error": "empty_entity_id"},
            )

        context = agent_input.context or {}
        prev_outputs = agent_input.relevant_previous_outputs or {}

        portfolio_ctx_str = context.get("portfolio_context", "")
        holdings = context.get("holdings") or []
        cash_balance = context.get("cash_balance")

        has_user_portfolio = bool(holdings or portfolio_ctx_str)
        analysis_scope = "USER_PORTFOLIO_ANALYSIS" if has_user_portfolio else "SECURITY_LEVEL_ANALYSIS"

        decision = context.get("final_trade_decision", "")

        if not decision and self.llm:
            state = {
                "company_of_interest": ticker,
                "asset_type": agent_input.entity_type,
                "trade_date": as_of_date,
                "user_query": agent_input.request,
                "investment_plan": context.get("investment_plan", "Standard investment plan"),
                "trader_investment_plan": context.get("trader_investment_plan", "Standard trade proposal"),
                "past_context": context.get("past_context", ""),
                "portfolio_context": portfolio_ctx_str,
                "risk_debate_state": context.get(
                    "risk_debate_state",
                    {
                        "history": "Risk debate synthesized",
                        "aggressive_history": "",
                        "conservative_history": "",
                        "neutral_history": "",
                        "current_aggressive_response": "",
                        "current_conservative_response": "",
                        "current_neutral_response": "",
                        "count": 1,
                    },
                ),
            }

            try:
                res = self.pm_node(state)
                decision = res.get("final_trade_decision", "")
            except Exception as exc:
                decision = f"Portfolio Manager synthesis note for {ticker}: {exc}"

        rating = "Hold"
        for candidate in ["Buy", "Overweight", "Hold", "Underweight", "Sell"]:
            if candidate.lower() in decision.lower():
                rating = candidate
                break

        concentration_warning = False
        if holdings and isinstance(holdings, list):
            matching = [h for h in holdings if isinstance(h, dict) and h.get("symbol") == ticker]
            if matching:
                weight = matching[0].get("weight_pct", 0)
                if weight > 10.0:
                    concentration_warning = True

        cash_context_str = f"Cash Available: ${cash_balance:,.2f}" if isinstance(cash_balance, (int, float)) else (portfolio_ctx_str[:150] if portfolio_ctx_str else "Unspecified Cash Balance (Security-Level Analysis)")

        max_pos_size = 5.0
        if rating in ["Buy", "Overweight"]:
            max_pos_size = 7.5 if not concentration_warning else 4.0
        elif rating in ["Underweight", "Sell"]:
            max_pos_size = 0.0

        if has_user_portfolio:
            summary_str = (
                f"Portfolio assessment for {ticker} as of {as_of_date} ({analysis_scope}): Rating recommendation is {rating}. "
                f"Max position allocation capped at {max_pos_size}% equity based on current holdings."
            )
        else:
            summary_str = (
                f"Portfolio assessment for {ticker} as of {as_of_date} ({analysis_scope}): Rating recommendation is {rating}. "
                f"Max position allocation capped at {max_pos_size}% equity (No user portfolio holdings supplied)."
            )

        assessment = PortfolioAssessment(
            summary=summary_str,
            target_allocation=f"Cap at {max_pos_size}% total portfolio equity",
            recommended_rating=rating,
            position_adjustments=[f"Adjust exposure to match rating {rating}"] if rating != "Hold" else ["Maintain existing position"],
            risk_exposure="High Exposure Warning" if concentration_warning else "Controlled Risk Exposure",
            cash_context=cash_context_str,
            existing_holdings_impact=f"Existing position tracked for {ticker}" if concentration_warning else ("No overweight concentration detected" if has_user_portfolio else "User portfolio unsupplied; security-level position sizing guideline applied"),
            concentration_warning=concentration_warning,
            max_position_size_pct=max_pos_size,
            confidence=0.88 if has_user_portfolio else 0.70,
        )

        return FinOSAgentOutput(
            agent_name=self.name,
            entity_id=ticker,
            as_of_date=as_of_date,
            summary=assessment.summary,
            findings=assessment,
            confidence=assessment.confidence,
            evidence=[decision[:200]] if decision else [summary_str],
            status=self.status,
            metadata={
                "source": "tradingagents_portfolio_manager",
                "analysis_scope": analysis_scope,
                "has_user_portfolio": has_user_portfolio,
                "recommended_rating": rating,
                "concentration_warning": concentration_warning,
            },
        )

