"""Tests for FinOS Fraud Agent anomaly detection engine."""

from finos.core.agents import FinOSAgentInput, FraudAgent, FraudAssessment


def test_fraud_agent_clean_transactions():
    agent = FraudAgent()
    assert agent.name == "Fraud Agent"

    inp = FinOSAgentInput(
        entity_id="ACC_001",
        as_of_date="2025-01-15",
        context={
            "transactions": [
                {"id": "t1", "amount": 120.50, "counterparty": "ACME Supplies", "jurisdiction": "US"},
                {"id": "t2", "amount": 450.00, "counterparty": "Utility Co", "jurisdiction": "US"},
            ]
        },
    )

    out = agent.analyze(inp)

    assert out.agent_name == "Fraud Agent"
    assert out.entity_id == "ACC_001"
    assert isinstance(out.findings, FraudAssessment)
    assert out.findings.anomaly_score == 0.0
    assert out.findings.risk_rating == "Low Risk"


def test_fraud_agent_structuring_and_offshore_detection():
    agent = FraudAgent()

    inp = FinOSAgentInput(
        entity_id="ACC_999",
        as_of_date="2025-01-15",
        context={
            "transactions": [
                {"id": "tx1", "amount": 9950.00, "counterparty": "SHELL CORP", "jurisdiction": "PANAMA_SHELL"},  # Structuring + offshore
                {"id": "tx2", "amount": 9980.00, "counterparty": "SHELL CORP", "jurisdiction": "PANAMA_SHELL"},  # Duplicate pattern + structuring
            ]
        },
    )

    out = agent.analyze(inp)

    assert isinstance(out.findings, FraudAssessment)
    assert out.findings.anomaly_score >= 0.40
    assert out.findings.risk_rating in ["High Risk", "Critical Risk"]
    assert len(out.findings.suspicious_counterparties) > 0
    assert len(out.findings.red_flags) > 0


def test_fraud_agent_filing_inconsistency():
    agent = FraudAgent()

    inp = FinOSAgentInput(
        entity_id="COMPANY_XYZ",
        as_of_date="2025-01-15",
        context={
            "financial_filing": {
                "revenue": 50000000.0,
                "net_income": 12000000.0,
                "operating_cash_flow": -2000000.0,  # Divergence: Positive net income vs negative OCF
                "accounts_receivable": 25000000.0,  # 50% of revenue
            }
        },
    )

    out = agent.analyze(inp)

    assert isinstance(out.findings, FraudAssessment)
    assert out.findings.anomaly_score >= 0.40
    assert len(out.findings.filing_inconsistencies) > 0


def test_fraud_agent_empty_entity_id():
    agent = FraudAgent()
    inp = FinOSAgentInput(entity_id="", as_of_date="2025-01-15")
    out = agent.analyze(inp)

    assert out.confidence == 0.0
    assert "empty" in out.summary.lower()
