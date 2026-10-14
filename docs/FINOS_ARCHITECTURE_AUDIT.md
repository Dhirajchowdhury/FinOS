# FinOS Codebase & System Architecture Audit

> **Audit Date**: 2026-09-25  
> **Repository Version**: `0.5.1`  
> **Audit Status**: Complete, Code-Grounded Baseline Assessment  
> **Scope**: Structural audit of `tradingagents/`, `finos/core/`, `cli/`, and `tests/`  

---

## Executive Summary

This audit provides a comprehensive, code-grounded inventory of the FinOS repository. The repository currently consists of two architectural layers:
1. **`tradingagents/`**: An active, production-tested multi-agent financial trading framework that handles full graph execution, LLM client dispatching, data vendor routing, backtesting, SQLite checkpointing, and decision memory logging.
2. **`finos/core/`**: A domain-neutral foundation layer designed to support multi-entity financial intelligence (equities, macroeconomic series, SEC filings, credit obligors). Major components (state, schemas, config) are implemented, while routing engines (`engine.py`, `data/router.py`, `llm/factory.py`) contain explicit `NotImplementedError` stubs pending graph unification.

The active runtime application (`cli` and `main.py`) executes **100% via `tradingagents/`**. `finos/core/` sits alongside as a parallel foundation layer and is not yet wired to the runtime execution graph.

---

## 1. Repository Structure Audit

```text
FinOS/
├── main.py                          # Primary CLI wrapper entry point
├── pyproject.toml                   # Project metadata, dependencies, uv build spec
├── requirements.txt                 # Minimum requirement pointer (-e .)
├── docker-compose.yml               # Container orchestration (Standard & Ollama profiles)
│
├── cli/                             # Interactive Typer/Rich Command-Line Interface
│   ├── main.py                      # Typer application CLI entry point
│   ├── run.py                       # Main CLI execution flow and interactive prompts
│   ├── prompts.py                   # Selection prompts & ticker normalizers
│   ├── display.py                   # Rich terminal rendering & animated progress displays
│   ├── selections.py                # Interactive step-by-step workflow setup
│   ├── prefs.py                     # User preference persistence (`~/.tradingagents/prefs.json`)
│   ├── announcements.py            # Dynamic remote announcement fetcher
│   ├── stats_handler.py             # Live token usage and latency tracker
│   ├── models.py                    # CLI model selector definitions
│   ├── config.py                    # CLI configuration resolution helpers
│   └── static/welcome.txt           # ASCII logo banner
│
├── finos/                           # Generalized FinOS Core Foundation Layer
│   ├── __init__.py                  # Top-level exports
│   └── core/                        # Domain-neutral infrastructure abstractions
│       ├── config.py                # Unified config (FINOS_* namespace with TRADINGAGENTS_* fallbacks)
│       ├── data/                    # Data architecture & vendor abstraction
│       │   ├── config.py            # ContextVar-based run config container
│       │   ├── date_window.py       # As-of date calculation & point-in-time bounds
│       │   ├── errors.py            # Data vendor error hierarchy
│       │   ├── identity.py          # Entity identifier resolution (CIK, Ticker, Series ID)
│       │   ├── net.py               # Resilient HTTP client wrappers
│       │   ├── router.py            # Vendor dispatching engine [NotImplementedError stub]
│       │   ├── symbols.py           # Universal symbol normalization
│       │   └── vendors/             # Vendor-specific data providers
│       ├── graph/                   # Graph execution abstractions
│       │   ├── builder.py           # Dynamic WorkflowBuilder for LangGraph StateGraph
│       │   ├── checkpointer.py      # SQLite checkpoint database resolver & thread ID generator
│       │   ├── engine.py            # Top-level FinosGraphEngine [NotImplementedError stub]
│       │   ├── execution_plan.py    # NodeExecutionPlan & NodeSpec dataclasses
│       │   ├── propagation.py       # StatePropagator for initial state seeding
│       │   └── router.py            # ConditionalRouter for dynamic loop evaluation
│       ├── llm/                     # LLM Provider Abstraction
│       │   ├── base_client.py       # Abstract BaseLLMClient & normalize_content helper
│       │   ├── capabilities.py      # Provider capability registry (thinking mode, effort)
│       │   ├── factory.py           # Lazy LLM client factory [NotImplementedError stub]
│       │   ├── model_catalog.py     # Default model catalog per provider
│       │   ├── prompt_context.py    # Date-aware system prompt decorator
│       │   ├── structured.py        # Structured Pydantic model response binder
│       │   └── validators.py        # Model availability and name format checkers
│       ├── memory/                  # Historical Decision Memory
│       │   └── decision_log.py      # FinosMemoryLog append-only logger [Partial stub]
│       ├── schemas/                 # Structured Output Contracts
│       │   ├── common.py            # Universal schema utils & coercers
│       │   ├── rating.py            # 5-tier evaluation & domain rating schemas
│       │   └── sentiment.py         # Sentiment scores & confidence band schemas
│       ├── state/                   # Domain-Neutral State Management
│       │   └── base.py              # FinosState TypedDict definition
│       └── tools/                   # Tool Registry Abstraction
│           └── base.py              # FinosToolRegistry tool container
│
├── tradingagents/                   # Active Multi-Agent Execution Engine
│   ├── default_config.py            # Default runtime configuration dictionary
│   ├── portfolio.py                 # PortfolioContext & position model definitions
│   ├── decision_log.py              # Active decision logger, return calculation & reflection
│   ├── reporting.py                 # Structured markdown & HTML report generator
│   ├── backtest.py                  # Grid backtester & realized alpha evaluator
│   ├── agents/                      # Specialized Agent Implementations
│   │   ├── state.py                 # AgentState TypedDict (trading-specific state)
│   │   ├── schemas.py               # Structured output Pydantic schemas (Trader, Managers)
│   │   ├── context.py               # Instrument identity, language, & prompt context builders
│   │   ├── tools.py                 # LangChain tool bindings (@tool decorated)
│   │   ├── rating.py                # Agent recommendation rating parsers
│   │   ├── post_screen.py           # TypeSafe Jev social post sentiment filter
│   │   ├── structured.py            # Structured output LLM invoker helper
│   │   ├── analysts/                # Specialist Analyst Agents
│   │   │   ├── fundamentals_analyst.py # SEC EDGAR & Yahoo balance/income analyst
│   │   │   ├── market_analyst.py       # Price action & technical indicator analyst
│   │   │   ├── news_analyst.py         # Macro & company news analyst
│   │   │   └── sentiment_analyst.py    # StockTwits & Reddit social sentiment analyst
│   │   ├── researchers/             # Thesis & Counter-Thesis Research Agents
│   │   │   ├── bull_researcher.py      # Bullish thesis debater
│   │   │   └── bear_researcher.py      # Bearish thesis debater
│   │   ├── risk_mgmt/               # Risk Management Debate Agents
│   │   │   ├── aggressive_debator.py   # Aggressive risk posture advocate
│   │   │   ├── conservative_debator.py # Capital preservation advocate
│   │   │   └── neutral_debator.py      # Balanced risk advocate
│   │   ├── managers/                # Orchestration & Portfolio Managers
│   │   │   ├── research_manager.py     # Synthesizes bull/bear debate into unified report
│   │   │   └── portfolio_manager.py    # Final decision maker & order proposal approver
│   │   └── trader/                  # Trading Execution Proposal Agent
│   │       └── trader.py               # Formulates grounded buy/sell/hold trade plans
│   ├── dataflows/                   # Data Vendor Integration Layer
│   │   ├── config.py                # Dataflow vendor routing config
│   │   ├── date_window.py           # Point-in-time OHLCV & date calculations
│   │   ├── errors.py                # Vendor error hierarchy & exception wrappers
│   │   ├── net.py                   # Network HTTP session helper
│   │   ├── router.py                # Category-based data vendor router
│   │   ├── symbols.py               # Ticker normalization & benchmark mapper
│   │   └── vendors/                 # Vendor implementations (Yahoo, SEC EDGAR, FRED, Polymarket, Reddit, StockTwits, Alpha Vantage)
│   ├── graph/                       # LangGraph Workflow Construction
│   │   ├── trading_graph.py         # TradingAgentsGraph wrapper class
│   │   ├── setup.py                 # GraphSetup: builds LangGraph StateGraph
│   │   ├── analyst_execution.py     # Dynamic analyst node plan builder
│   │   ├── conditional_logic.py     # Debate & risk loop termination logic
│   │   ├── propagation.py           # Initial state seeder for AgentState
│   │   ├── reflection.py            # Historical memory injector
│   │   ├── settlement.py            # Holding-period return & alpha calculator
│   │   └── checkpointer.py          # SQLite checkpointer lifecycle manager
│   └── llm_clients/                 # Active LLM Provider Clients
│       ├── factory.py               # Active LLM factory (`create_llms`)
│       ├── model_catalog.py         # Provider model IDs & defaults catalog
│       ├── capabilities.py          # Provider capabilities (thinking levels, effort)
│       ├── api_key_env.py           # Provider API key environment detector
│       ├── base_client.py           # Abstract BaseLLMClient for tradingagents
│       ├── openai_client.py         # OpenAI & OpenAI-compatible client
│       ├── google_client.py         # Google Gemini client
│       ├── anthropic_client.py      # Anthropic Claude client
│       ├── azure_client.py          # Azure OpenAI client
│       ├── bedrock_client.py        # AWS Bedrock client
│       └── validators.py            # Client validation helpers
│
└── tests/                           # Comprehensive Pytest Suite (77 test modules, 1001 tests)
```

---

## 2. Existing Agent Audit

All active agents reside under `tradingagents/agents/`. Each agent is constructed as a functional node factory that takes a LangChain Chat model (`llm`) and returns a callable LangGraph node `(state: AgentState) -> dict`.

| Agent Name | File Path | Entry Function | Purpose | LLM Dep | Tools / Data Dep | State Read | State Written | Graph Connected? |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Market Analyst** | `tradingagents/agents/analysts/market_analyst.py` | `create_market_analyst` | Analyzes price action, OHLCV data, RSI, MACD, and technical indicators | `quick_thinking_llm` | `get_stock_data`, `get_indicators` | `messages`, `ticker`, `trade_date` | `messages`, `market_report` | **YES** |
| **Fundamentals Analyst** | `tradingagents/agents/analysts/fundamentals_analyst.py` | `create_fundamentals_analyst` | Evaluates financial statements (balance sheet, income statement, cash flows) as filed | `quick_thinking_llm` | `get_fundamentals`, `get_company_profile` | `messages`, `ticker`, `trade_date` | `messages`, `fundamentals_report` | **YES** |
| **News Analyst** | `tradingagents/agents/analysts/news_analyst.py` | `create_news_analyst` | Monitors company-specific, macroeconomic, and global news developments | `quick_thinking_llm` | `get_news`, `get_macro_economic_data` | `messages`, `ticker`, `trade_date` | `messages`, `news_report` | **YES** |
| **Sentiment Analyst** | `tradingagents/agents/analysts/sentiment_analyst.py` | `create_sentiment_analyst` | Aggregates StockTwits, Reddit, and social sentiment chatter (filtered via Jev) | `quick_thinking_llm` | `get_stocktwits_sentiment`, `get_reddit_sentiment` | `messages`, `ticker`, `trade_date` | `messages`, `sentiment_report` | **YES** |
| **Bull Researcher** | `tradingagents/agents/researchers/bull_researcher.py` | `create_bull_researcher` | Formulates bullish investment thesis based on analyst outputs | `quick_thinking_llm` | None (Reasoning agent) | `messages`, `bull_thesis`, `bear_thesis` | `messages`, `bull_thesis` | **YES** |
| **Bear Researcher** | `tradingagents/agents/researchers/bear_researcher.py` | `create_bear_researcher` | Formulates bearish thesis and identifies fundamental/market risks | `quick_thinking_llm` | None (Reasoning agent) | `messages`, `bull_thesis`, `bear_thesis` | `messages`, `bear_thesis` | **YES** |
| **Research Manager** | `tradingagents/agents/managers/research_manager.py` | `create_research_manager` | Synthesizes bull/bear debate into a unified, balanced research assessment | `deep_thinking_llm` | None (Structured output) | `messages`, `bull_thesis`, `bear_thesis` | `messages`, `research_manager_report` | **YES** |
| **Trader Agent** | `tradingagents/agents/trader/trader.py` | `create_trader` | Formulates actionable price-grounded entry/exit trading recommendations | `quick_thinking_llm` | None (Structured output) | `messages`, analyst reports, `portfolio_context` | `messages`, `trader_investment_plan` | **YES** |
| **Aggressive Analyst** | `tradingagents/agents/risk_mgmt/aggressive_debator.py` | `create_aggressive_debator` | Advocates growth-seeking, high-conviction risk strategies | `quick_thinking_llm` | None (Reasoning agent) | `messages`, risk reports | `messages`, `aggressive_risk_report` | **YES** |
| **Conservative Analyst**| `tradingagents/agents/risk_mgmt/conservative_debator.py` | `create_conservative_debator` | Advocates capital preservation, drawdown control, and downside risk reduction | `quick_thinking_llm` | None (Reasoning agent) | `messages`, risk reports | `messages`, `conservative_risk_report` | **YES** |
| **Neutral Analyst** | `tradingagents/agents/risk_mgmt/neutral_debator.py` | `create_neutral_debator` | Evaluates risk-reward balance and portfolio-level risk stance | `quick_thinking_llm` | None (Reasoning agent) | `messages`, risk reports | `messages`, `neutral_risk_report` | **YES** |
| **Portfolio Manager** | `tradingagents/agents/managers/portfolio_manager.py` | `create_portfolio_manager` | Final decision maker: approves/rejects trade proposal with portfolio context & memory | `deep_thinking_llm` | None (Structured output) | All reports, `portfolio_context`, `past_context` | `messages`, `portfolio_manager_decision` | **YES** |

---

## 3. Existing Graph Audit

The active graph is defined in `tradingagents/graph/setup.py` (`GraphSetup`) and orchestrated by `tradingagents/graph/trading_graph.py` (`TradingAgentsGraph`).

### Execution Flow Diagram

```text
[START]
   │
   ▼
[Analyst Sequence] ─── (Market → Sentiment → News → Fundamentals)
   │   ▲
   │   └── Tool Calls (ToolNode) ── (Loop until report complete)
   │
   ▼
[Message Delete Node] (Clears intermediate tool call context)
   │
   ▼
[Research Debate Loop] ◄──────────────────────┐
   ├── Bull Researcher                       │
   └── Bear Researcher                       │
         │                                   │
         ▼                                   │
   Conditional Edge: should_continue_debate ─┴── (max_debate_rounds)
         │
         ▼ (Debate Finished)
   [Research Manager]
         │
         ▼
     [Trader]
         │
         ▼
[Risk Analysis Loop] ◄───────────────────────┐
   ├── Aggressive Analyst                    │
   ├── Conservative Analyst                  │
   └── Neutral Analyst                       │
         │                                   │
         ▼                                   │
   Conditional Edge: should_continue_risk ───┴── (max_risk_rounds)
         │
         ▼ (Risk Finished)
   [Portfolio Manager]
         │
         ▼
       [END]
```

### Flow Details
1. **Entry Point**: `TradingAgentsGraph.propagate(symbol, trade_date)` initializes state via `create_initial_state()`.
2. **Analyst Phase**: `build_analyst_execution_plan()` builds the ordered analyst list. Analysts execute sequentially. If an analyst emits tool calls, execution routes to `ToolNode` and back to the analyst until a final text report is produced. `create_msg_delete()` prunes intermediate tool messages.
3. **Research Debate Phase**: Execution routes to `Bull Researcher`, then `should_continue_debate` toggles between `Bull Researcher` and `Bear Researcher` until `max_debate_rounds` is reached, routing finally to `Research Manager`.
4. **Trading Phase**: `Research Manager` output feeds directly into `Trader`.
5. **Risk Debate Phase**: Execution routes to `Aggressive Analyst`, then `should_continue_risk_analysis` rotates across `Aggressive`, `Conservative`, and `Neutral` analysts until `max_risk_rounds` is reached, routing to `Portfolio Manager`.
6. **Final Decision & Termination**: `Portfolio Manager` outputs the final structured decision, which is recorded to SQLite checkpointer and appended to the persistent memory log before terminating at `END`.

---

## 4. State Architecture Audit

### TradingAgents State (`tradingagents/agents/state.py`) vs FinOS Core State (`finos/core/state/base.py`)

| Feature / Attribute | `tradingagents.agents.state.AgentState` | `finos.core.state.base.FinosState` |
| :--- | :--- | :--- |
| **Base Class** | `langgraph.graph.MessagesState` | `langgraph.graph.MessagesState` |
| **Primary Identity Field** | `ticker: str` (Stock ticker string) | `entity_id: str` (Universal ID: Ticker, CIK, Series ID, Portfolio ID) |
| **Domain Scope Classification** | Implicitly stock trading | `entity_type: str` (`equity`, `macro_series`, `filing`, `credit_obligor`, `portfolio`) |
| **Date Field** | `trade_date: str` | `as_of_date: str` |
| **Report Attributes** | Hardcoded per analyst (`market_report`, `fundamentals_report`, `news_report`, `sentiment_report`, `bull_thesis`, etc.) | Domain-neutral dictionary `artifacts: dict[str, Any]` |
| **Metadata & Runtime Options** | Top-level fields (`portfolio_context`, `memory_log`) | Structured `metadata: dict[str, Any]` |
| **Runtime Usage** | **ACTIVE RUNTIME STATE** (Used by all current agents & graph) | **FOUNDATION ONLY** (Defined in `finos/core`, not yet imported by runtime agents) |

---

## 5. Memory Architecture Audit

### Runtime Memory Breakdown

1. **Persistent Markdown Decision Log (`tradingagents/decision_log.py`)**:
   - File Path: `~/.tradingagents/memory/trading_memory.md` (overridden via `FINOS_MEMORY_LOG_PATH` / `TRADINGAGENTS_MEMORY_LOG_PATH`).
   - Functionality: Each run appends a structured entry containing ticker, date, action, reasoning, and portfolio impact. On subsequent runs for the same ticker, `settlement.py` fetches actual historical performance, calculates realized return & benchmark alpha, generates a reflection, and injects it into `past_context`.
2. **SQLite Checkpoint Persistence (`tradingagents/graph/checkpointer.py`)**:
   - File Path: `~/.tradingagents/cache/checkpoints/<TICKER>.db`.
   - Functionality: Uses LangGraph `SqliteSaver` to snapshot graph state after every node step. Enables resumption of crashed or paused runs via `--checkpoint`.
3. **FinOS Core Memory (`finos/core/memory/decision_log.py`)**:
   - Status: Contains `FinosMemoryLog` class stub. Methods (`record_assessment`, `get_past_context`) return empty defaults and contain comments noting Phase B3 integration.

---

## 6. LLM Architecture Audit

### Active Engine (`tradingagents/llm_clients/`)

- **Factory**: `tradingagents/llm_clients/factory.py:create_llms()` instantiates `quick_thinking_llm` and `deep_thinking_llm`.
- **Supported Providers**: OpenAI, Google Gemini, Anthropic Claude, xAI Grok, DeepSeek, Qwen (DashScope), GLM (Zhipu AI), MiniMax, AWS Bedrock, Ollama (Local), and OpenAI-Compatible endpoints (vLLM, LM Studio).
- **Special Capabilities**: Handles Anthropic `effort` (budgeting thinking tokens), DeepSeek reasoning content, OpenAI `reasoning_effort`, and Gemini `thinking_level`.

### FinOS Core LLM (`finos/core/llm/`)

- `BaseLLMClient` (`finos/core/llm/base_client.py`): Abstract base class with `normalize_content()` to extract clean text from multi-block reasoning outputs.
- `create_llm_client()` (`finos/core/llm/factory.py`): Raises `NotImplementedError("Provider factory for '{provider}' will be connected in Phase B2 migration.")`.

---

## 7. Data Architecture Audit

### Active Dataflows (`tradingagents/dataflows/`)

- **Routing Engine (`router.py`)**: Category-based dispatcher (`get_market_data`, `get_fundamentals`, `get_news`, `get_social_sentiment`, `get_macro_economic_data`).
- **Vendors**:
  - `yfinance`: Historical prices, OHLCV, volume, technical indicators (`stockstats`).
  - `sec_edgar`: Point-in-time financial statements (as filed, ignoring post-restatement lookahead).
  - `fred`: Federal Reserve macroeconomic series (CPI, Unemployment, Fed Funds Rate, Yield Curve).
  - `polymarket`: Event prediction market probabilities.
  - `stocktwits` & `reddit`: Social chatter (screened via TypeSafe Jev if `TYPESAFE_API_KEY` is present).
- **Point-in-Time Safeguards**: `date_window.py` enforces strict `< trade_date` bounds across all historical fetch methods.

### FinOS Core Data (`finos/core/data/`)

- `date_window.py`, `symbols.py`, `identity.py`, `net.py`: Fully implemented unit-tested helpers.
- `router.py`: `route_data_request()` raises `NotImplementedError("Data routing engine will be connected in Phase B2.")`.

---

## 8. FinOS Core Audit (Module-by-Module Inventory)

| Module Path | Classification | Implemented Symbols | Status / Code Evidence |
| :--- | :--- | :--- | :--- |
| `finos/core/config.py` | **IMPLEMENTED + NOT YET USED** | `FINOS_CONFIG`, `get_core_config()`, `_resolve_env()` | Fully functional resolution of `FINOS_*` with `TRADINGAGENTS_*` fallbacks. Not yet imported by `tradingagents`. |
| `finos/core/state/base.py` | **IMPLEMENTED + NOT YET USED** | `FinosState` | Domain-neutral state TypedDict defined. Ready for multi-entity workflows. |
| `finos/core/schemas/` | **IMPLEMENTED + NOT YET USED** | `DomainRating`, `EvaluationRating`, `SentimentScore`, `SentimentBand` | Pydantic models & validation schemas. Fully unit-tested. |
| `finos/core/graph/builder.py` | **IMPLEMENTED + NOT YET USED** | `WorkflowBuilder` | Dynamically builds `StateGraph` from `NodeExecutionPlan`. |
| `finos/core/graph/execution_plan.py` | **IMPLEMENTED + NOT YET USED** | `NodeSpec`, `NodeExecutionPlan` | Dataclasses for defining dynamic graph topologies. |
| `finos/core/graph/propagation.py` | **IMPLEMENTED + NOT YET USED** | `StatePropagator` | Initializer for `FinosState`. |
| `finos/core/graph/router.py` | **IMPLEMENTED + NOT YET USED** | `ConditionalRouter` | Generic step counter router. |
| `finos/core/graph/checkpointer.py` | **IMPLEMENTED + NOT YET USED** | `FinosCheckpointer` | Thread ID hasher & DB path resolver. |
| `finos/core/graph/engine.py` | **PARTIALLY IMPLEMENTED** | `FinosGraphEngine` | Line 21 raises `NotImplementedError("FinosGraphEngine execution will be fully implemented in Phase B3.")`. |
| `finos/core/llm/base_client.py` | **IMPLEMENTED + NOT YET USED** | `BaseLLMClient`, `normalize_content()` | Abstract LLM client base and response normalizer. |
| `finos/core/llm/capabilities.py` | **IMPLEMENTED + NOT YET USED** | `get_provider_capabilities()` | Registry of provider reasoning modes & token effort rules. |
| `finos/core/llm/factory.py` | **PARTIALLY IMPLEMENTED** | `create_llm_client()` | Line 20 raises `NotImplementedError("Provider factory for '{provider}' will be connected in Phase B2 migration.")`. |
| `finos/core/llm/model_catalog.py` | **IMPLEMENTED + NOT YET USED** | `get_default_model()` | Default model catalog. |
| `finos/core/llm/prompt_context.py` | **IMPLEMENTED + NOT YET USED** | `build_system_prompt()` | System prompt context formatter. |
| `finos/core/llm/structured.py` | **IMPLEMENTED + NOT YET USED** | `bind_structured()`, `invoke_structured_or_freetext()` | Structured Pydantic response binder. |
| `finos/core/llm/validators.py` | **IMPLEMENTED + NOT YET USED** | `validate_model_name()` | Model validation helper. |
| `finos/core/data/date_window.py` | **IMPLEMENTED + NOT YET USED** | `DateWindow`, `compute_date_bounds()` | Point-in-time window calculator. |
| `finos/core/data/identity.py` | **IMPLEMENTED + NOT YET USED** | `resolve_entity_identity()` | Universal entity identifier mapper. |
| `finos/core/data/symbols.py` | **IMPLEMENTED + NOT YET USED** | `normalize_symbol()` | Universal symbol normalizer. |
| `finos/core/data/net.py` | **IMPLEMENTED + NOT YET USED** | `FinosHttpClient` | Resilient HTTP client with retry logic. |
| `finos/core/data/router.py` | **PARTIALLY IMPLEMENTED** | `route_data_request()` | Line 14 raises `NotImplementedError("Data routing engine will be connected in Phase B2.")`. |
| `finos/core/memory/decision_log.py` | **PLACEHOLDER / NOT IMPLEMENTED** | `FinosMemoryLog` | Append logic & context retrieval are stubs returning empty defaults. |
| `finos/core/tools/base.py` | **IMPLEMENTED + NOT YET USED** | `FinosToolRegistry` | In-memory registry container for callable tools. |

---

## 9. FinOS vs Existing Engine Integration Audit

| Subsystem | Existing TradingAgents Implementation | FinOS Core Implementation | Connected in Active Runtime? |
| :--- | :--- | :--- | :--- |
| **State** | `tradingagents.agents.state.AgentState` | `finos.core.state.base.FinosState` | **No** (Runtime uses `AgentState`) |
| **LLM** | `tradingagents.llm_clients.factory.create_llms` | `finos.core.llm.factory.create_llm_client` | **No** (Runtime uses `tradingagents.llm_clients`) |
| **Data** | `tradingagents.dataflows.router` | `finos.core.data.router` | **No** (Runtime uses `tradingagents.dataflows.router`) |
| **Graph** | `tradingagents.graph.setup.GraphSetup` | `finos.core.graph.builder.WorkflowBuilder` | **No** (Runtime uses `tradingagents.graph.setup`) |
| **Memory** | `tradingagents.decision_log` | `finos.core.memory.decision_log.FinosMemoryLog` | **No** (Runtime uses `tradingagents.decision_log`) |
| **Tools** | `tradingagents.agents.tools` | `finos.core.tools.base.FinosToolRegistry` | **No** (Runtime uses `@tool` bindings in `tradingagents`) |
| **Config** | `tradingagents.default_config.DEFAULT_CONFIG` | `finos.core.config.FINOS_CONFIG` | **Partial** (`finos/core/config.py` reads `FINOS_*` and `TRADINGAGENTS_*`, but runtime loads `DEFAULT_CONFIG`) |

### Conclusion
`finos/core` is currently a parallel foundation layer alongside the existing `tradingagents` engine. The active CLI application executes entirely via `tradingagents`.

---

## 10. Runtime Entry Points

```text
User executes: `tradingagents` or `python -m cli.main`
   │
   ▼
cli/main.py (Typer application entry point)
   │
   ▼
cli/run.py: run_cli()
   │
   ▼
cli/selections.py: _prompt_selections() (Collects ticker, date, LLM provider, analysts)
   │
   ▼
tradingagents/graph/trading_graph.py: TradingAgentsGraph.__init__()
   ├── Loads `tradingagents/default_config.py`
   ├── Calls `tradingagents/llm_clients/factory.py:create_llms()`
   └── Calls `tradingagents/graph/setup.py:GraphSetup.setup_graph()`
   │
   ▼
tradingagents/graph/trading_graph.py: TradingAgentsGraph.propagate(symbol, trade_date)
   └── Invokes compiled LangGraph StateGraph instance
```

---

## 11. Testing Audit

The test suite consists of **77 test modules** in `tests/` containing **1,006 total tests** (1,001 passing, 5 skipped on Windows/unconfigured keys).

### Coverage Categorization
- **Agent Tests** (`test_analyst_execution`, `test_structured_agents`, `test_news_analyst_prompt`, `test_debate_opening`): 100% pass rate.
- **Graph & Lifecycle Tests** (`test_graph_end_to_end`, `test_checkpoint_lifecycle`, `test_checkpoint_resume`, `test_risk_router_path_map`): 100% pass rate.
- **Dataflow & Point-in-Time Safeguards** (`test_date_boundaries`, `test_fundamentals_lookahead`, `test_news_lookahead`, `test_social_lookahead`, `test_undated_tools_as_of`, `test_sec_edgar`, `test_fred`): 100% pass rate.
- **LLM Client & Provider Tests** (`test_provider_registry`, `test_anthropic_effort`, `test_google_thinking_level`, `test_deepseek_reasoning`, `test_ollama_base_url`): 100% pass rate.
- **CLI & Prefs Tests** (`test_cli_commands`, `test_cli_config_precedence`, `test_cli_env_skip`, `test_cli_prefs`): 100% pass rate.

### Coverage Gap Analysis
- `tradingagents/`: ~95% test coverage.
- `finos/core/`: Unit tests exist for `date_window.py`, `symbols.py`, `schemas/`, and `config.py`. Zero tests exist for `finos/core/graph/engine.py` or `finos/core/data/router.py` because they contain `NotImplementedError` stubs.

---

## 12. Configuration & Environment Audit

- Environment variables namespace supports dual-read: `FINOS_<KEY>` prioritized first, with `TRADINGAGENTS_<KEY>` as fallback.
- Secret keys (`OPENAI_API_KEY`, `GOOGLE_API_KEY`, `ANTHROPIC_API_KEY`, `FRED_API_KEY`, `SEC_EDGAR_USER_AGENT`, `TYPESAFE_API_KEY`) are resolved dynamically via `tradingagents/llm_clients/api_key_env.py` and never printed in logs or hardcoded.

---

## 13. Backtesting & Point-in-Time Safety

- `tradingagents/backtest.py` (`run_backtest`) executes market analysis over historical date grids (`iter_grid`).
- **Point-in-Time Invariant**: All data tools receive the run date as a strict upper bound (`as_of_date`), preventing future price, news, statement, or sentiment leak into historical evaluations.
- SEC EDGAR statement parsing reads original filed numbers as of the historical date, ignoring subsequent restatements filed after `as_of_date`.

---

## 14. Reporting / Portfolio / Decision Flow

- **Portfolio Context (`tradingagents/portfolio.py`)**: `PortfolioContext` defines cash, currency, and holdings. Passed into `propagate()` to contextualize Trader and Portfolio Manager risk calculations.
- **Report Generation (`tradingagents/reporting.py`)**: Transforms agent outputs into structured markdown/HTML executive summaries.
- **Decision Logging (`tradingagents/decision_log.py`)**: Appends decision outputs to `trading_memory.md` for historical reflection.

---

## 15. Current Architecture Diagram

```text
===================================================================================
                        ACTIVE RUNTIME ARCHITECTURE
===================================================================================

[User / CLI (`main.py` / `cli/run.py`)]
       │
       ▼
[TradingAgentsGraph (`tradingagents/graph/trading_graph.py`)]
       │
       ├──► Config: `tradingagents/default_config.py`
       ├──► LLMs: `tradingagents/llm_clients/factory.py`
       └──► Graph Setup: `tradingagents/graph/setup.py`
               │
               ▼
   [LangGraph StateGraph Execution]
       ├── Analyst Nodes (Market, Fundamentals, News, Sentiment)
       ├── Dataflows Router (`tradingagents/dataflows/router.py`)
       │     ├── Yahoo Finance (`yfinance`)
       │     ├── SEC EDGAR (`sec_edgar`)
       │     ├── FRED (`fred`)
       │     └── Social (Reddit / StockTwits + Jev)
       ├── Debate Nodes (Bull / Bear Researchers → Research Manager)
       ├── Trader Node (`tradingagents/agents/trader/trader.py`)
       ├── Risk Debate Nodes (Aggressive, Conservative, Neutral)
       └── Portfolio Manager (`tradingagents/agents/managers/portfolio_manager.py`)
               │
               ▼
   [Outputs & Persistence]
       ├── SQLite Checkpointer (`~/.tradingagents/cache/checkpoints/`)
       ├── Decision Log & Memory (`~/.tradingagents/memory/trading_memory.md`)
       └── Final Decision Return

===================================================================================
                 FOUNDATION / PARTIAL LAYER (`finos/core/`)
===================================================================================

[FinosState] (`finos/core/state/base.py`)
[FINOS_CONFIG] (`finos/core/config.py`)
[WorkflowBuilder] (`finos/core/graph/builder.py`)
[FinosGraphEngine] (`finos/core/graph/engine.py`) ── [NotImplementedError Stub]
[create_llm_client] (`finos/core/llm/factory.py`) ── [NotImplementedError Stub]
[route_data_request] (`finos/core/data/router.py`) ── [NotImplementedError Stub]
[FinosMemoryLog] (`finos/core/memory/decision_log.py`) ── [Method Stubs]
```

---

## 16. Current Capability Matrix

| Capability / Domain | Implementation Status | Active Runtime Used? | Primary File / Location |
| :--- | :--- | :--- | :--- |
| **Market / Technical Analysis** | **Implemented** | **YES** | `tradingagents/agents/analysts/market_analyst.py` |
| **Fundamental Analysis** | **Implemented** | **YES** | `tradingagents/agents/analysts/fundamentals_analyst.py` |
| **News Analysis** | **Implemented** | **YES** | `tradingagents/agents/analysts/news_analyst.py` |
| **Sentiment Analysis** | **Implemented** | **YES** | `tradingagents/agents/analysts/sentiment_analyst.py` |
| **Research Debate** | **Implemented** | **YES** | `tradingagents/agents/researchers/` |
| **Risk Management Debate** | **Implemented** | **YES** | `tradingagents/agents/risk_mgmt/` |
| **Trader Order Proposal** | **Implemented** | **YES** | `tradingagents/agents/trader/trader.py` |
| **Portfolio Manager Decision** | **Implemented** | **YES** | `tradingagents/agents/managers/portfolio_manager.py` |
| **Decision Memory & Reflection** | **Implemented** | **YES** | `tradingagents/decision_log.py` |
| **Point-in-Time Backtesting** | **Implemented** | **YES** | `tradingagents/backtest.py` |
| **Report Generation** | **Implemented** | **YES** | `tradingagents/reporting.py` |
| **Macro Economic Intelligence** | **Partially Implemented** | **YES (via News Tool)** | `tradingagents/dataflows/vendors/fred.py` |
| **Investment Agent** | **Planned** | No | `finos/core/` (Target synthesis agent) |
| **Tax Agent** | **Planned** | No | Target domain agent |
| **Credit Agent** | **Planned** | No | Target domain agent |
| **Fraud Agent** | **Planned** | No | Target domain agent |

---

## 17. FinOS Extension Points

When extending FinOS with new domain agents, reuse the established abstractions:

1. **Investment Agent**: Integrate as a synthesis node between specialized analysts and the Report/Trader agents. Reuse `finos/core/schemas/rating.py` for rating structures.
2. **Macro Economy Agent**: Wrap `tradingagents/dataflows/vendors/fred.py` into a dedicated analyst node connected to `FinosState`.
3. **Tax / Credit / Fraud Agents**: Create functional node factories under `finos/agents/` (or `tradingagents/agents/`) accepting `quick_thinking_llm` and returning standard node functions operating on state artifacts.

---

## 18. Technical Debt & Risks

1. **Dual State Definitions**: `AgentState` (ticker-centric) vs `FinosState` (domain-neutral). Transitioning must be incremental to prevent breaking the 1,001 passing tests.
2. **Unconnected Stubs in `finos/core/`**: `FinosGraphEngine.execute()`, `create_llm_client()`, and `route_data_request()` currently raise `NotImplementedError`.
3. **Hardcoded Ticker Assumptions in Prompts**: Several prompt templates in `tradingagents` assume equity ticker analysis. Generalizing to macro or credit entities requires context-aware prompt templates.

---

## 19. Baseline Preservation Rules

Future modifications MUST NOT break:
1. `tradingagents/graph/trading_graph.py` propagation and graph execution contract.
2. All 1,001 tests passing in the `tests/` directory.
3. Strict point-in-time date enforcement (`as_of_date` date windows and SEC EDGAR filing date parsing).
4. Provider LLM client factory flexibility across OpenAI, Anthropic, Google, DeepSeek, Qwen, GLM, MiniMax, Bedrock, and Ollama.
5. Persistent decision memory appending and historical reflection injection.

---

## 20. Final Architecture Assessment

### What We Already Have
A complete, fully functional, 1,001-test-verified multi-agent trading framework (`tradingagents`) alongside a clean domain-neutral foundation layer (`finos/core`).

### What Is Actually Working
The entire `tradingagents` execution pipeline (CLI, analysts, researchers, debate loops, risk managers, traders, data routers, backtester, checkpointer, and memory log).

### What Is Foundation Only
The `finos/core` layer (`FinosState`, `WorkflowBuilder`, `FINOS_CONFIG`, `FinosCheckpointer`, schemas, and validators).

### What Is Missing for FinOS
Unified graph execution routing connecting `finos/core` to runtime workflows, and specialized domain agents (Macro, Investment, Tax, Credit, Fraud).

### What Should NOT Be Rewritten
Do NOT rewrite `tradingagents/` or replace the working graph. Evolve the system by wrapping and extending existing components into `finos/core`.

### Recommended Next Implementation Boundary
Connect `finos/core/config.py` and `finos/core/state/base.py` as optional wrappers around `tradingagents` workflows, then implement the Macro Economy and Investment synthesis agents incrementally.
