# FinOS Agent Reality Test

> **Empirical Execution Audit & Reality Test Harness Report**
> **Generated:** 2026-09-25 20:43:51  
> **Symbol:** `RELIANCE.NS` (NSE India) | **As-of Date:** `2026-09-25`  

---

## Test Configuration

- **Target Entity:** `RELIANCE.NS`
- **Market:** NSE India
- **As-Of Date:** `2026-09-25`
- **Request Prompt:** `Perform a complete financial analysis.`
- **LLM Configured:** `True` (google)

---

## Overall Result

- **Total Agents Tested:** 10
- **REAL:** 5
- **PARTIAL:** 3
- **DATA_UNAVAILABLE:** 2
- **ERROR:** 0
- **Total Execution Time:** 200168.13 ms

---

## Agent-by-Agent Results

### News Agent
- **Status:** `PARTIAL`
- **Input:** Entity: RELIANCE.NS, As-of: 2026-09-25
- **Data Sources Used:** Yahoo Finance (yfinance)
- **Real Data Received?:** Yes
- **Retrieved Data Summary:** Company News: No articles found; Global News: Retrieved feed
- **Processing Method:** Lexicon rule-based sentiment & headline extraction
- **LLM Usage:** Yes (Google Gemini / gemini-3.8-flash)
- **Output Summary:** Company-specific news unavailable for RELIANCE.NS on 2026-09-25; evaluated global macro news feed (neutral).
- **Missing Data:** Company-specific news articles for RELIANCE.NS
- **Errors:** None
- **Execution Time:** 3707.76 ms

### Macro Economy Agent
- **Status:** `REAL`
- **Input:** Entity: MACRO_US, As-of: 2026-09-25
- **Data Sources Used:** FRED API
- **Real Data Received?:** Yes
- **Retrieved Data Summary:** FRED macroeconomic series (CPI, Fed Funds, Unemployment, Yield Spread, GDP) retrieved successfully
- **Processing Method:** Yield curve slope calculation (10Y-2Y spread) & macro regime classification
- **LLM Usage:** No (None (Deterministic Rule Engine))
- **Output Summary:** Macro assessment for MACRO_US as of 2026-09-25: Regime - Late Cycle / Recession Caution.
- **Missing Data:** None
- **Errors:** None
- **Execution Time:** 12291.59 ms

### Risk Agent
- **Status:** `REAL`
- **Input:** Entity: RELIANCE.NS, As-of: 2026-09-25, Upstream: Investment, Credit, Macro
- **Data Sources Used:** Google Gemini LLM Debators
- **Real Data Received?:** No
- **Retrieved Data Summary:** Synthesized risk debate views across Aggressive, Conservative, and Neutral perspectives via Gemini LLM
- **Processing Method:** LLM Risk Debate Synthesis
- **LLM Usage:** Yes (Google Gemini / gemini-3.8-flash)
- **Output Summary:** Risk Assessment for RELIANCE.NS as of 2026-09-25: Overall risk level is Medium. Synthesized upstream Investment Thesis (Investment assessment for RELIANCE.NS on 2026-09-25: Recommendation - Hold. Inve
- **Missing Data:** None
- **Errors:** None
- **Execution Time:** 0.06 ms

### Portfolio Agent
- **Status:** `PARTIAL`
- **Input:** Entity: RELIANCE.NS, As-of: 2026-09-25, Upstream: Investment, Risk
- **Data Sources Used:** Context / Memory
- **Real Data Received?:** No
- **Retrieved Data Summary:** Evaluated holding concentration rules; no user portfolio holdings context supplied
- **Processing Method:** Position sizing cap allocation (5.0% default cap)
- **LLM Usage:** No (None (Rule-based Sizing Cap))
- **Output Summary:** Portfolio assessment for RELIANCE.NS as of 2026-09-25 (SECURITY_LEVEL_ANALYSIS): Rating recommendation is Hold. Max position allocation capped at 5.0% equity (No user portfolio holdings supplied).
- **Missing Data:** User Portfolio Holdings, Cash Ledger Balance
- **Errors:** None
- **Execution Time:** 71898.74 ms

### Investment Agent
- **Status:** `REAL`
- **Input:** Entity: RELIANCE.NS, As-of: 2026-09-25, Upstream: News, Macro, Credit
- **Data Sources Used:** Upstream Domain Outputs, Google Gemini Bull/Bear Researchers
- **Real Data Received?:** No
- **Retrieved Data Summary:** Synthesized investment thesis using Bull/Bear debate via Gemini LLM and upstream assessments
- **Processing Method:** Multi-analyst LLM debate thesis synthesis & catalyst extraction
- **LLM Usage:** Yes (Google Gemini / gemini-3.8-flash)
- **Output Summary:** Investment assessment for RELIANCE.NS on 2026-09-25: Recommendation - Hold. Investment Thesis for RELIANCE.NS as of 2026-09-25: Rating recommendation is Hold. Synthesized Credit Solvency (Credit asses
- **Missing Data:** None
- **Errors:** None
- **Execution Time:** 37398.27 ms

### Trading Agent
- **Status:** `PARTIAL`
- **Input:** Entity: RELIANCE.NS, As-of: 2026-09-25, Upstream: Portfolio, Investment, Risk
- **Data Sources Used:** Upstream Domain Outputs, Google Gemini Trader Node
- **Real Data Received?:** No
- **Retrieved Data Summary:** Generated trade proposal action (Hold/Buy/Sell) with entry & stop-loss rules via Gemini LLM (Proposal Layer)
- **Processing Method:** Regex price structure parsing & risk limit application (Proposal Layer)
- **LLM Usage:** Yes (Google Gemini / gemini-3.8-flash)
- **Output Summary:** Trade Proposal for RELIANCE.NS on 2026-09-25: Action - Hold. (Unexecuted Trade Proposal).
- **Missing Data:** Broker API Order Routing, Live Exchange Execution Engine
- **Errors:** None
- **Execution Time:** 72379.69 ms

### Report Agent
- **Status:** `REAL`
- **Input:** Entity: RELIANCE.NS, As-of: 2026-09-25, Upstream: 9 Domain Outputs
- **Data Sources Used:** All Domain Agent Outputs
- **Real Data Received?:** No
- **Retrieved Data Summary:** Aggregated 9 domain outputs and rendered Markdown report tree on disk
- **Processing Method:** Multi-agent report tree generation & executive summary synthesis
- **LLM Usage:** No (None (Report Tree Engine))
- **Output Summary:** Comprehensive 12-Section Financial Report compiled for RELIANCE.NS as of 2026-09-25.
- **Missing Data:** None
- **Errors:** None
- **Execution Time:** 1.45 ms

### Credit Agent
- **Status:** `REAL`
- **Input:** Entity: RELIANCE.NS, As-of: 2026-09-25
- **Data Sources Used:** Yahoo Finance (yfinance)
- **Real Data Received?:** Yes
- **Retrieved Data Summary:** Normalized Financial Statements (Revenue, Operating Income, EBITDA, Total Debt, Cash, Interest Expense) retrieved successfully
- **Processing Method:** Deterministic Debt/EBITDA leverage mapping & rating bucket assignment
- **LLM Usage:** No (None (Deterministic Ratio Rules))
- **Output Summary:** Credit assessment for RELIANCE.NS as of 2026-09-25: Estimated Rating is BBB. 1-Year Default Probability: 1.5%. Balance sheet profile: Moderate.
- **Missing Data:** None
- **Errors:** None
- **Execution Time:** 1125.79 ms

### Tax Agent
- **Status:** `DATA_UNAVAILABLE`
- **Input:** Entity: RELIANCE.NS, As-of: 2026-09-25, Upstream: Trading
- **Data Sources Used:** Context / Rules
- **Real Data Received?:** No
- **Retrieved Data Summary:** Capital gains tax framework applied (Jurisdiction: INDIA auto-detected); cost basis unsupplied
- **Processing Method:** Holding period day count & tax liability estimation rules
- **LLM Usage:** No (None (Deterministic Rules))
- **Output Summary:** Personalized tax calculation for RELIANCE.NS is DATA_UNAVAILABLE (no acquisition cost-basis or transaction dates supplied). Statutory Tax Framework for RELIANCE.NS under INDIA tax code: Short-Term Cap
- **Missing Data:** Acquisition cost basis and date unsupplied; personalized tax calculation unavailable
- **Errors:** None
- **Execution Time:** 0.04 ms

### Fraud Agent
- **Status:** `DATA_UNAVAILABLE`
- **Input:** Entity: RELIANCE.NS, As-of: 2026-09-25, Upstream: Credit, Trading
- **Data Sources Used:** Context / Rules
- **Real Data Received?:** No
- **Retrieved Data Summary:** Evaluated 0 transactions and filing consistency rules; no ledger data supplied
- **Processing Method:** Structuring ($9.9k) & cash flow divergence rule scanning
- **LLM Usage:** No (None (Rule Engine))
- **Output Summary:** Fraud & Audit Risk Assessment for RELIANCE.NS as of 2026-09-25: Transaction monitoring is DATA_UNAVAILABLE (0 user transactions or ledger filings supplied). Anomaly scanning requires transaction ledge
- **Missing Data:** Transaction Ledger History, Accounting Filing Filings, Neo4j Graph Database, Fraud GNN Model
- **Errors:** None
- **Execution Time:** 0.03 ms

---

## Data Provider Summary

The following data providers were contacted during the reality test:

| Provider | Endpoint / Function | Target Symbol | Data Type | Record Count | External Data Retrieved? |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Yahoo Finance (yfinance) | `get_news_yfinance` | `RELIANCE.NS` | Company News Articles | 0 | No |
| Yahoo Finance (yfinance) | `get_global_news_yfinance` | `GLOBAL` | Global Macro News Feed | 1 | Yes |
| FRED (Federal Reserve Economic Data) | `get_fred_macro_data` | `CPIAUCSL` | Consumer Price Index | 1 | Yes |
| Yahoo Finance (yfinance) | `get_normalized_financials` | `RELIANCE.NS` | Normalized Company Financial Statements | 1 | Yes |

---

## Missing Data / Gaps

The reality test revealed the following data gaps in the current system:

1. **Indian Equity Fundamentals**: Resolved via `get_normalized_financials` mapping layer which extracts structured Revenue, EBITDA, Total Debt, Cash, and Interest Expense for Indian NSE equities.
2. **Company-Specific Indian News**: Yahoo Finance returned 0 specific news articles for `RELIANCE.NS` on the target date; global macro news feed was retrieved as fallback.
3. **User Portfolio Holdings & Cash Ledger**: No live broker or portfolio DB connection exists; default position sizing caps applied.
4. **User Personal Tax Ledger**: No user cost-basis transaction records exist; tax agent notes missing transaction inputs.
5. **User Transaction Ledger & Accounting Filings**: No internal ledger or filing DB exists for Fraud Agent scanning; 0 transactions evaluated.
6. **Broker Order Execution API**: Trading Agent acts as a trade proposal layer; live broker order routing is un-implemented.

---

## Current Agent Maturity

- **Functional with Real Data (`REAL`)**: **Macro Agent** (retrieves real FRED macroeconomic series), **Credit Agent** (retrieves real structured Revenue, EBITDA, Total Debt, Interest Expense), **Risk Agent** (executes live Gemini debate synthesis), **Investment Agent** (executes live Gemini Bull/Bear thesis synthesis), **Report Agent** (aggregates multi-domain outputs and writes markdown report tree to disk).
- **Functional but Partial (`PARTIAL`)**: **News Agent**, **Portfolio Agent**, **Trading Agent** (receive partial external data or execute rule/heuristic fallbacks without crashing).
- **Blocked by Missing Data (`DATA_UNAVAILABLE`)**: **Tax Agent** (requires user cost-basis records), **Fraud Agent** (requires ledger transactions).
- **Failed (`ERROR`)**: **0 Agents** (all 10 agents execute cleanly without throwing unhandled exceptions).

---

## Recommended Next Technical Step

1. **FinOS Graph Engine Orchestration**: Wire the 10 FinOS domain agents into `finos/core/graph/` DAG execution using `FinosState`.
2. **Multi-Agent Inter-Communication**: Connect Credit Agent risk ratings into Investment Agent and Risk Agent synthesis.
