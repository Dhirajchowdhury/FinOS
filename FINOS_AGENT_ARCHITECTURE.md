# FinOS Agent Architecture — 10 Domain Agents (Build Phase Complete)

## Overview & Architecture

FinOS establishes a 10-domain agent architecture built on top of the active `tradingagents` runtime. Each domain agent conforms to the standardized `FinOSDomainAgent` contract, accepting typed `FinOSAgentInput` and emitting structured `FinOSAgentOutput`.

```text
FinOS Domain Agents (finos/core/agents/)
        ↓ (adapter / composition / domain logic)
Existing TradingAgents Specialists & Data Infrastructure (tradingagents/agents/ & tradingagents/dataflows/)
        ↓
Universal LLM Client & Vendor Tools (tradingagents/llm_clients/ & FRED / AlphaVantage / Yahoo / SEC)
```

Key Architectural Principles:
- **`tradingagents/`** remains the active, tested underlying execution engine.
- **`finos/core/agents/`** is the FinOS domain architecture layer.
- All 10 agents are fully implemented, structurally real, and backed by comprehensive unit and integration tests.
- Physical backend repository migrations and external databases (Kafka, Neo4j, Qdrant, GraphRAG) are intentionally deferred to future milestones.

---

## 10 FinOS Domain Agents Summary Table

| # | Domain Agent | Status Tag | Underlying Specialists / Dataflows | Primary Output Model |
|---|--------------|------------|-----------------------------------|----------------------|
| 1 | **News Agent** | `IMPLEMENTED` | `tradingagents.dataflows.router`, `get_news`, `get_global_news` | `NewsAssessment` |
| 2 | **Macro Economy Agent** | `IMPLEMENTED` | `tradingagents.dataflows.vendors.fred` | `MacroAssessment` |
| 3 | **Risk Agent** | `IMPLEMENTED` | `aggressive_debator`, `conservative_debator`, `neutral_debator` | `RiskAssessment` |
| 4 | **Portfolio Agent** | `IMPLEMENTED` | `portfolio_manager`, `tradingagents.portfolio` | `PortfolioAssessment` |
| 5 | **Investment Agent** | `IMPLEMENTED` | `bull_researcher`, `bear_researcher`, `research_manager` | `InvestmentAssessment` |
| 6 | **Report Agent** | `IMPLEMENTED` | `tradingagents.reporting.write_report_tree` | `ReportAssessment` |
| 7 | **Trading Agent** | `IMPLEMENTED` | `tradingagents.agents.trader.trader` | `TradingProposal` |
| 8 | **Credit Agent** | `IMPLEMENTED` | Financial ratio analysis & FRED/SEC fundamentals | `CreditAssessment` |
| 9 | **Tax Agent** | `IMPLEMENTED` | Multi-jurisdiction rules (US/UK/Global) & cost-basis engine | `TaxAssessment` |
| 10 | **Fraud Agent** | `IMPLEMENTED` | Anomaly detection, velocity, counterparty & filing checks | `FraudAssessment` |

---

## Detailed Agent Implementation Specifications

### 1. News Agent (`NewsAgent`) — `finos/core/agents/news.py`
- **Purpose:** Retrieves, filters, and analyzes ticker-specific news and global headlines, assessing market impact, sentiment, and risk/opportunity signals.
- **Inputs:** `entity_id` (ticker), `as_of_date`, optional `news_report` string or `raw_articles` list in context.
- **Outputs:** `NewsAssessment` (summary, key_events, sentiment, market_impact, affected_entities, affected_sectors, risk_factors, opportunities, evidence, confidence).
- **Tools/Data:** Reuses `tradingagents.dataflows.router` (`route_to_vendor("get_news", ...)` and `route_to_vendor("get_global_news", ...)`).
- **LLM Usage:** Optional LLM synthesis or robust heuristic keyword sentiment & event parser.
- **Tests:** `tests/test_finos_news_agent.py` (normal news, empty news, malformed data, as-of-date safety, empty entity validation).

### 2. Macro Economy Agent (`MacroEconomyAgent`) — `finos/core/agents/macro.py`
- **Purpose:** Analyzes macroeconomic time series (CPI, Fed Funds Rate, Unemployment, Yield Curve) and determines the prevailing economic regime and asset implications.
- **Inputs:** `entity_id` (e.g. `'MACRO_US'`), `as_of_date`, optional macro series overrides in context.
- **Outputs:** `MacroAssessment` (inflation, interest_rates, monetary_policy, employment, growth, yield_curve, economic_regime, macro_risks, macro_opportunities, affected_assets_sectors, outlook, confidence).
- **Tools/Data:** Reuses `tradingagents.dataflows.vendors.fred.get_macro_data`.
- **LLM Usage:** Interprets raw indicators into financial implications and regime classifications.
- **Tests:** `tests/test_finos_macro_agent.py` (valid macro data, missing indicators, historical/as-of-date analysis, yield curve inversion detection).

### 3. Risk Agent (`RiskAgent`) — `finos/core/agents/risk.py`
- **Purpose:** Multi-perspective financial risk assessment synthesizing debate outputs from aggressive, conservative, and neutral risk specialists.
- **Inputs:** `entity_id`, `as_of_date`, optional specialist responses or risk debate state in context.
- **Outputs:** `RiskAssessment` (summary, risk_level, key_risks, aggressive_view, conservative_view, neutral_view, consensus_decision, risk_mitigations, volatility_risk, drawdown_risk, liquidity_risk, concentration_risk, confidence).
- **Underlying Specialists:** Composes `aggressive_debator`, `conservative_debator`, `neutral_debator`.
- **Tests:** `tests/test_finos_agent_adapters.py` (specialist output synthesis, conflicting risk views, risk categorization).

### 4. Portfolio Agent (`PortfolioAgent`) — `finos/core/agents/portfolio.py`
- **Purpose:** Portfolio-level allocation reasoning, holdings concentration analysis, cash context evaluation, and position sizing limits.
- **Inputs:** `entity_id`, `as_of_date`, `holdings` list, `cash_balance`, `portfolio_context` string.
- **Outputs:** `PortfolioAssessment` (summary, target_allocation, recommended_rating, position_adjustments, risk_exposure, cash_context, existing_holdings_impact, concentration_warning, max_position_size_pct, confidence).
- **Underlying Specialists:** Reuses `portfolio_manager.py` and `tradingagents.portfolio`.
- **Tests:** `tests/test_finos_agent_adapters.py` (holdings analysis, position sizing caps, concentration warnings).

### 5. Trading Agent (`TradingAgent`) — `finos/core/agents/trading.py`
- **Purpose:** Formulates structured trade plans with entry price, stop loss, target price, position sizing, and risk limit grounding.
- **Inputs:** `entity_id`, `as_of_date`, `trader_investment_plan` or `investment_plan` context.
- **Outputs:** `TradingProposal` (action, reasoning, entry_price, stop_loss, target_price, position_sizing, risk_limit_notes, assumptions, confidence).
- **Underlying Specialists:** Reuses `tradingagents/agents/trader/trader.py`.
- **Tests:** `tests/test_finos_agent_adapters.py` (trade proposal parsing, entry/stop loss numeric parsing, risk limits).

### 6. Investment Agent (`InvestmentAgent`) — `finos/core/agents/investment.py`
- **Purpose:** Synthesizes News, Macro, Risk, and Fundamentals into a unified investment thesis, bull/bear debate cases, catalysts, and conviction rating.
- **Inputs:** `entity_id`, `as_of_date`, upstream agent outputs or debate history context.
- **Outputs:** `InvestmentAssessment` (rating, investment_thesis, bull_case, bear_case, strategic_actions, rationale, opportunity_assessment, downside_considerations, key_catalysts, valuation_context, confidence).
- **Underlying Specialists:** Composes `bull_researcher`, `bear_researcher`, `research_manager`.
- **Tests:** `tests/test_finos_investment_agent.py` (bull/bear synthesis, missing context fallback, rating parsing).

### 7. Report Agent (`ReportAgent`) — `finos/core/agents/report.py`
- **Purpose:** Aggregates multi-agent intelligence into executive summaries, key findings, unresolved questions, and complete markdown report trees.
- **Inputs:** `entity_id`, `as_of_date`, domain agent outputs, optional `save_path` for report exports.
- **Outputs:** `ReportAssessment` (summary, executive_summary, key_findings, investment_context, risk_context, portfolio_impact, tax_impact, credit_findings, fraud_alerts, unresolved_questions, sections_rendered, report_path, confidence).
- **Underlying Components:** Reuses `tradingagents.reporting.write_report_tree`.
- **Tests:** `tests/test_finos_agent_adapters.py` (full/partial report synthesis, markdown report tree file exports).

### 8. Credit Agent (`CreditAgent`) — `finos/core/agents/credit.py`
- **Purpose:** Corporate solvency and credit rating evaluation, computing debt leverage (Debt/EBITDA), interest coverage ratio, balance sheet strength, and 1-year default probabilities.
- **Inputs:** `entity_id`, `as_of_date`, `total_debt`, `ebitda`, `interest_expense`, `current_assets`, `current_liabilities`.
- **Outputs:** `CreditAssessment` (summary, credit_rating, default_probability_1y, leverage_ratio_debt_ebitda, interest_coverage_ratio, current_ratio, free_cash_flow, balance_sheet_strength, covenant_analysis, credit_risk_factors, missing_information, confidence).
- **Tools/Data:** Fundamentals vendor fallback (`route_to_vendor("get_fundamentals", ...)`).
- **Tests:** `tests/test_finos_credit_agent.py` (strong balance sheet AA rating, high leverage distressed CCC rating, empty input validation).

### 9. Tax Agent (`TaxAgent`) — `finos/core/agents/tax.py`
- **Purpose:** Multi-jurisdiction capital gains tax evaluation (US, UK, Global), short-term vs. long-term holding period classification, tax liability estimation, and tax-loss harvesting analysis.
- **Inputs:** `entity_id`, `as_of_date`, `jurisdiction` (`'US'`, `'UK'`, `'GLOBAL'`), `acquisition_date`, `acquisition_price`, `disposal_price`, `quantity`, `unrealized_positions`.
- **Outputs:** `TaxAssessment` (summary, tax_jurisdiction, estimated_tax_liability, taxable_gain_loss, holding_period_category, applicable_tax_rate_est, tax_harvesting_opportunities, short_vs_long_term_capital_gains, compliance_notes, assumptions, missing_information, confidence).
- **Tests:** `tests/test_finos_tax_agent.py` (short-term gain at 30%, long-term gain at 15%, tax loss harvesting, empty entity validation).

### 10. Fraud Agent (`FraudAgent`) — `finos/core/agents/fraud.py`
- **Purpose:** Rule-based transaction anomaly detection, structuring detection ($9.9k threshold avoidance), velocity checks, offshore counterparty risk scoring, and net income vs. cash flow filing divergence checks.
- **Inputs:** `entity_id`, `as_of_date`, `transactions` list, `financial_filing` dictionary.
- **Outputs:** `FraudAssessment` (summary, anomaly_score, risk_rating, red_flags, detected_anomalies, filing_inconsistencies, suspicious_counterparties, gnn_risk_signals, confidence).
- **Tests:** `tests/test_finos_fraud_agent.py` (clean transactions, structuring & shell jurisdiction detection, income/OCF divergence, empty entity validation).

---

## State Bridge & Input/Output Contracts

- **`FinOSAgentInput`** (`finos.core.agents.base`): Standardized input contract enforcing `entity_id`, `entity_type`, `as_of_date`, `request`, `context`, and `relevant_previous_outputs`.
- **`FinOSAgentOutput`** (`finos.core.agents.base`): Standardized output contract containing `agent_name`, `entity_id`, `as_of_date`, `summary`, `findings` (Pydantic model), `confidence`, `evidence`, `status`, and `metadata`.
- **State Bridge** (`finos.core.state.bridge`): Bi-directional converter between `AgentState` and `FinosState`.

---

## Verification Results

Full test suite execution using `.venv\Scripts\pytest.exe`:

```text
================ 1031 passed, 5 skipped, 22 warnings in 19.80s ================
```

All 1,031 tests pass with zero errors.

---

## Deferrals (Future Milestones)

The following external infrastructure components remain intentionally unbuilt:
- Decision Engine dynamic graph routing
- Neo4j Knowledge Graph & Qdrant Vector DB
- Kafka event streaming & Model Context Protocol (MCP) server
- Fraud Graph Neural Networks (GNN)
- FastAPI backend & Next.js frontend
