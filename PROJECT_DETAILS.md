# FinOS — Project Details & System Architecture Source of Truth

> **System Status**: Production-grade Financial Intelligence & Trading Framework (`v0.5.1`) evolving into **FinOS (Financial Intelligence Operating System)**.

---

## 1. Executive Summary & Vision

**FinOS** is a modular, multi-agent financial intelligence platform capable of deep analysis across financial markets, corporate fundamentals, macroeconomic indicators, portfolio risk, tax implications, creditworthiness, fraud signals, news catalysts, and social sentiment.

FinOS transforms standalone AI chatbots into a coordinated, evidence-backed decision support operating system built upon:
- Graph-based dynamic workflow orchestration (LangGraph).
- Strict point-in-time data integrity and SEC EDGAR historical restatement preservation.
- Provider-agnostic LLM abstraction (OpenAI, Gemini, Claude, Grok, DeepSeek, Qwen, GLM, MiniMax, Bedrock, Ollama, OpenAI-compatible).
- Memory-guided historical decision reflection and portfolio context integration.

---

## 2. System Architecture

```text
                               ┌─────────────────────────┐
                               │   User / CLI / API      │
                               └────────────┬────────────┘
                                            │
                                            ▼
                               ┌─────────────────────────┐
                               │   FinOS Core Router     │
                               │  (Intent & Task Router) │
                               └────────────┬────────────┘
                                            │
           ┌────────────────────────────────┼────────────────────────────────┐
           │                                │                                │
           ▼                                ▼                                ▼
  Market Analyst                    News Analyst                   Fundamentals Analyst
  (Price, Technicals)               (Events, Macro)                (SEC EDGAR, Financials)
           │                                │                                │
           └────────────────────────────────┼────────────────────────────────┘
                                            │
                                            ▼
                               ┌─────────────────────────┐
                               │   Sentiment Analyst     │
                               │  (StockTwits, Reddit)   │
                               └────────────┬────────────┘
                                            │
                                            ▼
                               ┌─────────────────────────┐
                               │  Debate / Research Team │
                               │   (Bull vs Bear Agents) │
                               └────────────┬────────────┘
                                            │
                                            ▼
                               ┌─────────────────────────┐
                               │ Risk & Portfolio Team   │
                               │ (Aggressive/Con/Neut)   │
                               └────────────┬────────────┘
                                            │
                                            ▼
                               ┌─────────────────────────┐
                               │  Trader & Report Agent  │
                               │   (Structured Output)   │
                               └─────────────────────────┘
```

---

## 3. Configuration & Infrastructure

FinOS features a unified configuration resolution layer (`finos/core/config.py`) supporting the `FINOS_*` environment variable namespace with backwards-compatible fallback to `TRADINGAGENTS_*`.

### Core Settings
- `FINOS_HOME`: Default root (`~/.finos`).
- `FINOS_LLM_PROVIDER`: Primary LLM backend (default: `openai`).
- `FINOS_DEEP_THINK_LLM`: Complex reasoning model (default: `gpt-4o`).
- `FINOS_QUICK_THINK_LLM`: Fast execution model (default: `gpt-4o-mini`).
- `FINOS_CACHE_DIR`: SQLite checkpoints directory (`~/.finos/cache`).
- `FINOS_MEMORY_LOG_PATH`: Persistent markdown decision memory (`~/.finos/memory/finos_memory.md`).

---

## 4. Agent Ecosystem & Implementation Status

| Agent Domain | Primary Responsibility | Reused Baseline | Implementation Status |
| :--- | :--- | :--- | :--- |
| **Market / Technical Agent** | Price action, technical indicators (RSI, MACD), trend & volume analysis | `tradingagents/agents/analysts/market_analyst.py` | **Implemented** |
| **Fundamentals Agent** | Income statements, balance sheets, cash flow, SEC EDGAR filing date auditing | `tradingagents/agents/analysts/fundamentals_analyst.py` | **Implemented** |
| **News Agent** | Company news, global macro developments, sector catalysts | `tradingagents/agents/analysts/news_analyst.py` | **Implemented** |
| **Sentiment Agent** | Social chatter, Reddit, StockTwits, Jev post-screening filter | `tradingagents/agents/analysts/sentiment_analyst.py` | **Implemented** |
| **Bull / Bear Researchers** | Thesis generation, structured debate, counter-argument evaluation | `tradingagents/agents/researchers/` | **Implemented** |
| **Risk / Debate Team** | Aggressive, Conservative, Neutral risk evaluation & strategy balance | `tradingagents/agents/risk_mgmt/` | **Implemented** |
| **Portfolio Manager** | Allocation, risk tolerance, portfolio context adjustment | `tradingagents/agents/managers/portfolio_manager.py` | **Implemented** |
| **Trader Agent** | Trade recommendation, price-grounded entry/exit signal formulation | `tradingagents/agents/trader/trader.py` | **Implemented** |
| **Investment Agent** | Macro synthesis & high-level allocation advice across asset classes | `finos/core/` | **In Progress** |
| **Macro Economy Agent** | Treasury yields, inflation, CPI/PCE, unemployment, Fed monetary policy | FRED Dataflow / `finos/core` | **In Progress** |
| **Tax Agent** | Capital gains, dividend taxation, tax-loss harvesting, holding periods | - | **Planned** |
| **Credit Agent** | Obligor risk, debt metrics, leverage, creditworthiness analysis | - | **Planned** |
| **Fraud Agent** | Financial anomaly detection, misconduct risk indicators | - | **Planned** |
| **Report Agent** | Multi-agent structured synthesis, uncertainty breakdown, chart generation | `tradingagents/reporting.py` | **In Progress** |

---

## 5. Core Data Vendors & Integrations

- **Yahoo Finance (`yfinance`)**: Price histories, technical stats, baseline profile & key metrics.
- **SEC EDGAR (`sec_edgar`)**: Point-in-time filing dates, original filing figures prior to historical restatements.
- **FRED (`fred`)**: Federal Reserve Economic Data for macro indicators (CPI, Federal Funds Rate, Unemployment).
- **Polymarket (`polymarket`)**: Prediction market probabilities and event outcomes.
- **TypeSafe Jev (`typesafe`)**: Machine learning post-screening filter for social sentiment relevance and stance categorization.

---

## 6. Point-in-Time Integrity & Backtesting

1. **Strict Date-Window Safeguards**: All data vendors receive the `as_of_date` parameter to prevent future look-ahead bias during historical evaluations.
2. **SEC EDGAR Filing Date Matching**: Historical queries use the date statements were *filed*, not the fiscal period end, preserving true historical point-in-time state.
3. **Backtesting Framework (`tradingagents/backtest.py`)**: Supports grid iteration across tickers and dates with automated benchmark-relative alpha scoring and non-destructive memory isolation.

---

## 7. LLM Provider Compatibility

FinOS supports 11+ LLM providers via a unified abstraction layer (`finos/core/llm/`):
- **OpenAI**: GPT-4o, GPT-4o-mini, GPT-6 Sol/Luna.
- **Google**: Gemini 2.5/3.x models via `google-genai`.
- **Anthropic**: Claude 3.5/3.7/4.x models with configurable reasoning effort.
- **xAI**: Grok family models.
- **DeepSeek**: DeepSeek-R1 / V3 models.
- **Qwen (DashScope)**: International & China regional endpoints.
- **GLM (Zhipu AI)**: International & China regional endpoints.
- **MiniMax**: Global & China endpoints.
- **AWS Bedrock**: Claude / Titan enterprise deployments.
- **Ollama / Local**: Self-hosted open models (Llama 3, Qwen 2.5).
- **OpenAI-Compatible**: Any standard API endpoint (vLLM, LM Studio, TGI).

---

## 8. Development & Maintenance Guidelines

- **Reuse Before Rebuild**: Always inspect `tradingagents/` and `finos/core/` before implementing new tools or agents.
- **Verification First**: Run pytest via `uv run pytest` to ensure zero regressions before committing.
- **Documentation Rules**:
  - Keep `README.md` updated for public installation & usage.
  - Maintain `PROJECT_DETAILS.md` as the internal technical source of truth.
  - Maintain `MASTER_PROMPT.md` for AI engineer operating guidelines.
