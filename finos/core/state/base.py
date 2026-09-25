"""Domain-neutral state definitions for FinOS Core workflows.

Provides FinosState, decoupled from stock-trading assumptions, ticker-centric
execution, or fixed debate formats. Supports arbitrary financial entities
(companies, economic indicators, portfolios, credit obligors, filings).
"""

from __future__ import annotations

from typing import Annotated, Any
from langgraph.graph import MessagesState
from typing_extensions import TypedDict


class FinosState(MessagesState):
    """Domain-neutral workflow state for financial intelligence graphs.

    Attributes:
        entity_id: Identifier of the financial subject (e.g. ticker 'NVDA',
            CIK '0001045810', macro series 'CPIAUCSL', portfolio 'BOOK-01').
        entity_type: Category of the entity (e.g. 'equity', 'macro_series',
            'filing', 'credit_obligor', 'portfolio', 'regulatory_topic').
        as_of_date: Simulation or observation date ('YYYY-MM-DD'). Serves as
            the strict point-in-time boundary for all downstream data tools.
        request: The initial user prompt, objective, or task description.
        sender: The name of the node/agent that emitted the latest message.
        artifacts: Storage dictionary for intermediate analytical findings,
            structured reports, and domain assessments produced by nodes.
        metadata: Execution parameters, provenance tags, and routing directives.
        past_context: Historical lessons, audit notes, or memory retrieved as-of run start.
    """

    entity_id: Annotated[str, "Primary financial entity identifier under analysis"]
    entity_type: Annotated[str, "Classification of the entity: equity, macro, filing, etc."]
    market: Annotated[str, "Market or jurisdiction identifier (e.g. 'NSE India', 'US')"]
    as_of_date: Annotated[str, "Strict point-in-time cutoff date (YYYY-MM-DD)"]
    request: Annotated[str, "User or system instruction initiating the workflow"]
    sender: Annotated[str, "Identifier of the last agent or tool node executed"]
    
    # Domain agent assessment objects
    market_data: Annotated[dict[str, Any], "Price & volume history context"]
    news: Annotated[dict[str, Any], "News Agent assessment output"]
    macro: Annotated[dict[str, Any], "Macro Economy Agent assessment output"]
    fundamentals: Annotated[dict[str, Any], "Raw fundamental data"]
    credit: Annotated[dict[str, Any], "Credit Agent assessment output"]
    investment: Annotated[dict[str, Any], "Investment Agent assessment output"]
    risk: Annotated[dict[str, Any], "Risk Agent assessment output"]
    portfolio: Annotated[dict[str, Any], "Portfolio Agent assessment output"]
    tax: Annotated[dict[str, Any], "Tax Agent assessment output"]
    fraud: Annotated[dict[str, Any], "Fraud Agent assessment output"]
    trading: Annotated[dict[str, Any], "Trading Agent assessment output"]
    report: Annotated[dict[str, Any], "Report Agent assessment output"]

    # Workflow metadata & governance
    data_quality: Annotated[dict[str, Any], "Domain-level data quality and confidence metrics"]
    missing_data: Annotated[list[str], "Aggregated missing data fields across workflow"]
    errors: Annotated[list[str], "Aggregated execution or data retrieval errors"]
    provenance: Annotated[dict[str, Any], "Data source provenance and vintage timestamps"]
    artifacts: Annotated[dict[str, Any], "Domain reports and structured outputs"]
    metadata: Annotated[dict[str, Any], "Workflow metadata, tags, and runtime options"]
    past_context: Annotated[str, "Retrieved memory or historical lessons as of as_of_date"]

