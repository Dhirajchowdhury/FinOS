import json
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.models.analysis_record import AnalysisRecord
from app.services.csv_generator import generate_report_csv
from app.services.pdf_generator import generate_report_pdf

router = APIRouter(prefix="/reports", tags=["Reports & Dossiers"])


@router.get(
    "",
    response_model=list[dict[str, Any]],
    summary="List authenticated user's financial analysis reports",
)
@router.get(
    "/",
    response_model=list[dict[str, Any]],
    include_in_schema=False,
)
def list_user_reports(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Returns only reports belonging to the currently authenticated user."""
    records = (
        db.query(AnalysisRecord)
        .filter(AnalysisRecord.user_id == current_user.id)
        .order_by(AnalysisRecord.created_at.desc())
        .all()
    )

    items = []
    for r in records:
        items.append({
            "id": r.id,
            "request": r.request,
            "entity_id": r.entity_id,
            "market": r.market,
            "as_of_date": r.as_of_date,
            "created_at": r.created_at.isoformat() if r.created_at else None,
            "status": r.status,
        })
    return items


@router.get(
    "/{report_id}",
    response_model=dict[str, Any],
    summary="Retrieve complete persisted analysis report detail by ID",
)
def get_user_report_detail(
    report_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieves full persisted analysis record ensuring strict user ownership."""
    record = (
        db.query(AnalysisRecord)
        .filter(AnalysisRecord.id == report_id, AnalysisRecord.user_id == current_user.id)
        .first()
    )
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report record not found or unauthorized.",
        )

    try:
        state_dict = json.loads(record.state_json)
    except Exception:
        state_dict = {}

    return {
        "id": record.id,
        "request": record.request,
        "entity_id": record.entity_id,
        "market": record.market,
        "as_of_date": record.as_of_date,
        "created_at": record.created_at.isoformat() if record.created_at else None,
        "status": record.status,
        "final_report": record.final_report,
        "state": state_dict,
    }


@router.get(
    "/{report_id}/csv",
    summary="Download real persisted analysis report as CSV",
)
def download_report_csv(
    report_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generates downloadable CSV for authenticated user's report."""
    record = (
        db.query(AnalysisRecord)
        .filter(AnalysisRecord.id == report_id, AnalysisRecord.user_id == current_user.id)
        .first()
    )
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report record not found or unauthorized.",
        )

    try:
        state_dict = json.loads(record.state_json)
    except Exception:
        state_dict = {}

    csv_content = generate_report_csv(record, state_dict)
    filename = f"finos_report_{record.entity_id}_{record.id}.csv"

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=\"{filename}\""},
    )


@router.get(
    "/{report_id}/pdf",
    summary="Download real persisted analysis report as PDF",
)
def download_report_pdf(
    report_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generates downloadable PDF for authenticated user's report."""
    record = (
        db.query(AnalysisRecord)
        .filter(AnalysisRecord.id == report_id, AnalysisRecord.user_id == current_user.id)
        .first()
    )
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report record not found or unauthorized.",
        )

    try:
        state_dict = json.loads(record.state_json)
    except Exception:
        state_dict = {}

    pdf_bytes = generate_report_pdf(record, state_dict)
    filename = f"finos_report_{record.entity_id}_{record.id}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=\"{filename}\""},
    )
