"""Point-in-time safeguards and UTC date windowing for FinOS data ingestion.

Ensures dated data feeds (news, market ticks, SEC filings, macro series) never
leak future data past the simulation as_of_date.
"""

from __future__ import annotations

from datetime import date, datetime, timedelta, timezone


def to_utc(dt: datetime) -> datetime:
    """Normalize datetime to UTC-aware datetime."""
    return dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt.astimezone(timezone.utc)


def get_current_date() -> str:
    """Return current date formatted as YYYY-MM-DD."""
    return date.today().strftime("%Y-%m-%d")


def as_of(requested_date: str | None, as_of_boundary: str) -> str | None:
    """Clamp requested date so it never exceeds the run's point-in-time boundary."""
    if not as_of_boundary:
        return requested_date
    if not requested_date:
        return as_of_boundary
    try:
        req = datetime.strptime(requested_date, "%Y-%m-%d")
        bound = datetime.strptime(as_of_boundary, "%Y-%m-%d")
        return requested_date if req <= bound else as_of_boundary
    except (ValueError, TypeError):
        return as_of_boundary


def as_of_window(start_date: str, end_date: str, as_of_boundary: str) -> tuple[str, str]:
    """Clamp [start, end] window to as_of_boundary, preserving span if shifted."""
    clamped_end = as_of(end_date, as_of_boundary) or end_date
    try:
        s = datetime.strptime(start_date, "%Y-%m-%d")
        e = datetime.strptime(end_date, "%Y-%m-%d")
        ce = datetime.strptime(clamped_end, "%Y-%m-%d")
        if ce < e and e >= s:
            span = e - s
            return (ce - span).strftime("%Y-%m-%d"), clamped_end
    except (ValueError, TypeError):
        pass
    return start_date, clamped_end
