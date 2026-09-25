"""Fraud Agent implementation for FinOS.

Performs rule-based transaction anomaly detection, velocity checks, counterparty risk scoring,
and accounting filing inconsistency analysis in compliance with FinOS domain agent contracts.
"""

from __future__ import annotations

from typing import Any
from pydantic import BaseModel, Field

from finos.core.agents.base import AgentStatus, FinOSAgentInput, FinOSAgentOutput, FinOSDomainAgent


class FraudAssessment(BaseModel):
    """Structured assessment produced by the FinOS Fraud Agent."""
    summary: str = ""
    anomaly_score: float = Field(default=0.0, ge=0.0, le=1.0)
    risk_rating: str = "Low Risk"
    red_flags: list[str] = Field(default_factory=list)
    detected_anomalies: list[str] = Field(default_factory=list)
    filing_inconsistencies: list[str] = Field(default_factory=list)
    suspicious_counterparties: list[str] = Field(default_factory=list)
    gnn_risk_signals: dict[str, Any] = Field(default_factory=dict)
    confidence: float = Field(default=0.85, ge=0.0, le=1.0)


SUSPICIOUS_JURISDICTIONS = {"OFFSHORE_SHELL_CY", "PANAMA_SHELL", "CAYMAN_UNVERIFIED", "UNKNOWN_JURISDICTION"}


class FraudAgent(FinOSDomainAgent):
    """FinOS domain agent for transaction anomaly detection, accounting fraud scoring, and audit risk."""

    def __init__(self, llm: Any = None) -> None:
        self.llm = llm

    @property
    def name(self) -> str:
        return "Fraud Agent"

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
                findings=FraudAssessment(summary="Empty entity_id provided", confidence=0.0),
                confidence=0.0,
                evidence=[],
                status=self.status,
                metadata={"error": "empty_entity_id"},
            )

        context = agent_input.context or {}

        transactions = list(context.get("transactions") or [])
        financial_filing = context.get("financial_filing") or {}

        red_flags: list[str] = []
        anomalies: list[str] = []
        filing_inconsistencies: list[str] = []
        suspicious_counterparties: list[str] = []
        evidence_items: list[str] = []

        anomaly_points = 0.0

        if transactions:
            seen_txs: set[str] = set()
            amounts: list[float] = []

            for idx, tx in enumerate(transactions):
                if not isinstance(tx, dict):
                    continue

                tx_id = str(tx.get("id") or tx.get("tx_id") or f"tx_{idx}")
                amount = tx.get("amount")
                counterparty = str(tx.get("counterparty", "")).upper()
                jurisdiction = str(tx.get("jurisdiction", "")).upper()

                if isinstance(amount, (int, float)):
                    amounts.append(float(amount))
                    if 9900.0 <= amount <= 9999.0:
                        anomalies.append(f"Transaction '{tx_id}' (${amount:,.2f}) structured near $10k reporting threshold")
                        anomaly_points += 0.25

                    if amount >= 100000.0 and amount % 10000.0 == 0:
                        anomalies.append(f"Large round-number transaction '{tx_id}' (${amount:,.2f})")
                        anomaly_points += 0.15

                tx_signature = f"{amount}_{counterparty}"
                if tx_signature in seen_txs:
                    anomalies.append(f"Duplicate transaction pattern detected for signature '{tx_signature}'")
                    anomaly_points += 0.20
                seen_txs.add(tx_signature)

                if jurisdiction in SUSPICIOUS_JURISDICTIONS or "SHELL" in counterparty:
                    suspicious_counterparties.append(f"{counterparty} ({jurisdiction})")
                    red_flags.append(f"High-risk counterparty jurisdiction '{jurisdiction}' in tx '{tx_id}'")
                    anomaly_points += 0.35

            if len(transactions) > 100:
                red_flags.append(f"High transaction velocity: {len(transactions)} transactions in observation window")
                anomaly_points += 0.20

        if financial_filing and isinstance(financial_filing, dict):
            revenue = financial_filing.get("revenue")
            net_income = financial_filing.get("net_income")
            operating_cash_flow = financial_filing.get("operating_cash_flow")
            receivables = financial_filing.get("accounts_receivable")

            if isinstance(net_income, (int, float)) and isinstance(operating_cash_flow, (int, float)):
                if net_income > 0 and operating_cash_flow <= 0:
                    filing_inconsistencies.append(
                        f"Accounting divergence: Reported net income is ${net_income:,.2f} "
                        f"while operating cash flow is ${operating_cash_flow:,.2f}"
                    )
                    red_flags.append("Net Income / Cash Flow Divergence (Aggressive revenue recognition signal)")
                    anomaly_points += 0.40

            if isinstance(revenue, (int, float)) and isinstance(receivables, (int, float)):
                if revenue > 0 and (receivables / revenue) > 0.40:
                    filing_inconsistencies.append(
                        f"Elevated accounts receivable ({receivables / revenue * 100:.1f}% of revenue)"
                    )
                    anomaly_points += 0.20

        anomaly_score = min(1.0, round(anomaly_points, 2))

        has_data = bool(transactions or financial_filing)

        if not has_data:
            risk_rating = "UNMONITORED (DATA_UNAVAILABLE)"
            summary_msg = (
                f"Fraud & Audit Risk Assessment for {entity_id} as of {as_of_date}: "
                f"Transaction monitoring is DATA_UNAVAILABLE (0 user transactions or ledger filings supplied). "
                f"Anomaly scanning requires transaction ledger inputs."
            )
            evidence_items.append("Transaction monitoring unperformed: User transaction ledger unsupplied.")
            evidence_items.append("Required inputs for fraud scanning: Structuring ($9.9k), shell counterparty, velocity, and revenue/cash flow divergence signals.")
            confidence = 0.35
        else:
            if anomaly_score >= 0.70:
                risk_rating = "Critical Risk"
            elif anomaly_score >= 0.40:
                risk_rating = "High Risk"
            elif anomaly_score >= 0.20:
                risk_rating = "Medium Risk"
            else:
                risk_rating = "Low Risk"

            summary_msg = (
                f"Fraud & Audit Risk Assessment for {entity_id} as of {as_of_date}: "
                f"Risk Rating is '{risk_rating}' (Anomaly Score: {anomaly_score:.2f}). "
                f"Evaluated {len(transactions)} transactions and filing consistency."
            )
            confidence = 0.90

        evidence_items.extend(anomalies[:5])
        evidence_items.extend(filing_inconsistencies[:5])

        assessment = FraudAssessment(
            summary=summary_msg,
            anomaly_score=anomaly_score if has_data else 0.0,
            risk_rating=risk_rating,
            red_flags=red_flags,
            detected_anomalies=anomalies,
            filing_inconsistencies=filing_inconsistencies,
            suspicious_counterparties=suspicious_counterparties,
            gnn_risk_signals={
                "graph_node": entity_id,
                "anomaly_score": anomaly_score if has_data else 0.0,
                "counterparty_clusters": len(suspicious_counterparties),
                "data_status": "REAL" if has_data else "DATA_UNAVAILABLE",
            },
            confidence=confidence,
        )

        return FinOSAgentOutput(
            agent_name=self.name,
            entity_id=entity_id,
            as_of_date=as_of_date,
            summary=assessment.summary,
            findings=assessment,
            confidence=assessment.confidence,
            evidence=evidence_items or [summary_msg],
            status=self.status,
            metadata={
                "transaction_monitoring_status": "REAL" if has_data else "DATA_UNAVAILABLE",
                "anomaly_score": anomaly_score if has_data else None,
                "risk_rating": risk_rating,
                "transactions_scanned": len(transactions),
            },
        )

