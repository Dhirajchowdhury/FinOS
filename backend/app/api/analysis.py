import sys
from pathlib import Path
from datetime import datetime
from typing import Optional, Any

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel, Field

# Ensure project root is on sys.path for tradingagents imports
ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

import uuid
import json
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.models.analysis_record import AnalysisRecord
from app.services.entity_resolver import resolve_entity

from tradingagents.agents.sentiment_impact import pipeline
from tradingagents.agents.sentiment_impact.agent import run_sentiment_impact
from tradingagents.agents.sentiment_impact.schemas import (
    ReportStatus,
    SentimentImpactResponse,
)

router = APIRouter(prefix="/analysis", tags=["Sentiment & Market Impact"])


class AnalysisRequest(BaseModel):
    entity_id: Optional[str] = Field(
        None,
        description="Target security ticker symbol (e.g., VEDL.NS, RELIANCE.NS, TCS.NS, AAPL). Auto-extracted from query if omitted.",
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
    window_days: int = Field(
        7,
        ge=1,
        le=90,
        description="Number of days of news to consider ending at the as-of date.",
    )
    context: Optional[dict[str, Any]] = Field(
        default_factory=dict,
        description="Additional context parameters for execution.",
    )


def _record_status(data_status: ReportStatus) -> str:
    if data_status is ReportStatus.FAILED:
        return "failed"
    if data_status is ReportStatus.UNAVAILABLE:
        return "unavailable"
    return "completed"


@router.post(
    "",
    response_model=SentimentImpactResponse,
    summary="Run the sentiment & market-impact analysis",
    description=(
        "Runs the sentiment & market-impact pipeline (normalize news, deterministic "
        "baseline, optional LLM enrichment) and returns the versioned contract."
    ),
)
@router.post(
    "/",
    response_model=SentimentImpactResponse,
    include_in_schema=False,
)
def run_financial_analysis(
    payload: AnalysisRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> SentimentImpactResponse:
    """Authenticated endpoint running the sentiment & market-impact pipeline."""
    if not payload.request or not payload.request.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Analysis request prompt cannot be empty.",
        )
    target_market = payload.market if payload.market else "NSE India"
    if payload.entity_id and payload.entity_id.strip():
        target_symbol = payload.entity_id.strip().upper()
    else:
        resolved = resolve_entity(payload.request, market=target_market)
        if not resolved:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Could not uniquely identify the requested company. "
                    "Please provide the ticker or exchange symbol."
                ),
            )
        target_symbol = resolved
    target_as_of = (
        payload.as_of_date.strip()
        if payload.as_of_date and payload.as_of_date.strip()
        else datetime.now().strftime("%Y-%m-%d")
    )

    try:
        response = run_sentiment_impact(
            entity_id=target_symbol,
            request=payload.request,
            market=target_market,
            as_of_date=target_as_of,
            window_days=payload.window_days,
            context=payload.context or {},
        )
    except Exception as exc:  # noqa: BLE001 - surface a safe, generic failure
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Sentiment & market-impact execution failure: {str(exc)}",
        )

    try:
        record_id = f"an_{uuid.uuid4().hex[:12]}"
        response = response.model_copy(update={"id": record_id, "analysis_id": record_id})
        encoded = jsonable_encoder(response)
        record = AnalysisRecord(
            id=record_id,
            user_id=current_user.id,
            request=payload.request,
            entity_id=target_symbol,
            market=target_market,
            as_of_date=target_as_of,
            state_json=json.dumps(encoded),
            final_report=pipeline.render_report_markdown(response.report),
            status=_record_status(response.data_status),
        )
        db.add(record)
        db.commit()
    except HTTPException:
        raise
    except Exception as exc:  # noqa: BLE001 - persistence must not lose the result
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to persist analysis record: {str(exc)}",
        )

    return response
