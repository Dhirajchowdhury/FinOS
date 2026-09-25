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
                "investment_plan": context.get("investment_plan", "Standard plan"),
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

        all_text = f"{aggressive_hist} {conservative_hist} {neutral_hist} {final_decision}".lower()

        if "volatility" in all_text or "atr" in all_text or "swing" in all_text:
            key_risks.append("Heightened short-term price volatility")
            mitigations.append("Enforce strict trailing stop-loss boundary")
            volatility_risk = "High"
        else:
            volatility_risk = "Moderate"

        if "drawdown" in all_text or "downside" in all_text or "bear" in all_text:
            key_risks.append("Potential drawdown under adverse market sentiment")
            mitigations.append("Size initial position to max 2% total equity risk")
            drawdown_risk = "Elevated"
        else:
            drawdown_risk = "Controlled"

        if "portfolio" in all_text or "concentration" in all_text:
            key_risks.append("Sector or asset concentration exposure")
            mitigations.append("Verify overall portfolio balance prior to order submission")
            concentration_risk = "Moderate"
        else:
            concentration_risk = "Low"

        if conservative_hist and not aggressive_hist:
            risk_level = "High"
        elif "high risk" in all_text or "sell" in all_text or "critical" in all_text:
            risk_level = "High"
        elif "low risk" in all_text:
            risk_level = "Low"
        else:
            risk_level = "Medium"

        synthesis_summary = (
            f"Risk Assessment for {ticker} as of {as_of_date}: Overall risk level is {risk_level}. "
            f"Synthesized views across aggressive, conservative, and neutral perspectives."
        )

        assessment = RiskAssessment(
            summary=synthesis_summary,
            risk_level=risk_level,
            key_risks=key_risks or ["General market volatility risk"],
            aggressive_view=aggressive_hist or "Upside exposure & momentum priority",
            conservative_view=conservative_hist or "Capital preservation & stop-loss boundary priority",
            neutral_view=neutral_hist or "Balanced risk-adjusted return baseline",
            consensus_decision=final_decision or f"Risk synthesis for {ticker} completed",
            risk_mitigations=mitigations or ["Standard stop-loss boundary", "Position sizing limit"],
            volatility_risk=volatility_risk,
            drawdown_risk=drawdown_risk,
            liquidity_risk="Low",
            concentration_risk=concentration_risk,
            confidence=0.82 if (aggressive_hist and conservative_hist) else 0.70,
        )

        return FinOSAgentOutput(
            agent_name=self.name,
            entity_id=ticker,
            as_of_date=as_of_date,
            summary=assessment.summary,
            findings=assessment,
            confidence=assessment.confidence,
            evidence=[aggressive_hist[:150], conservative_hist[:150], neutral_hist[:150]] if aggressive_hist else [],
            status=self.status,
            metadata={
                "specialists": ["aggressive_debator", "conservative_debator", "neutral_debator"],
                "risk_level": risk_level,
            },
        )
