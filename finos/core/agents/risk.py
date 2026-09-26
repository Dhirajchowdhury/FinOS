"""Risk Agent implementation for FinOS.

Adapts and synthesizes existing Aggressive, Conservative, and Neutral Risk Debator specialists
into a unified, domain-level Risk Assessment layer for FinOS.
"""

from __future__ import annotations

from typing import Any
from pydantic import BaseModel, Field

from finos.core.agents.base import AgentStatus, FinOSAgentInput, FinOSAgentOutput, FinOSDomainAgent
from tradingagents.agents.risk_mgmt.aggressive_debator import create_aggressive_debator
from tradingagents.agents.risk_mgmt.conservative_debator import create_conservative_debator
from tradingagents.agents.risk_mgmt.neutral_debator import create_neutral_debator


class RiskAssessment(BaseModel):
    """Structured risk assessment produced by the FinOS Risk Agent."""
    summary: str = ""
    risk_level: str = "Medium"  # Low, Medium, High, Critical
    key_risks: list[str] = Field(default_factory=list)
    aggressive_view: str = ""
    conservative_view: str = ""
    neutral_view: str = ""
    consensus_decision: str = ""
    risk_mitigations: list[str] = Field(default_factory=list)
    volatility_risk: str = "Moderate"
    drawdown_risk: str = "Controlled"
    liquidity_risk: str = "Low"
    concentration_risk: str = "Low"
    confidence: float = Field(default=0.75, ge=0.0, le=1.0)


class RiskAgent(FinOSDomainAgent):
    """FinOS domain agent for financial risk assessment and debate synthesis."""

    def __init__(self, llm: Any = None) -> None:
        self.llm = llm
        if llm:
            self.aggressive_node = create_aggressive_debator(llm)
            self.conservative_node = create_conservative_debator(llm)
            self.neutral_node = create_neutral_debator(llm)
        else:
            self.aggressive_node = None
            self.conservative_node = None
            self.neutral_node = None

    @property
    def name(self) -> str:
        return "Risk Agent"

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
                findings=RiskAssessment(summary="Empty entity_id provided", confidence=0.0),
                confidence=0.0,
                evidence=[],
                status=self.status,
                metadata={"error": "empty_entity_id"},
            )

        context = agent_input.context or {}
        prev_outputs = agent_input.relevant_previous_outputs or {}

        invest_output = prev_outputs.get("investment") or context.get("investment_assessment")
        credit_output = prev_outputs.get("credit") or context.get("credit_assessment")
        macro_output = prev_outputs.get("macro") or context.get("macro_assessment")

        invest_thesis = context.get("investment_plan") or (
            invest_output.summary if hasattr(invest_output, "summary") else str(invest_output or "")
        )
        credit_summary = context.get("credit_report") or (
            credit_output.summary if hasattr(credit_output, "summary") else str(credit_output or "")
        )
        macro_summary = context.get("macro_report") or (
            macro_output.summary if hasattr(macro_output, "summary") else str(macro_output or "")
        )

        risk_debate_state = context.get("risk_debate_state") or {}
        final_decision = context.get("final_trade_decision", "")

        aggressive_hist = context.get("aggressive_view") or risk_debate_state.get("aggressive_history", "")
        conservative_hist = context.get("conservative_view") or risk_debate_state.get("conservative_history", "")
        neutral_hist = context.get("neutral_view") or risk_debate_state.get("neutral_history", "")

        if not (aggressive_hist or conservative_hist or neutral_hist) and self.llm:
            state = {
                "company_of_interest": ticker,
                "asset_type": agent_input.entity_type,
                "trade_date": as_of_date,
                "user_query": agent_input.request,
                "investment_plan": invest_thesis or "Standard plan",
                "trader_investment_plan": context.get("trader_investment_plan", "Standard trader proposal"),
                "past_context": context.get("past_context", ""),
                "portfolio_context": context.get("portfolio_context", ""),
                "risk_debate_state": {
                    "aggressive_history": "",
                    "conservative_history": "",
                    "neutral_history": "",
                    "history": "",
                    "latest_speaker": "",
                    "current_aggressive_response": "",
                    "current_conservative_response": "",
                    "current_neutral_response": "",
                    "judge_decision": "",
                    "count": 0,
                },
                "messages": [],
            }

            try:
                state.update(self.aggressive_node(state))
                state.update(self.conservative_node(state))
                state.update(self.neutral_node(state))
                rd_state = state.get("risk_debate_state", {})
                aggressive_hist = rd_state.get("aggressive_history", "")
                conservative_hist = rd_state.get("conservative_history", "")
                neutral_hist = rd_state.get("neutral_history", "")
                final_decision = rd_state.get("history", "")
            except Exception as exc:
                final_decision = f"Risk debate synthesis note for {ticker}: {exc}"

        key_risks = []
        mitigations = []

        all_text = f"{invest_thesis} {credit_summary} {macro_summary} {aggressive_hist} {conservative_hist} {neutral_hist} {final_decision}".lower()

        if "recession" in all_text or "inversion" in all_text or "late cycle" in all_text:
            key_risks.append("Macroeconomic late-cycle / contraction headwind")
            mitigations.append("Reduce tactical position exposure during macro regime shift")

        if "bbb" in all_text or "leverage" in all_text or "debt" in all_text:
            key_risks.append("Debt covenant & interest rate sensitivity risk")
            mitigations.append("Monitor interest coverage ratio (> 2.0x required)")

        if "underweight" in all_text or "sell" in all_text or "bear" in all_text:
            key_risks.append("Negative analyst consensus / downside momentum risk")
            mitigations.append("Set tight stop-loss at 4% below entry price")

        if not key_risks:
            key_risks.append("General equity market volatility & liquidity risk")
            mitigations.append("Enforce 5% position cap limit")

        if "high risk" in all_text or "critical" in all_text or "distressed" in all_text:
            risk_level = "High"
        elif "low risk" in all_text or "aa rating" in all_text:
            risk_level = "Low"
        else:
            risk_level = "Medium"

        synthesis_summary = (
            f"Risk Assessment for {ticker} as of {as_of_date}: Overall risk level is {risk_level}. "
            f"Synthesized upstream Investment Thesis ({invest_thesis[:100]}), Credit Rating ({credit_summary[:100]}), and Macro Regime ({macro_summary[:100]})."
        )

        assessment = RiskAssessment(
            summary=synthesis_summary,
            risk_level=risk_level,
            key_risks=key_risks,
            aggressive_view=aggressive_hist or f"Growth upside exposure for {ticker}",
            conservative_view=conservative_hist or f"Capital preservation & downside stop-loss boundary for {ticker}",
            neutral_view=neutral_hist or f"Balanced risk-adjusted valuation baseline for {ticker}",
            consensus_decision=final_decision or f"Risk synthesis for {ticker} completed",
            risk_mitigations=mitigations,
            volatility_risk="High" if "volatility" in all_text else "Moderate",
            drawdown_risk="Elevated" if "recession" in all_text or "bear" in all_text else "Controlled",
            liquidity_risk="Low",
            concentration_risk="Moderate" if "portfolio" in all_text else "Low",
            confidence=0.88 if (invest_thesis and credit_summary) else 0.72,
        )

        return FinOSAgentOutput(
            agent_name=self.name,
            entity_id=ticker,
            as_of_date=as_of_date,
            summary=assessment.summary,
            findings=assessment,
            confidence=assessment.confidence,
            evidence=key_risks[:3] + mitigations[:3],
            status=self.status,
            metadata={
                "specialists": ["aggressive_debator", "conservative_debator", "neutral_debator"],
                "risk_level": risk_level,
            },
        )

