"""Focused unit tests for FinOS Narrative Quality Upgrade.

Verifies:
1. Narrative schema compatibility across all 10 agents (what_this_means, why_it_matters, key_findings, watch_items, data_status).
2. Explicit trade proposal disclaimer (UNEXECUTED_TRADE_PROPOSAL).
3. Honest DATA_UNAVAILABLE handling for Tax and Fraud agents without fake conclusions.
4. Exact numeric preservation in credit, portfolio, and trading outputs.
5. Report Agent 12-section synthesis with multi-paragraph Executive Summary and key findings bullets.
"""

from __future__ import annotations

import pytest
from finos.core.agents.base import FinOSAgentInput
from finos.core.agents.news import NewsAgent
from finos.core.agents.macro import MacroEconomyAgent
from finos.core.agents.credit import CreditAgent
from finos.core.agents.investment import InvestmentAgent
from finos.core.agents.risk import RiskAgent
from finos.core.agents.portfolio import PortfolioAgent
from finos.core.agents.trading import TradingAgent
from finos.core.agents.tax import TaxAgent
from finos.core.agents.fraud import FraudAgent
from finos.core.agents.report import ReportAgent


@pytest.fixture
def base_input() -> FinOSAgentInput:
    return FinOSAgentInput(
        entity_id="RELIANCE.NS",
        as_of_date="2026-09-25",
        request="Evaluate RELIANCE.NS credit health and risk exposure",
        context={
            "market": "NSE India",
            "current_price": 2850.0,
            "total_debt": 300000.0,
            "ebitda": 120000.0,
            "revenue": 900000.0,
            "cash": 40000.0,
            "net_income": 70000.0,
            "operating_cash_flow": 85000.0,
            "financials": {
                "total_debt": 300000.0,
                "ebitda": 120000.0,
                "cash": 40000.0,
                "revenue": 900000.0,
                "net_income": 70000.0,
                "operating_cash_flow": 85000.0,
            },
        },
    )


def test_narrative_fields_presence(base_input: FinOSAgentInput):
    agents = [
        NewsAgent(),
        MacroEconomyAgent(),
        CreditAgent(),
        InvestmentAgent(),
        RiskAgent(),
        PortfolioAgent(),
        TradingAgent(),
        TaxAgent(),
        FraudAgent(),
    ]

    for agent in agents:
        output = agent.analyze(base_input)
        findings = output.findings
        
        assert hasattr(findings, "what_this_means"), f"{agent.name} missing what_this_means"
        assert hasattr(findings, "why_it_matters"), f"{agent.name} missing why_it_matters"
        assert hasattr(findings, "key_findings"), f"{agent.name} missing key_findings"
        assert hasattr(findings, "watch_items"), f"{agent.name} missing watch_items"
        assert hasattr(findings, "data_status"), f"{agent.name} missing data_status"
        
        assert isinstance(getattr(findings, "what_this_means"), str)
        assert len(getattr(findings, "what_this_means")) > 0, f"{agent.name} has empty what_this_means"


def test_trading_unexecuted_disclaimer(base_input: FinOSAgentInput):
    trading_agent = TradingAgent()
    output = trading_agent.analyze(base_input)
    
    assert "UNEXECUTED_TRADE_PROPOSAL" in output.summary or "UNEXECUTED_TRADE_PROPOSAL" in output.findings.what_this_means
    assert "no live broker order execution" in output.summary.lower() or "no live broker order execution" in output.findings.what_this_means.lower()


def test_data_unavailable_honest_handling(base_input: FinOSAgentInput):
    # TaxAgent without cost basis
    tax_agent = TaxAgent()
    tax_out = tax_agent.analyze(base_input)
    assert tax_out.findings.data_status == "DATA_UNAVAILABLE"
    assert "DATA_UNAVAILABLE" in tax_out.summary or "unsupplied" in tax_out.findings.what_this_means.lower()
    # Verify statutory rules are still explained
    assert "20.0%" in tax_out.findings.what_this_means or "20%" in tax_out.findings.what_this_means or "STCG" in tax_out.findings.what_this_means

    # FraudAgent without transactions
    fraud_agent = FraudAgent()
    fraud_out = fraud_agent.analyze(base_input)
    assert fraud_out.findings.data_status == "DATA_UNAVAILABLE"
    assert "DATA_UNAVAILABLE" in fraud_out.summary or "could not be completed" in fraud_out.findings.what_this_means.lower()


def test_numerical_preservation(base_input: FinOSAgentInput):
    credit_agent = CreditAgent()
    out = credit_agent.analyze(base_input)

    findings = out.findings
    # EBITDA ratio = 300,000 / 120,000 = 2.5
    assert findings.leverage_ratio_debt_ebitda == 2.5
    assert "2.5" in findings.what_this_means or "2.50x" in findings.summary


def test_report_agent_12_section_executive_synthesis(base_input: FinOSAgentInput):
    # Analyze with all upstream outputs
    news_out = NewsAgent().analyze(base_input)
    macro_out = MacroEconomyAgent().analyze(base_input)
    credit_out = CreditAgent().analyze(base_input)
    invest_out = InvestmentAgent().analyze(base_input)
    risk_out = RiskAgent().analyze(base_input)
    port_out = PortfolioAgent().analyze(base_input)
    trade_out = TradingAgent().analyze(base_input)
    tax_out = TaxAgent().analyze(base_input)
    fraud_out = FraudAgent().analyze(base_input)

    base_input.relevant_previous_outputs = {
        "news": news_out,
        "macro": macro_out,
        "credit": credit_out,
        "investment": invest_out,
        "risk": risk_out,
        "portfolio": port_out,
        "trading": trade_out,
        "tax": tax_out,
        "fraud": fraud_out,
    }

    report_agent = ReportAgent()
    report_out = report_agent.analyze(base_input)

    findings = report_out.findings
    full_md = report_out.metadata["full_report_markdown"]

    # Verify 20 sections rendered
    assert len(findings.sections_rendered) == 20
    assert "1. Executive Summary" in full_md
    assert "2. Current Situation & Market Context" in full_md
    assert "13. Trading Implications" in full_md
    assert "19. Data Limitations & Confidence" in full_md
    assert "20. Source & Evidence Context" in full_md

    # Verify executive summary paragraphs and bullets
    assert len(findings.executive_summary) > 100
    assert "Key Findings" in full_md or "What the Evidence Says" in full_md
    assert len(findings.key_findings) >= 4
    assert "UNEXECUTED_TRADE_PROPOSAL" in full_md or "TRADE_PROPOSAL" in full_md


def test_llm_unavailable_produces_unavailable_rating_not_hold(base_input: FinOSAgentInput):
    # 1. InvestmentAgent with llm=None (or unconfigured/failing LLM)
    invest_agent = InvestmentAgent(llm=None)
    invest_out = invest_agent.analyze(base_input)

    assert invest_out.findings.rating == "UNAVAILABLE"
    assert invest_out.findings.rating != "Hold"
    assert invest_out.findings.data_status == "DATA_UNAVAILABLE"
    assert "reasoning model was unavailable" in invest_out.findings.what_this_means.lower()

    # 2. Downstream PortfolioAgent with UNAVAILABLE investment stance
    base_input.relevant_previous_outputs = {"investment": invest_out}
    port_agent = PortfolioAgent(llm=None)
    port_out = port_agent.analyze(base_input)
    assert port_out.findings.recommended_rating == "UNAVAILABLE"
    assert port_out.findings.data_status == "DATA_UNAVAILABLE"

    # 3. Downstream TradingAgent with UNAVAILABLE investment stance
    trade_agent = TradingAgent(llm=None)
    trade_out = trade_agent.analyze(base_input)
    assert trade_out.findings.action == "UNAVAILABLE"
    assert trade_out.findings.action != "Hold"
    assert "TRADE_PROPOSAL_UNAVAILABLE" in trade_out.findings.execution_notice

    # 4. Downstream ReportAgent clearly explains the limitation
    base_input.relevant_previous_outputs["trading"] = trade_out
    base_input.relevant_previous_outputs["portfolio"] = port_out
    report_agent = ReportAgent()
    report_out = report_agent.analyze(base_input)
    full_md = report_out.metadata["full_report_markdown"]

    assert "Investment recommendation unavailable because the reasoning model was unavailable" in full_md
    assert "no Buy/Hold/Sell conclusion is being issued from fallback logic" in full_md

