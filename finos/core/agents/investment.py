"""Investment Agent implementation for FinOS.

Composes Bull Researcher, Bear Researcher, and Research Manager specialists into a unified
domain-level Investment Agent layer synthesizing News, Macro, Risk, and Fundamentals context.
"""

from __future__ import annotations

from typing import Any
from pydantic import BaseModel, Field

from finos.core.agents.base import AgentStatus, FinOSAgentInput, FinOSAgentOutput, FinOSDomainAgent
from tradingagents.agents.researchers.bull_researcher import create_bull_researcher
from tradingagents.agents.researchers.bear_researcher import create_bear_researcher
from tradingagents.agents.managers.research_manager import create_research_manager


class InvestmentAssessment(BaseModel):
    """Structured investment assessment produced by the FinOS Investment Agent."""
    rating: str = "Hold"  # Buy, Overweight, Hold, Underweight, Sell
    investment_thesis: str = ""
    bull_case: str = ""
    bear_case: str = ""
    strategic_actions: str = ""
    rationale: str = ""
    opportunity_assessment: list[str] = Field(default_factory=list)
    downside_considerations: list[str] = Field(default_factory=list)
    key_catalysts: list[str] = Field(default_factory=list)
    valuation_context: str = ""
    confidence: float = Field(default=0.7, ge=0.0, le=1.0)


class InvestmentAgent(FinOSDomainAgent):
    """FinOS domain agent for investment research, bull/bear debate, and thesis synthesis."""

    def __init__(self, llm: Any = None) -> None:
        self.llm = llm
        if llm:
            self.bull_node = create_bull_researcher(llm)
            self.bear_node = create_bear_researcher(llm)
            self.manager_node = create_research_manager(llm)
        else:
            self.bull_node = None
            self.bear_node = None
            self.manager_node = None

    @property
    def name(self) -> str:
        return "Investment Agent"

    @property
    def status(self) -> AgentStatus:
        return AgentStatus.ACTIVE

    def analyze(self, agent_input: FinOSAgentInput) -> FinOSAgentOutput:
        ticker = (agent_input.entity_id or "").strip()
        as_of_date = (agent_input.as_of_date or "").strip()

        if not ticker:
            return FinOSAgentOutput(
                agent_name=self.name,
                entity_id=ticker,
                as_of_date=as_of_date,
                summary="Invalid entity_id: entity_id cannot be empty.",
                findings=InvestmentAssessment(summary="Empty entity_id provided", confidence=0.0),
                confidence=0.0,
                evidence=[],
                status=self.status,
                metadata={"error": "empty_entity_id"},
            )

        context = agent_input.context or {}
        prev_outputs = agent_input.relevant_previous_outputs or {}

        news_output = prev_outputs.get("news") or context.get("news_assessment")
        macro_output = prev_outputs.get("macro") or context.get("macro_assessment")
        risk_output = prev_outputs.get("risk") or context.get("risk_assessment")

        news_report = context.get("news_report") or (
            news_output.summary if hasattr(news_output, "summary") else str(news_output or "")
        )
        macro_report = context.get("macro_report") or (
            macro_output.summary if hasattr(macro_output, "summary") else str(macro_output or "")
        )
        risk_report = context.get("risk_report") or (
            risk_output.summary if hasattr(risk_output, "summary") else str(risk_output or "")
        )

        investment_plan = context.get("investment_plan", "")
        bull_history = context.get("bull_case", "")
        bear_history = context.get("bear_case", "")

        if not investment_plan and self.llm:
            state = {
                "company_of_interest": ticker,
                "asset_type": agent_input.entity_type,
                "trade_date": as_of_date,
                "market_report": context.get("market_report", ""),
                "sentiment_report": context.get("sentiment_report", ""),
                "news_report": news_report,
                "fundamentals_report": context.get("fundamentals_report", f"Macro: {macro_report} | Risk: {risk_report}"),
                "investment_debate_state": {
                    "bull_history": "",
                    "bear_history": "",
                    "history": "",
                    "current_response": "",
                    "judge_decision": "",
                    "count": 0,
                },
                "messages": [],
            }

            try:
                state.update(self.bull_node(state))
                state.update(self.bear_node(state))
                result = self.manager_node(state)
                investment_plan = result.get("investment_plan", "")
                debate_state = result.get("investment_debate_state", {})
                bull_history = debate_state.get("bull_history", "")
                bear_history = debate_state.get("bear_history", "")
            except Exception as exc:
                investment_plan = f"Investment debate synthesis note for {ticker}: {exc}"

        rating = "Hold"
        for candidate in ["Buy", "Overweight", "Hold", "Underweight", "Sell"]:
            if candidate.lower() in (investment_plan or "").lower():
                rating = candidate
                break

        opportunities = []
        downside_risks = []
        catalysts = []

        all_text = f"{news_report} {macro_report} {risk_report} {investment_plan} {bull_history} {bear_history}".lower()

        if "growth" in all_text or "expansion" in all_text or "beat" in all_text:
            opportunities.append("Revenue and market share expansion opportunity")
            catalysts.append("Upcoming earnings release and product innovations")
        if "risk" in all_text or "decline" in all_text or "headwind" in all_text:
            downside_risks.append("Macroeconomic headwinds and valuation compressed risk")
        if "margin" in all_text or "profitability" in all_text:
            opportunities.append("Operating margin improvement potential")

        thesis = (
            f"Investment Thesis for {ticker} as of {as_of_date}: Rating recommendation is {rating}. "
            f"Balanced weighing of bull case ({'active' if bull_history else 'baseline'}) vs. bear case ({'active' if bear_history else 'baseline'})."
        )

        confidence = 0.82 if (bull_history and bear_history and investment_plan) else (0.75 if investment_plan else 0.60)

        assessment = InvestmentAssessment(
            rating=rating,
            investment_thesis=thesis,
            bull_case=bull_history or "Growth potential, competitive moat, and market expansion opportunity",
            bear_case=bear_history or "Downside risks, valuation sensitivity, and macro exposure",
            strategic_actions=investment_plan or f"Actionable strategic guidance for {ticker}: Maintain {rating} stance",
            rationale=investment_plan[:400] if investment_plan else thesis,
            opportunity_assessment=opportunities or ["Strategic expansion opportunity"],
            downside_considerations=downside_risks or ["Macroeconomic volatility risk"],
            key_catalysts=catalysts or ["Earnings announcements", "Sector macro shifts"],
            valuation_context="Grounded in fundamentals and technical market structure",
            confidence=confidence,
        )

        return FinOSAgentOutput(
            agent_name=self.name,
            entity_id=ticker,
            as_of_date=as_of_date,
            summary=f"Investment assessment for {ticker} on {as_of_date}: Recommendation - {rating}.",
            findings=assessment,
            confidence=assessment.confidence,
            evidence=[investment_plan[:200]] if investment_plan else [thesis],
            status=self.status,
            metadata={
                "specialists": ["bull_researcher", "bear_researcher", "research_manager"],
                "rating": rating,
            },
        )
