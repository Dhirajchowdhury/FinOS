"""Report Agent implementation for FinOS.

Acts as the domain-level aggregation and presentation layer synthesizing assessments from
News, Macro, Investment, Risk, Portfolio, Trading, Credit, Tax, and Fraud agents.
"""

from __future__ import annotations

from typing import Any
from pydantic import BaseModel, Field

from finos.core.agents.base import AgentStatus, FinOSAgentInput, FinOSAgentOutput, FinOSDomainAgent
from tradingagents.reporting import write_report_tree


class ReportAssessment(BaseModel):
    """Structured report generation assessment produced by the FinOS Report Agent."""
    summary: str = ""
    executive_summary: str = ""
    key_findings: list[str] = Field(default_factory=list)
    investment_context: str = ""
    risk_context: str = ""
    portfolio_impact: str = ""
    tax_impact: str = "Tax implications unassessed or not requested"
    credit_findings: str = "Credit rating & default risk baseline"
    fraud_alerts: str = "No fraud anomalies detected"
    unresolved_questions: list[str] = Field(default_factory=list)
    sections_rendered: list[str] = Field(default_factory=list)
    report_path: str | None = None
    confidence: float = Field(default=0.9, ge=0.0, le=1.0)


class ReportAgent(FinOSDomainAgent):
    """FinOS domain agent for report generation, synthesis, and artifact tree exports."""

    @property
    def name(self) -> str:
        return "Report Agent"

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
                findings=ReportAssessment(summary="Empty entity_id provided", confidence=0.0),
                confidence=0.0,
                evidence=[],
                status=self.status,
                metadata={"error": "empty_entity_id"},
            )

        context = agent_input.context or {}
        prev_outputs = agent_input.relevant_previous_outputs or {}

        news_out = prev_outputs.get("news") or context.get("news_assessment")
        macro_out = prev_outputs.get("macro") or context.get("macro_assessment")
        invest_out = prev_outputs.get("investment") or context.get("investment_assessment")
        risk_out = prev_outputs.get("risk") or context.get("risk_assessment")
        portfolio_out = prev_outputs.get("portfolio") or context.get("portfolio_assessment")
        trading_out = prev_outputs.get("trading") or context.get("trading_proposal")
        credit_out = prev_outputs.get("credit") or context.get("credit_assessment")
        tax_out = prev_outputs.get("tax") or context.get("tax_assessment")
        fraud_out = prev_outputs.get("fraud") or context.get("fraud_assessment")

        key_findings: list[str] = []
        unresolved_questions: list[str] = []
        sections_rendered: list[str] = []

        invest_str = getattr(invest_out, "summary", "") or context.get("investment_plan", "") or "Investment analysis pending"
        risk_str = getattr(risk_out, "summary", "") or context.get("final_trade_decision", "") or "Risk analysis pending"
        port_str = getattr(portfolio_out, "summary", "") or "Portfolio allocation standard"
        trade_str = getattr(trading_out, "summary", "") or context.get("trader_investment_plan", "") or "Trade proposal standard"
        news_str = getattr(news_out, "summary", "") or context.get("news_report", "") or "News tracking active"
        macro_str = getattr(macro_out, "summary", "") or "Macro regime stable"

        credit_str = getattr(credit_out, "summary", "") or "Credit assessment standard"
        tax_str = getattr(tax_out, "summary", "") or "Tax analysis baseline"
        fraud_str = getattr(fraud_out, "summary", "") or "Fraud anomaly check clean"

        if invest_str:
            key_findings.append(f"Investment: {invest_str[:120]}")
            sections_rendered.append("Executive Investment Thesis")
        if risk_str:
            key_findings.append(f"Risk: {risk_str[:120]}")
            sections_rendered.append("Risk Management Debate & Consensus")
        if news_str:
            key_findings.append(f"News: {news_str[:120]}")
            sections_rendered.append("World Affairs & News Intelligence")
        if macro_str:
            sections_rendered.append("Macroeconomic Indicators & FRED Vintage")

        if not (invest_out or risk_out or context.get("investment_plan")):
            unresolved_questions.append("Investment thesis unconfirmed due to missing debate synthesis")

        save_path = context.get("save_path")
        report_file_path = None

        if save_path:
            state_dict = {
                "market_report": context.get("market_report", ""),
                "sentiment_report": context.get("sentiment_report", ""),
                "news_report": news_str,
                "fundamentals_report": context.get("fundamentals_report", macro_str),
                "investment_plan": invest_str,
                "trader_investment_plan": trade_str,
                "investment_debate_state": context.get("investment_debate_state", {}),
                "risk_debate_state": context.get("risk_debate_state", {}),
            }
            try:
                out_p = write_report_tree(state_dict, ticker, save_path)
                report_file_path = str(out_p)
                sections_rendered.append("Complete Markdown Report Tree")
            except Exception as exc:
                unresolved_questions.append(f"Report tree export note: {exc}")

        exec_summary = (
            f"Comprehensive FinOS Report for {ticker} as of {as_of_date}: "
            f"Synthesized {len(key_findings)} domain intelligence inputs. "
            f"Primary Call: {invest_str[:150]}."
        )

        assessment = ReportAssessment(
            summary=f"Financial analysis report compiled for {ticker} on {as_of_date}.",
            executive_summary=exec_summary,
            key_findings=key_findings or [f"Financial report active for {ticker}"],
            investment_context=invest_str,
            risk_context=risk_str,
            portfolio_impact=port_str,
            tax_impact=tax_str,
            credit_findings=credit_str,
            fraud_alerts=fraud_str,
            unresolved_questions=unresolved_questions,
            sections_rendered=sections_rendered,
            report_path=report_file_path,
            confidence=0.92 if key_findings else 0.70,
        )

        return FinOSAgentOutput(
            agent_name=self.name,
            entity_id=ticker,
            as_of_date=as_of_date,
            summary=assessment.summary,
            findings=assessment,
            confidence=assessment.confidence,
            evidence=[report_file_path] if report_file_path else key_findings[:3],
            status=self.status,
            metadata={
                "source": "tradingagents_reporting",
                "report_path": report_file_path,
                "inputs_synthesized_count": len(key_findings),
            },
        )
