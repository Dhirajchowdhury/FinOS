# FinOS — Project Implementation Status

> **Authoritative Implementation Log & Architecture Audit**  
> **Status Checkpoint:** September 25, 2026  
> **Repository:** `Dhirajchowdhury/FinOS`  

---

## 1. Current Project Status

FinOS is an enterprise-grade multi-agent financial intelligence system. The repository is currently in a **transitional architecture state**, successfully bridging a proven underlying financial specialist engine (`tradingagents/`) with a standardized 10-domain-agent architecture (`finos/core/agents/`).

### Key Highlights
- **Proven Engine Layer (`tradingagents/`)**: Provides active, fully-tested dataflows (Yahoo Finance, SEC EDGAR, FRED, Reddit, StockTwits, Polymarket), debate nodes, memory logs, settlement scoring, and LangGraph workflow runtime.
- **FinOS Domain Agent Layer (`finos/core/agents/`)**: Standardized 10-agent domain contract interface built and verified for News, Macro, Risk, Portfolio, Investment, Report, Tax, Trading, Fraud, and Credit.
- **State & LLM Interoperability**: `FinosState` <-> `AgentState` state bridge (`finos/core/state/bridge.py`) and universal provider client adapter (`finos/core/llm/factory.py`) actively connect both layers.
- **Test Verification**: 100% test pass rate across **1,031 passing unit & integration tests** (5 skipped due to optional env/platform conditions), including **30 dedicated FinOS domain agent tests**.

---

## 2. Implementation Checkpoint

This document records the exact state of the repository as of **September 25, 2026**. All statements in this audit are grounded in empirical inspection of source code and test execution results.

---

## 3. Current Architecture

The codebase maintains a clean transitional separation:

```
FinOS Domain Agents (finos/core/agents/)
    ├── News Agent (active)
    ├── Macro Economy Agent (active)
    ├── Risk Agent (adapted)
    ├── Portfolio Agent (adapted)
    ├── Investment Agent (active)
    ├── Report Agent (adapted)
    ├── Tax Agent (active)
    ├── Trading Agent (adapted - proposal layer)
    ├── Fraud Agent (active - rule-based)
    └── Credit Agent (active - ratio heuristic)
           │
           ▼
FinOS Core Interoperability (finos/core/)
    ├── State Bridge (finos/core/state/bridge.py)
    └── LLM Adapter (finos/core/llm/factory.py)
           │
           ▼
Underlying Specialist Engine (tradingagents/)
    ├── Dataflows (Yahoo, SEC EDGAR, FRED, Polymarket, Reddit, StockTwits)
    ├── Specialist Debators (Aggressive, Conservative, Neutral, Bull, Bear)
    ├── Managers (Research, Portfolio, Trader)
    ├── Graph Runtime (tradingagents/graph/trading_graph.py)
    ├── Memory & Settlement (trading_memory.md, settlement.py)
    └── Backtesting & Reporting (backtest.py, reporting.py)
```

---

## 4. FinOS 10-Agent Implementation Status

### Summary Table

| Agent | Status | File Location | Data Sources | LLM Usage | Existing Code Reused | Tests | Key Limitations |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **News Agent** | `ACTIVE` | `finos/core/agents/news.py` | Vendor Router (`get_news`, `get_global_news`) | Optional | `tradingagents.dataflows.router` | Passed | Rule-based keyword sentiment; no vector embeddings |
| **Macro Agent** | `ACTIVE` | `finos/core/agents/macro.py` | FRED API (`get_macro_data`) | Optional | `tradingagents.dataflows.vendors.fred` | Passed | Requires `FRED_API_KEY`; static yield curve threshold |
| **Risk Agent** | `ADAPTED` | `finos/core/agents/risk.py` | Context / State | Active (Debators) | `tradingagents.agents.risk_mgmt` | Passed | Debate synthesis fallback uses keyword heuristic |
| **Portfolio Agent** | `ADAPTED` | `finos/core/agents/portfolio.py` | Context / Holdings | Active (PM Node) | `tradingagents.agents.managers` | Passed | Proposal & sizing caps only; no broker execution |
| **Investment Agent** | `ACTIVE` | `finos/core/agents/investment.py` | Upstream Assessments | Active (Bull/Bear) | `tradingagents.agents.researchers` | Passed | Thesis synthesis relies on LLM debate nodes |
| **Trading Agent** | `ADAPTED` | `finos/core/agents/trading.py` | Context / Plan | Active (Trader) | `tradingagents.agents.trader` | Passed | **Proposal layer only**; broker execution un-implemented |
| **Report Agent** | `ADAPTED` | `finos/core/agents/report.py` | All Agent Outputs | N/A | `tradingagents.reporting` | Passed | Markdown tree export requires local write path |
| **Credit Agent** | `ACTIVE` | `finos/core/agents/credit.py` | Fundamentals Vendor / Context | N/A | `tradingagents.dataflows.router` | Passed | Default probability is **heuristic**, not statistical ML |
| **Tax Agent** | `ACTIVE` | `finos/core/agents/tax.py` | Context / Transactions | N/A | Deterministic Engine | Passed | Rules for US/UK/Global; no complex tax treaties |
| **Fraud Agent** | `ACTIVE` | `finos/core/agents/fraud.py` | Context / Filings / Txs | N/A | Deterministic Engine | Passed | Heuristic rules (\$9.9k structuring); **no GNN/Neo4j** |

---

### Detailed Agent Specifications

#### 1. News Agent (`finos/core/agents/news.py`)
- **Status**: `ACTIVE`
- **Contract**: Accepts `FinOSAgentInput` (`entity_id`, `as_of_date`, `context`), returns `FinOSAgentOutput` containing structured `NewsAssessment`.
- **Data Integration**: Invokes `route_to_vendor("get_news")` and `route_to_vendor("get_global_news")` from `tradingagents.dataflows.router`.
- **Processing Logic**: Evaluates article titles and summaries using rule-based sentiment scoring (positive/negative financial lexicon matching). Extracts headline events, opportunities, and downside risk factors.
- **Confidence Scoring**: 0.80 for >= 3 retrieved articles; 0.65 for partial data; 0.30 for zero coverage.
- **Error Handling**: Graceful fallback on missing/empty entity ID or vendor API failure; error details captured in evidence logs without raising unhandled exceptions.

#### 2. Macro Economy Agent (`finos/core/agents/macro.py`)
- **Status**: `ACTIVE`
- **Contract**: Accepts `FinOSAgentInput`, returns `FinOSAgentOutput` containing `MacroAssessment`.
- **Data Integration**: Integrates directly with FRED vendor (`get_macro_data`) for CPI inflation, Federal Funds Rate, Unemployment Rate, 10Y-2Y Treasury Yield Spread, and Real GDP growth.
- **Deterministic Logic**: Performs yield curve slope check (negative spread triggers inversion risk flag and shifts economic regime to *"Late Cycle / Recession Caution"*).
- **Confidence Scoring**: Dynamic score `min(0.95, max(0.40, 0.20 + valid_indicators * 0.15))`.
- **Error Handling**: Catches `FredNotConfiguredError` and vendor connection notes gracefully.

#### 3. Risk Agent (`finos/core/agents/risk.py`)
- **Status**: `ADAPTED`
- **Contract**: Accepts `FinOSAgentInput`, returns `FinOSAgentOutput` containing `RiskAssessment`.
- **Specialist Reuse**: Instantiates and delegates to `create_aggressive_debator`, `create_conservative_debator`, and `create_neutral_debator` from `tradingagents.agents.risk_mgmt`.
- **Deterministic Synthesis**: Parses debate transcripts for volatility, drawdown, and concentration signals to assign overall Risk Levels (*Low, Medium, High, Critical*) and specify concrete risk mitigation strategies.
- **Confidence Scoring**: 0.82 when full debate history is synthesized; 0.70 baseline.

#### 4. Portfolio Agent (`finos/core/agents/portfolio.py`)
- **Status**: `ADAPTED`
- **Contract**: Accepts `FinOSAgentInput`, returns `FinOSAgentOutput` containing `PortfolioAssessment`.
- **Specialist Reuse**: Adapts `create_portfolio_manager` from `tradingagents.agents.managers`.
- **Holdings Analysis**: Evaluates current portfolio holdings and cash balance. Detects concentration risks (>10% position weight) and enforces position sizing caps (7.5% max for Buy/Overweight; 4.0% if concentrated; 0% for Underweight/Sell).
- **Confidence Scoring**: 0.85 with holdings/context supplied; 0.72 default.

#### 5. Investment Agent (`finos/core/agents/investment.py`)
- **Status**: `ACTIVE`
- **Contract**: Accepts `FinOSAgentInput`, returns `FinOSAgentOutput` containing `InvestmentAssessment`.
- **Specialist Reuse**: Composes `create_bull_researcher`, `create_bear_researcher`, and `create_research_manager` from `tradingagents.agents.researchers`.
- **Synthesis Logic**: Weighs bull case growth potential against bear case valuation sensitivity to form a consolidated rating (*Buy, Overweight, Hold, Underweight, Sell*) and strategic thesis.
- **Confidence Scoring**: 0.82 for completed debate runs; 0.75 with investment plan; 0.60 baseline.

#### 6. Trading Agent (`finos/core/agents/trading.py`)
- **Status**: `ADAPTED` (**Trade Proposal Layer Only**)
- **Contract**: Accepts `FinOSAgentInput`, returns `FinOSAgentOutput` containing `TradingProposal`.
- **Specialist Reuse**: Adapts `create_trader` from `tradingagents.agents.trader`.
- **Proposal Generation**: Extracts proposed trading action (*Buy, Hold, Sell*), uses regex to parse entry price and stop-loss boundaries from plan text, and applies position sizing limits from the Portfolio Agent.
- **CRITICAL NOTE**: Broker execution, order routing, and live exchange integration are **NOT implemented**. This agent strictly outputs trade proposals.

#### 7. Report Agent (`finos/core/agents/report.py`)
- **Status**: `ADAPTED`
- **Contract**: Accepts `FinOSAgentInput`, returns `FinOSAgentOutput` containing `ReportAssessment`.
- **Reporting Engine Reuse**: Wraps `write_report_tree` from `tradingagents.reporting`.
- **Aggregation Logic**: Synthesizes structured findings across all domain agents into an executive summary, compiles key findings, tracks unresolved analytical questions, and exports Markdown report trees when a `save_path` is designated.
- **Confidence Scoring**: 0.92 when key findings are present; 0.70 baseline.

#### 8. Credit Agent (`finos/core/agents/credit.py`)
- **Status**: `ACTIVE`
- **Contract**: Accepts `FinOSAgentInput`, returns `FinOSAgentOutput` containing `CreditAssessment`.
- **Calculations**:
  - Debt Leverage Ratio = $\frac{\text{Total Debt}}{\text{EBITDA}}$
  - Interest Coverage = $\frac{\text{EBITDA}}{\text{Interest Expense}}$
  - Current Ratio = $\frac{\text{Current Assets}}{\text{Current Liabilities}}$
- **Deterministic Rating Buckets**:
  - Leverage $< 2.0\text{x} \implies$ **AA Rating**, 0.5% default prob, Strong balance sheet
  - Leverage $2.0\text{x} - 3.5\text{x} \implies$ **BBB Rating**, 1.5% default prob, Moderate balance sheet
  - Leverage $3.5\text{x} - 5.0\text{x} \implies$ **BB Rating**, 4.5% default prob, Weak balance sheet
  - Leverage $> 5.0\text{x} \implies$ **CCC Rating**, 15.0% default prob, Distressed balance sheet
- **CRITICAL NOTE**: Default probability is a **deterministic ratio heuristic**, not a calibrated statistical ML model (such as KMV Merton or logistic regression).

#### 9. Tax Agent (`finos/core/agents/tax.py`)
- **Status**: `ACTIVE`
- **Contract**: Accepts `FinOSAgentInput`, returns `FinOSAgentOutput` containing `TaxAssessment`.
- **Jurisdiction Rules**:
  - `US`: 365-day short-term threshold, 30% ST tax rate, 15% LT tax rate, 30-day wash-sale window.
  - `UK`: Flat 20% capital gains rate, 30-day wash-sale window.
  - `GLOBAL`: 365-day threshold, 25% ST rate, 15% LT rate.
- **Calculations**: Capital gains liability $\text{Proceeds} - \text{Cost Basis}$, holding period classification in days, and tax-loss harvesting opportunity identification on unrealized losses.
- **CRITICAL NOTE**: Implements explicit rules for US, UK, and Global defaults; does not claim universal global tax code coverage.

#### 10. Fraud Agent (`finos/core/agents/fraud.py`)
- **Status**: `ACTIVE`
- **Contract**: Accepts `FinOSAgentInput`, returns `FinOSAgentOutput` containing `FraudAssessment`.
- **Deterministic Rule Engine**:
  - Structuring Detection: Transactions between \$9,900 and \$9,999 (+0.25 anomaly points).
  - Round-Number Transactions: $\ge \$100,000$ divisible by \$10,000 (+0.15 points).
  - Duplicate Signatures: Identical amount and counterparty (+0.20 points).
  - Suspicious Counterparties/Jurisdictions: `OFFSHORE_SHELL_CY`, `PANAMA_SHELL`, `CAYMAN_UNVERIFIED`, `UNKNOWN_JURISDICTION`, or `SHELL` in name (+0.35 points).
  - High Velocity: $> 100$ transactions in observation window (+0.20 points).
  - Net Income / Cash Flow Divergence: Net income $> 0$ with Operating Cash Flow $\le 0$ (+0.40 points).
  - Accounts Receivable Ratio: Receivables $> 40\%$ of revenue (+0.20 points).
  - Risk Buckets: Low ($<0.20$), Medium ($0.20-0.39$), High ($0.40-0.69$), Critical ($\ge 0.70$).
- **CRITICAL NOTE**: Structuring rules are heuristic patterns. Graph Neural Networks (GNN), Neo4j, and GraphRAG are **NOT implemented**.

---

## 5. Agent Architecture & Layering

The FinOS domain agent contracts establish a clean inheritance hierarchy:

```python
FinOSAgentInput (Pydantic Model)
       │
       ▼
FinOSDomainAgent (Abstract Base Class in finos/core/agents/base.py)
  ├── analyze(input: FinOSAgentInput) -> FinOSAgentOutput
  └── aanalyze(input: FinOSAgentInput) -> FinOSAgentOutput (Async)
       │
       ▼
FinOSAgentOutput (Pydantic Model containing agent_name, entity_id, as_of_date, summary, findings, confidence, evidence, status)
```

### State Bridge (`finos/core/state/bridge.py`)
Provides seamless conversion between the underlying ticker-centric `AgentState` and the domain-neutral `FinosState`:
- `finos_state_from_agent_state(agent_state: dict) -> FinosState`
- `agent_state_from_finos_state(finos_state: dict) -> dict`

---

## 6. Data Layer

The underlying data infrastructure located in `tradingagents/dataflows/` includes the following production vendors:

| Data Vendor | File Location | Supported Capabilities | Access / Auth |
| :--- | :--- | :--- | :--- |
| **Yahoo Finance** | `dataflows/vendors/yahoo/` | Stock OHLCV prices, historical snapshots, stale bar guard | Public / Free |
| **SEC EDGAR** | `dataflows/vendors/sec_edgar.py` | 10-K & 10-Q corporate financial filings | Public (`SEC_EDGAR_USER_AGENT`) |
| **FRED** | `dataflows/vendors/fred.py` | Macroeconomic indicators (CPI, Rates, Yield Curve, GDP) | API Key (`FRED_API_KEY`) |
| **Alpha Vantage** | `dataflows/vendors/alpha_vantage/` | Technical indicators and company fundamentals | API Key (`ALPHA_VANTAGE_API_KEY`) |
| **Reddit** | `dataflows/vendors/reddit.py` | Retail investor sentiment scraping & post feeds | Public / Fallback |
| **StockTwits** | `dataflows/vendors/stocktwits.py` | Real-time sentiment streams and message volume | Public API |
| **Polymarket** | `dataflows/vendors/polymarket.py` | Event probability streams and prediction market data | Public API |

---

## 7. LLM Layer

The LLM abstraction in `tradingagents/llm_clients/` (exposed via `finos/core/llm/factory.py`) supports multi-provider factory instantiation:

- **Supported Providers**: OpenAI, Anthropic, Google Gemini, DeepSeek, Azure OpenAI, AWS Bedrock, OpenRouter, MiniMax, Ollama (local/remote).
- **Core Features**:
  - Unified `create_llm_client(provider, model, base_url, **kwargs)` factory.
  - Model catalog validation (`model_catalog.py`) and provider capabilities registry (`capabilities.py`).
  - Provider-specific reasoning effort parameters (`TRADINGAGENTS_OPENAI_REASONING_EFFORT`, `TRADINGAGENTS_GOOGLE_THINKING_LEVEL`, `TRADINGAGENTS_ANTHROPIC_EFFORT`).
  - Standardized retry budget and token cap enforcement.

---

## 8. State & Memory Infrastructure

- **`FinosState` (`finos/core/state/base.py`)**: Inherits from `langgraph.graph.MessagesState`. Replaces hardcoded ticker fields with domain-neutral attributes (`entity_id`, `entity_type`, `as_of_date`, `request`, `sender`, `artifacts`, `metadata`, `past_context`).
- **Persistence**: SQLite checkpointing via `langgraph-checkpoint-sqlite` and structured Markdown decision logs (`trading_memory.md`).
- **Memory Log (`tradingagents/decision_log.py`)**: Stores past analytical decisions, ratings, and realized alpha metrics for historical context retrieval.

---

## 9. Graph & Orchestration

- **Current Active Runtime**: `tradingagents/graph/trading_graph.py`
  - Fully working LangGraph state machine orchestrating Market, Social, News, and Fundamental analysts with Bull/Bear and Risk debate rounds.
- **Target FinOS Graph Engine**: `finos/core/graph/`
  - Directory structure and interfaces established (`builder.py`, `engine.py`, `router.py`, `execution_plan.py`).
  - `FinosGraphEngine.execute()` is in foundation state (raises `NotImplementedError` pending the upcoming graph orchestration milestone).

---

## 10. Backtesting & Point-in-Time Safety

- **Backtest Engine (`tradingagents/backtest.py`)**: Executes analysis grids across ticker/date matrices, comparing ratings against benchmark returns (e.g. SPY).
- **Lookahead Bias Protections**: `tradingagents/dataflows/date_window.py` enforces strict `as_of_date` filtering across SEC filings, FRED macro series, news articles, and price bars.

---

## 11. Testing & Verification Results

### Test Execution Summary (`.venv\Scripts\pytest.exe -q`)

- **Total Tests Executed**: 1,036
- **Passed**: **1,031**
- **Skipped**: **5**
- **Warnings**: 22
- **Subtests Passed**: 91
- **Execution Time**: 33.77 seconds

### FinOS Specific Test Suite (`tests/test_finos_*.py`)

- **Passed**: **30 / 30** (100% pass rate) across 9 test modules:
  1. `test_finos_agent_adapters.py` (3 passed)
  2. `test_finos_agent_contracts.py` (4 passed)
  3. `test_finos_credit_agent.py` (3 passed)
  4. `test_finos_fraud_agent.py` (3 passed)
  5. `test_finos_investment_agent.py` (3 passed)
  6. `test_finos_macro_agent.py` (3 passed)
  7. `test_finos_news_agent.py` (3 passed)
  8. `test_finos_state_bridge.py` (5 passed)
  9. `test_finos_tax_agent.py` (3 passed)

### Skipped Tests Breakdown

1. `tests/test_api_key_env.py:161` — Skipped (POSIX file mode check on Windows environment).
2. `tests/test_api_key_env.py:175` — Skipped (POSIX file mode check on Windows environment).
3. `tests/test_api_key_env.py:185` — Skipped (POSIX file mode check on Windows environment).
4. `tests/test_bedrock_provider.py:74` — Skipped (`langchain_aws` optional dependency not installed).
5. `tests/test_deepseek_reasoning.py:209` — Skipped (`DEEPSEEK_API_KEY` not configured for live API call).

---

## 12. Configuration & Deployment

- **Environment Namespace**: `TRADINGAGENTS_*` env variables configure runtime defaults (`.env.example`).
- **Dependencies (`pyproject.toml`)**: Python `>=3.10`, `langchain-core`, `langgraph`, `pandas`, `requests`, `rich`, `yfinance`, `stockstats`.
- **Deployment Status**: Package entry point `tradingagents = "cli.main:app"` active. Docker deployment files present (`Dockerfile`, `docker-compose.yml`).

---

## 13. Current File Structure

```
FINOS/
├── finos/
│   └── core/
│       ├── agents/
│       │   ├── __init__.py
│       │   ├── base.py
│       │   ├── credit.py
│       │   ├── fraud.py
│       │   ├── investment.py
│       │   ├── macro.py
│       │   ├── news.py
│       │   ├── portfolio.py
│       │   ├── report.py
│       │   ├── risk.py
│       │   ├── tax.py
│       │   └── trading.py
│       ├── data/
│       ├── graph/
│       │   ├── builder.py
│       │   ├── checkpointer.py
│       │   ├── engine.py
│       │   ├── execution_plan.py
│       │   ├── propagation.py
│       │   └── router.py
│       ├── llm/
│       │   ├── base_client.py
│       │   ├── capabilities.py
│       │   ├── factory.py
│       │   ├── model_catalog.py
│       │   ├── prompt_context.py
│       │   ├── structured.py
│       │   └── validators.py
│       ├── memory/
│       ├── schemas/
│       ├── state/
│       │   ├── base.py
│       │   └── bridge.py
│       └── tools/
├── tradingagents/
│   ├── agents/
│   ├── dataflows/
│   │   ├── vendors/
│   │   ├── config.py
│   │   ├── date_window.py
│   │   └── router.py
│   ├── graph/
│   │   ├── analyst_execution.py
│   │   ├── checkpointer.py
│   │   ├── settlement.py
│   │   └── trading_graph.py
│   ├── llm_clients/
│   ├── backtest.py
│   ├── decision_log.py
│   ├── portfolio.py
│   └── reporting.py
├── tests/ (86 test files)
├── .env.example
├── pyproject.toml
└── PROJECT_IMPLEMENTATION.md
```

---

## 14. Completed Work Log

- [x] **Baseline Cleanup & Repository Assessment**: Audited working `tradingagents` vs parallel `finos` foundations.
- [x] **Architecture Audit**: Documented core system architecture in `FINOS_ARCHITECTURE_AUDIT.md`.
- [x] **Milestone 1 (Agent Architecture Cleanup)**: Removed duplicate `finos/agents/` layer and consolidated domain contracts under `finos/core/agents/`.
- [x] **FinOS Agent Build Phase**: Fully implemented all 10 domain agents (`base.py`, `news.py`, `macro.py`, `investment.py`, `risk.py`, `portfolio.py`, `trading.py`, `report.py`, `tax.py`, `fraud.py`, `credit.py`).
- [x] **State & LLM Interoperability**: Implemented state bridge (`finos/core/state/bridge.py`) and universal LLM client factory (`finos/core/llm/factory.py`).
- [x] **Test Verification**: Expanded test suite with 30 dedicated FinOS domain agent unit tests (1,031 total tests passing).
- [x] **Implementation Documentation Audit**: Created authoritative `PROJECT_IMPLEMENTATION.md`.

---

## 15. Deferred / Future Work

| Component | Status | Target Phase / Milestone |
| :--- | :--- | :--- |
| **FinOS Graph Engine Orchestration** | `FOUNDATION ONLY` | Next Orchestration Milestone |
| **Decision Engine Integration** | `PLANNED` | Future Milestone |
| **Qdrant Vector Database** | `NOT IMPLEMENTED` | Vector Search Phase |
| **Neo4j Graph Database** | `NOT IMPLEMENTED` | Knowledge Graph Phase |
| **GraphRAG** | `NOT IMPLEMENTED` | Knowledge Graph Phase |
| **Kafka Event Streaming** | `NOT IMPLEMENTED` | Enterprise Infra Phase |
| **MCP Server Integration** | `NOT IMPLEMENTED` | External Tools Phase |
| **Fraud Graph Neural Network (GNN)** | `NOT IMPLEMENTED` | Advanced ML Phase |
| **Time-Series Forecasting Engine** | `NOT IMPLEMENTED` | Advanced Quantitative Phase |
| **FastAPI Web Backend** | `NOT IMPLEMENTED` | Web Application Phase |
| **Next.js Web Frontend** | `NOT IMPLEMENTED` | Web Application Phase |
| **Final Directory Reorganization (`backend/`)** | `DEFERRED` | Final Migration Milestone |

---

## 16. Known Limitations

1. **Trade Proposal Scope**: The Trading Agent produces transaction proposals with entry and stop-loss levels; it does not connect to live broker APIs or execute market orders.
2. **Heuristic Default Probability**: Credit Agent default probabilities are deterministic mappings based on leverage buckets rather than calibrated quantitative survival models.
3. **Rule-Based Fraud Detection**: Fraud Agent uses static transaction structuring (\$9.9k) and filing divergence rules; no GNN or graph link analysis is active.
4. **Tax Jurisdiction Scope**: Tax Agent covers US, UK, and Global capital gains defaults; tax treaties and local state tax codes are unmodeled.
5. **Graph Engine Wiring**: `finos/core/graph/engine.py` is in foundation state and currently delegates workflow execution to the underlying `tradingagents` runtime.

---

## 17. Next Recommended Technical Milestone

**FinOS Graph Orchestration & Workflow Engine Integration**  
*Recommended Focus*: Wire the 10 FinOS domain agents directly into `finos/core/graph/` using `FinosState`, enabling complete 10-agent DAG execution, conditional routing, and automated report tree generation.

*(Note: This milestone is recommended for future work and is NOT implemented in this documentation-only checkpoint.)*
