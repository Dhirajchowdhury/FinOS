"""Pure-Python CSV generator for FinOS sentiment & market-impact reports."""

import csv
import io


def _as_dict(value):
    return value if isinstance(value, dict) else {}


def generate_report_csv(record, state: dict) -> str:
    """Generates clean CSV output from an AnalysisRecord and its response state."""
    output = io.StringIO()
    writer = csv.writer(output)

    report = _as_dict(_as_dict(state).get("report"))
    sentiment = _as_dict(report.get("sentiment"))
    data_quality = _as_dict(report.get("data_quality"))

    writer.writerow(["FinOS Sentiment & Market Impact Report"])
    writer.writerow(["Report ID", record.id])
    writer.writerow(["User Request", record.request or ""])
    writer.writerow(["Entity ID", record.entity_id or ""])
    writer.writerow(["Market", record.market or ""])
    writer.writerow(["As of Date", record.as_of_date or ""])
    writer.writerow([
        "Created At",
        record.created_at.isoformat()
        if hasattr(record, "created_at") and record.created_at else "",
    ])
    writer.writerow(["Status", record.status or "completed"])
    writer.writerow(["Data Status", _as_dict(state).get("data_status", "")])
    writer.writerow([])

    writer.writerow(["SENTIMENT"])
    writer.writerow(["Band", "Score", "Confidence", "Source", "Rationale"])
    score = sentiment.get("score")
    writer.writerow([
        sentiment.get("band", ""),
        "" if score is None else score,
        sentiment.get("confidence", ""),
        sentiment.get("source", ""),
        sentiment.get("rationale", ""),
    ])
    writer.writerow([])

    writer.writerow(["OBSERVED FACTS"])
    writer.writerow(["Evidence ID", "Source", "Title", "Publisher", "Published At", "URL"])
    for ref in report.get("observed_facts", []) or []:
        ref = _as_dict(ref)
        writer.writerow([
            ref.get("evidence_id", ""),
            ref.get("source", ""),
            ref.get("title", ""),
            ref.get("publisher", ""),
            ref.get("published_at", ""),
            ref.get("url", ""),
        ])
    writer.writerow([])

    writer.writerow(["EVENTS"])
    writer.writerow(["Event ID", "Type", "Summary", "Sectors", "Macro Factors", "Confidence", "Evidence IDs"])
    for event in report.get("events", []) or []:
        event = _as_dict(event)
        writer.writerow([
            event.get("event_id", ""),
            event.get("event_type", ""),
            event.get("summary", ""),
            " | ".join(event.get("sectors", []) or []),
            " | ".join(event.get("macro_factors", []) or []),
            event.get("confidence", ""),
            " | ".join(event.get("evidence_ids", []) or []),
        ])
    writer.writerow([])

    writer.writerow(["IMPACT HYPOTHESES (unverified)"])
    writer.writerow(["Pathway ID", "Source Factor", "Target", "Direction", "Horizon", "Mechanism", "Evidence IDs"])
    for path in report.get("impact_hypotheses", []) or []:
        path = _as_dict(path)
        target = _as_dict(path.get("target"))
        writer.writerow([
            path.get("pathway_id", ""),
            path.get("source_factor", ""),
            target.get("entity_id", ""),
            path.get("direction", ""),
            path.get("horizon", ""),
            path.get("mechanism", ""),
            " | ".join(path.get("supporting_evidence_ids", []) or []),
        ])
    writer.writerow([])

    writer.writerow(["DATA QUALITY"])
    writer.writerow(["Vendor", "Status", "Freshness", "Retrieved At"])
    for source in data_quality.get("sources", []) or []:
        source = _as_dict(source)
        writer.writerow([
            source.get("vendor", ""),
            source.get("status", ""),
            source.get("freshness", ""),
            source.get("retrieved_at", ""),
        ])
    for missing in data_quality.get("missing_inputs", []) or []:
        writer.writerow(["Missing Input", missing])
    writer.writerow([])

    writer.writerow(["UNAVAILABLE EVIDENCE"])
    writer.writerow(["Capability", "Status", "Reason"])
    for item in report.get("unavailable_evidence", []) or []:
        item = _as_dict(item)
        writer.writerow([item.get("capability", ""), item.get("status", ""), item.get("reason", "")])
    writer.writerow([])

    writer.writerow(["FULL REPORT"])
    final_report = record.final_report or ""
    for paragraph in final_report.split("\n"):
        if paragraph.strip():
            writer.writerow([paragraph.strip()])

    return output.getvalue()
