"""Tax Agent implementation for FinOS.

Provides multi-jurisdiction capital gains evaluation, holding period classification
(short-term vs. long-term), tax liability estimation, and tax-loss harvesting analysis.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any
from pydantic import BaseModel, Field

from finos.core.agents.base import AgentStatus, FinOSAgentInput, FinOSAgentOutput, FinOSDomainAgent


class TaxAssessment(BaseModel):
    """Structured assessment produced by the FinOS Tax Agent."""
    summary: str = ""
    tax_jurisdiction: str = "US"
    estimated_tax_liability: float | None = None
    taxable_gain_loss: float | None = None
    holding_period_category: str = "Unknown"
    applicable_tax_rate_est: float | None = None
    tax_harvesting_opportunities: list[str] = Field(default_factory=list)
    short_vs_long_term_capital_gains: dict[str, Any] = Field(default_factory=dict)
    compliance_notes: list[str] = Field(default_factory=list)
    assumptions: list[str] = Field(default_factory=list)
    missing_information: list[str] = Field(default_factory=list)
    confidence: float = Field(default=0.85, ge=0.0, le=1.0)


DEFAULT_TAX_RULES = {
    "US": {
        "short_term_threshold_days": 365,
        "default_short_term_rate": 0.30,
        "default_long_term_rate": 0.15,
        "wash_sale_period_days": 30,
    },
    "UK": {
        "short_term_threshold_days": 0,
        "default_short_term_rate": 0.20,
        "default_long_term_rate": 0.20,
        "wash_sale_period_days": 30,
    },
    "GLOBAL": {
        "short_term_threshold_days": 365,
        "default_short_term_rate": 0.25,
        "default_long_term_rate": 0.15,
        "wash_sale_period_days": 30,
    },
}


class TaxAgent(FinOSDomainAgent):
    """FinOS domain agent for tax implications, capital gains calculation, and tax-loss harvesting."""

    def __init__(self, llm: Any = None) -> None:
        self.llm = llm

    @property
    def name(self) -> str:
        return "Tax Agent"

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
                findings=TaxAssessment(summary="Empty entity_id provided", confidence=0.0),
                confidence=0.0,
                evidence=[],
                status=self.status,
                metadata={"error": "empty_entity_id"},
            )

        context = agent_input.context or {}

        jurisdiction = str(context.get("jurisdiction", "US")).upper()
        rules = DEFAULT_TAX_RULES.get(jurisdiction, DEFAULT_TAX_RULES["GLOBAL"])

        acq_date_str = context.get("acquisition_date")
        acq_price = context.get("acquisition_price")
        disp_price = context.get("disposal_price") or context.get("current_price")
        quantity = context.get("quantity", 1.0)
        unrealized_positions = context.get("unrealized_positions") or []

        missing_info: list[str] = []
        assumptions: list[str] = [f"Tax rules applied: Jurisdiction '{jurisdiction}'"]
        evidence_items: list[str] = []
        harvesting_opps: list[str] = []
        compliance_notes: list[str] = []

        taxable_gain = None
        holding_category = "Unrealized / Pending"
        tax_rate = None
        estimated_tax = None

        if acq_price is not None and disp_price is not None:
            try:
                cost_basis = float(acq_price) * float(quantity)
                proceeds = float(disp_price) * float(quantity)
                taxable_gain = round(proceeds - cost_basis, 2)
                evidence_items.append(f"Cost basis: ${cost_basis:,.2f} | Proceeds: ${proceeds:,.2f} | Gain/Loss: ${taxable_gain:,.2f}")
            except (ValueError, TypeError):
                missing_info.append("Invalid numeric values for acquisition or disposal price")

        if acq_date_str and as_of_date:
            try:
                acq_dt = datetime.strptime(acq_date_str, "%Y-%m-%d")
                as_of_dt = datetime.strptime(as_of_date, "%Y-%m-%d")
                holding_days = (as_of_dt - acq_dt).days

                threshold = rules["short_term_threshold_days"]
                if threshold > 0:
                    if holding_days > threshold:
                        holding_category = "Long-Term Capital Gain" if (taxable_gain and taxable_gain > 0) else "Long-Term Capital Loss"
                        tax_rate = rules["default_long_term_rate"]
                    else:
                        holding_category = "Short-Term Capital Gain" if (taxable_gain and taxable_gain > 0) else "Short-Term Capital Loss"
                        tax_rate = rules["default_short_term_rate"]
                else:
                    holding_category = "Standard Capital Gain/Loss"
                    tax_rate = rules["default_long_term_rate"]

                assumptions.append(f"Holding period: {holding_days} days (Short-term threshold: {threshold} days)")
            except ValueError:
                missing_info.append("Invalid date format for acquisition_date (expected YYYY-MM-DD)")
        else:
            if acq_date_str is None:
                missing_info.append("Acquisition date unstated; assuming Short-Term capital gains tax rate")
                tax_rate = rules["default_short_term_rate"]

        if taxable_gain is not None and tax_rate is not None:
            if taxable_gain > 0:
                estimated_tax = round(taxable_gain * tax_rate, 2)
                assumptions.append(f"Tax rate assumption: {tax_rate * 100:.1f}%")
            else:
                estimated_tax = 0.0
                harvesting_opps.append(f"Tax-loss harvesting opportunity: ${abs(taxable_gain):,.2f} loss available to offset gains")

        if unrealized_positions and isinstance(unrealized_positions, list):
            for pos in unrealized_positions:
                if isinstance(pos, dict):
                    sym = pos.get("symbol", "Position")
                    unrealized_loss = pos.get("unrealized_loss", 0.0)
                    if isinstance(unrealized_loss, (int, float)) and unrealized_loss > 0:
                        harvesting_opps.append(f"Harvestable loss in {sym}: ${unrealized_loss:,.2f}")

        compliance_notes.append(f"Wash sale rule window: {rules['wash_sale_period_days']} days before/after transaction")

        summary_msg = (
            f"Tax evaluation for {ticker} under {jurisdiction} rules as of {as_of_date}: "
            f"Holding Category: {holding_category}. "
            + (f"Estimated Tax Liability: ${estimated_tax:,.2f}" if estimated_tax is not None else "Tax liability calculation pending acquisition details.")
        )

        confidence = 0.88 if (taxable_gain is not None and acq_date_str) else 0.65

        assessment = TaxAssessment(
            summary=summary_msg,
            tax_jurisdiction=jurisdiction,
            estimated_tax_liability=estimated_tax,
            taxable_gain_loss=taxable_gain,
            holding_period_category=holding_category,
            applicable_tax_rate_est=tax_rate,
            tax_harvesting_opportunities=harvesting_opps,
            short_vs_long_term_capital_gains={
                "category": holding_category,
                "taxable_gain": taxable_gain,
                "tax_rate_applied": tax_rate,
            },
            compliance_notes=compliance_notes,
            assumptions=assumptions,
            missing_information=missing_info,
            confidence=confidence,
        )

        return FinOSAgentOutput(
            agent_name=self.name,
            entity_id=ticker,
            as_of_date=as_of_date,
            summary=assessment.summary,
            findings=assessment,
            confidence=assessment.confidence,
            evidence=evidence_items or [summary_msg],
            status=self.status,
            metadata={
                "jurisdiction": jurisdiction,
                "taxable_gain": taxable_gain,
                "estimated_tax": estimated_tax,
            },
        )
