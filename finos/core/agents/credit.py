"""Credit Agent implementation for FinOS.

Performs fundamental credit evaluation, debt leverage calculation, interest coverage analysis,
and default probability scoring in compliance with FinOS domain agent contracts.
"""

from __future__ import annotations

from typing import Any
from pydantic import BaseModel, Field

from finos.core.agents.base import AgentStatus, FinOSAgentInput, FinOSAgentOutput, FinOSDomainAgent
from tradingagents.dataflows.router import route_to_vendor


class CreditAssessment(BaseModel):
    """Structured assessment produced by the FinOS Credit Agent."""
    summary: str = ""
    credit_rating: str = "BBB"
    default_probability_1y: float = Field(default=0.01, ge=0.0, le=1.0)
    leverage_ratio_debt_ebitda: float | None = None
    interest_coverage_ratio: float | None = None
    current_ratio: float | None = None
    free_cash_flow: float | None = None
    balance_sheet_strength: str = "Moderate"
    covenant_analysis: list[str] = Field(default_factory=list)
    credit_risk_factors: list[str] = Field(default_factory=list)
    missing_information: list[str] = Field(default_factory=list)
    confidence: float = Field(default=0.8, ge=0.0, le=1.0)


class CreditAgent(FinOSDomainAgent):
    """FinOS domain agent for corporate credit risk, solvency, and debt rating evaluation."""

    def __init__(self, llm: Any = None) -> None:
        self.llm = llm

    @property
    def name(self) -> str:
        return "Credit Agent"

    @property
    def status(self) -> AgentStatus:
        return AgentStatus.ACTIVE

    def analyze(self, agent_input: FinOSAgentInput) -> FinOSAgentOutput:
        entity_id = (agent_input.entity_id or "").strip()
        as_of_date = (agent_input.as_of_date or "").strip()

        if not entity_id:
            return FinOSAgentOutput(
                agent_name=self.name,
                entity_id=entity_id,
                as_of_date=as_of_date,
                summary="Invalid entity_id: entity_id cannot be empty.",
                findings=CreditAssessment(summary="Empty entity_id provided", confidence=0.0),
                confidence=0.0,
                evidence=[],
                status=self.status,
                metadata={"error": "empty_entity_id"},
            )

        context = agent_input.context or {}
        missing_info: list[str] = []
        evidence_items: list[str] = []

        revenue = context.get("revenue")
        ebitda = context.get("ebitda")
        total_debt = context.get("total_debt")
        cash = context.get("cash")
        interest_expense = context.get("interest_expense")
        operating_cash_flow = context.get("operating_cash_flow")
        current_assets = context.get("current_assets")
        current_liabilities = context.get("current_liabilities")

        if ebitda is None or total_debt is None or revenue is None:
            try:
                fund_data = route_to_vendor("get_normalized_financials", entity_id, curr_date=as_of_date or None)
                if isinstance(fund_data, dict):
                    ebitda = ebitda if ebitda is not None else (fund_data.get("ebitda_ttm") or fund_data.get("ebitda"))
                    total_debt = total_debt if total_debt is not None else fund_data.get("total_debt")
                    revenue = revenue if revenue is not None else (fund_data.get("revenue_ttm") or fund_data.get("revenue"))
                    cash = cash if cash is not None else fund_data.get("cash")
                    interest_expense = interest_expense if interest_expense is not None else (fund_data.get("interest_expense_ttm") or fund_data.get("interest_expense"))
                    current_assets = current_assets if current_assets is not None else fund_data.get("current_assets")
                    current_liabilities = current_liabilities if current_liabilities is not None else fund_data.get("current_liabilities")

                    fiscal_period = fund_data.get("fiscal_period")
                    currency = fund_data.get("currency") or "INR"
                    source = fund_data.get("source") or "yfinance"
                    field_status = fund_data.get("field_status", {})

                    if fund_data.get("revenue") is not None:
                        evidence_items.append(f"Revenue (TTM): {currency} {fund_data.get('revenue_ttm'):,.2f} (Status: {field_status.get('revenue', 'REAL')})")
                    if fund_data.get("ebitda") is not None:
                        evidence_items.append(f"EBITDA (TTM): {currency} {ebitda:,.2f} (Status: {field_status.get('ebitda', 'REAL')})")
                    if fund_data.get("total_debt") is not None:
                        evidence_items.append(f"Total Debt: {currency} {total_debt:,.2f} (Status: {field_status.get('total_debt', 'REAL')})")
                    if fund_data.get("cash") is not None:
                        evidence_items.append(f"Cash Balance: {currency} {cash:,.2f} (Status: {field_status.get('cash', 'REAL')})")
                    if fund_data.get("interest_expense") is not None:
                        evidence_items.append(f"Interest Expense (TTM): {currency} {interest_expense:,.2f} (Status: {field_status.get('interest_expense', 'REAL')})")
                    if fiscal_period:
                        evidence_items.append(f"Financial Period End: {fiscal_period} (Source: {source})")
            except Exception as exc:
                evidence_items.append(f"Fundamentals query note: {exc}")

        leverage_ratio = None
        if isinstance(total_debt, (int, float)) and isinstance(ebitda, (int, float)) and ebitda > 0:
            leverage_ratio = round(float(total_debt) / float(ebitda), 2)
            evidence_items.append(f"Leverage Ratio (Debt/EBITDA): {leverage_ratio:.2f}x")
        else:
            missing_info.append("EBITDA or Total Debt data unstated")

        interest_coverage = None
        if isinstance(ebitda, (int, float)) and isinstance(interest_expense, (int, float)) and interest_expense > 0:
            interest_coverage = round(float(ebitda) / float(interest_expense), 2)
            evidence_items.append(f"Interest Coverage: {interest_coverage:.2f}x")
        elif interest_expense is None:
            missing_info.append("Interest Expense unstated")

        current_ratio = None
        if isinstance(current_assets, (int, float)) and isinstance(current_liabilities, (int, float)) and current_liabilities > 0:
            current_ratio = round(float(current_assets) / float(current_liabilities), 2)

        risk_factors: list[str] = []
        covenant_notes: list[str] = []

        if leverage_ratio is not None:
            if leverage_ratio < 2.0:
                credit_rating = "AA"
                default_prob = 0.005
                balance_sheet = "Strong"
                covenant_notes.append("Leverage safely below standard 3.5x debt covenant threshold")
            elif leverage_ratio < 3.5:
                credit_rating = "BBB"
                default_prob = 0.015
                balance_sheet = "Moderate"
                covenant_notes.append("Leverage compliant with standard debt covenants")
            elif leverage_ratio < 5.0:
                credit_rating = "BB"
                default_prob = 0.045
                balance_sheet = "Weak"
                risk_factors.append("Elevated debt leverage (> 3.5x EBITDA)")
                covenant_notes.append("Tight debt covenant headroom")
            else:
                credit_rating = "CCC"
                default_prob = 0.150
                balance_sheet = "Distressed"
                risk_factors.append("High leverage (> 5.0x EBITDA) poses severe default risk")
                covenant_notes.append("High risk of debt covenant breach")
        else:
            credit_rating = context.get("credit_rating", "BBB")
            default_prob = 0.020
            balance_sheet = "Moderate"

        if interest_coverage is not None and interest_coverage < 2.0:
            risk_factors.append("Low interest coverage ratio (< 2.0x)")
            if credit_rating in ["AA", "BBB"]:
                credit_rating = "BB"
                default_prob += 0.02

        summary_msg = (
            f"Credit assessment for {entity_id} as of {as_of_date}: Estimated Rating is {credit_rating}. "
            f"1-Year Default Probability: {default_prob * 100:.1f}%. Balance sheet profile: {balance_sheet}."
        )

        confidence = 0.85 if leverage_ratio is not None else 0.60

        assessment = CreditAssessment(
            summary=summary_msg,
            credit_rating=credit_rating,
            default_probability_1y=default_prob,
            leverage_ratio_debt_ebitda=leverage_ratio,
            interest_coverage_ratio=interest_coverage,
            current_ratio=current_ratio,
            free_cash_flow=float(operating_cash_flow) if isinstance(operating_cash_flow, (int, float)) else None,
            balance_sheet_strength=balance_sheet,
            covenant_analysis=covenant_notes or ["Standard debt covenant compliance assumed"],
            credit_risk_factors=risk_factors or ["Refinancing risk under tight credit conditions"],
            missing_information=missing_info,
            confidence=confidence,
        )

        metadata_dict = {
            "credit_rating": credit_rating,
            "default_probability_1y": default_prob,
            "leverage_ratio": leverage_ratio,
            "interest_coverage": interest_coverage,
        }
        if 'fund_data' in locals() and isinstance(fund_data, dict):
            metadata_dict.update({
                "revenue": revenue,
                "ebitda": ebitda,
                "total_debt": total_debt,
                "cash": cash,
                "interest_expense": interest_expense,
                "fiscal_period": fund_data.get("fiscal_period"),
                "currency": fund_data.get("currency"),
                "source": fund_data.get("source"),
                "field_status": fund_data.get("field_status"),
            })

        return FinOSAgentOutput(
            agent_name=self.name,
            entity_id=entity_id,
            as_of_date=as_of_date,
            summary=assessment.summary,
            findings=assessment,
            confidence=assessment.confidence,
            evidence=evidence_items or [summary_msg],
            status=self.status,
            metadata=metadata_dict,
        )

