import os
import sys
from pathlib import Path
from datetime import datetime
from typing import Optional, Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel, Field

# Ensure project root is on sys.path for finos and tradingagents imports
ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from app.api.auth import get_current_user
from app.models.user import User

from finos.core.graph.engine import FinosGraphEngine
from tradingagents.default_config import DEFAULT_CONFIG
from tradingagents.llm_clients.factory import build_llm_kwargs, create_llm_client

router = APIRouter(prefix="/analysis", tags=["Analysis Engine"])


class AnalysisRequest(BaseModel):
    entity_id: Optional[str] = Field(
        None,
        description="Target security ticker symbol (e.g., RELIANCE.NS, TCS.NS, AAPL). Defaults to auto-extracted or RELIANCE.NS.",
    )
    request: str = Field(
        ...,
        description="User financial analysis inquiry prompt.",
    )
    market: Optional[str] = Field(
        "NSE India",
        description="Target security market exchange.",
    )
    as_of_date: Optional[str] = Field(
        None,
        description="As-of date in YYYY-MM-DD format. Defaults to current date.",
    )
    context: Optional[dict[str, Any]] = Field(
        default_factory=dict,
        description="Additional context parameters for execution.",
    )


def _extract_ticker_fallback(prompt: str) -> str:
    """Safely extracts known ticker symbols from user query prompt or defaults to RELIANCE.NS."""
    upper = prompt.upper()
    known_tickers = [
        "RELIANCE.NS",
        "TCS.NS",
        "INFY.NS",
        "HDFCBANK.NS",
        "ICICIBANK.NS",
        "AAPL",
        "MSFT",
        "TSLA",
        "NVDA",
        "AMZN",
        "GOOGL",
        "RELIANCE",
        "TCS",
        "INFY",
    ]
    for ticker in known_tickers:
        if ticker in upper:
            if ticker in ["RELIANCE", "TCS", "INFY"]:
                return f"{ticker}.NS"
            return ticker
    return "RELIANCE.NS"


def _get_engine() -> FinosGraphEngine:
    """Instantiates FinosGraphEngine with Google Gemini client if GOOGLE_API_KEY is available."""
    llm = None
    provider = DEFAULT_CONFIG.get("llm_provider", "").lower()
    if provider == "google" and os.getenv("GOOGLE_API_KEY"):
        try:
            kwargs = build_llm_kwargs(DEFAULT_CONFIG)
            kwargs["api_key"] = os.getenv("GOOGLE_API_KEY")
            client = create_llm_client(
                provider=provider,
                model=DEFAULT_CONFIG.get("deep_think_llm", "gemini-3.8-flash"),
                **kwargs,
            )
            llm = client.get_llm()
        except Exception:
            pass
    return FinosGraphEngine(llm=llm)


@router.post(
    "",
    response_model=dict[str, Any],
    summary="Execute complete 10-agent FinOS analysis workflow",
    description="Triggers real FinosGraphEngine DAG orchestration across 10 domain agents and returns state output.",
)
@router.post(
    "/",
    response_model=dict[str, Any],
    include_in_schema=False,
)
def run_financial_analysis(
    payload: AnalysisRequest,
    current_user: User = Depends(get_current_user),
):
    """Authenticated endpoint executing the real FinOS 10-agent DAG workflow."""
    if not payload.request or not payload.request.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Analysis request prompt cannot be empty.",
        )

    target_symbol = payload.entity_id.strip() if payload.entity_id and payload.entity_id.strip() else _extract_ticker_fallback(payload.request)
    target_as_of = payload.as_of_date.strip() if payload.as_of_date and payload.as_of_date.strip() else datetime.now().strftime("%Y-%m-%d")
    target_market = payload.market if payload.market else "NSE India"

    try:
        engine = _get_engine()
        state = engine.execute(
            entity_id=target_symbol,
            as_of_date=target_as_of,
            request=payload.request,
            market=target_market,
            context=payload.context or {},
        )
        # Ensure user info is recorded in metadata
        state["metadata"]["requested_by_user_email"] = current_user.email
        return jsonable_encoder(state)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"FinOS multi-agent execution failure: {str(exc)}",
        )
