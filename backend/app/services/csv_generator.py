"""Pure-Python CSV generator for FinOS institutional financial analysis reports."""

import csv
import io
import json


def generate_report_csv(record, state: dict) -> str:
    """Generates clean CSV output from an AnalysisRecord and state dict."""
    output = io.StringIO()
    writer = csv.writer(output)

    # Report Header
    writer.writerow(["FinOS Financial Analysis Report Dossier"])
    writer.writerow(["Report ID", record.id])
    writer.writerow(["User Request", record.request or ""])
    writer.writerow(["Entity ID", record.entity_id or ""])
    writer.writerow(["Market", record.market or ""])
    writer.writerow(["As of Date", record.as_of_date or ""])
    writer.writerow(["Created At", record.created_at.isoformat() if hasattr(record, "created_at") and record.created_at else ""])
    writer.writerow(["Status", record.status or "completed"])
    writer.writerow([])

    # Table Header for 10 Domain Agents
    writer.writerow([
        "Agent Key",
        "Agent Name",
        "Status",
        "Summary",
        "Findings / Recommendation",
        "Evidence Items",
        "Confidence Score",
        "Data Quality / Source",
    ])

    agent_keys = [
        ("investment", "Investment Agent"),
        ("news", "News Agent"),
        ("macro", "Macro Economy Agent"),
        ("risk", "Risk Agent"),
        ("credit", "Credit Agent"),
        ("portfolio", "Portfolio Agent"),
        ("trading", "Trading Agent"),
        ("tax", "Tax Agent"),
        ("fraud", "Fraud Agent"),
        ("report", "Report Agent"),
    ]

    for key, default_label in agent_keys:
        out = state.get(key)
        if not out:
            continue

        if isinstance(out, dict):
            agent_name = out.get("agent_name", default_label)
            status = out.get("status", "ACTIVE")
            summary = out.get("summary", "")
            findings = json.dumps(out.get("findings", {}))
            evidence_list = out.get("evidence", [])
            evidence = " | ".join(evidence_list) if isinstance(evidence_list, list) else str(evidence_list)
            confidence = out.get("confidence", "")
            metadata = out.get("metadata", {})
            data_quality = metadata.get("source") or metadata.get("data_quality") or json.dumps(metadata)
        else:
            agent_name = default_label
            status = "COMPLETED"
            summary = str(out)
            findings = ""
            evidence = ""
            confidence = ""
            data_quality = ""

        writer.writerow([
            key,
            agent_name,
            status,
            summary,
            findings,
            evidence,
            confidence,
            data_quality,
        ])

    writer.writerow([])
    writer.writerow(["FULL SYNTHESIZED REPORT MARKDOWN"])
    final_report = record.final_report or state.get("report", {}).get("metadata", {}).get("full_report_markdown") or ""
    for paragraph in final_report.split("\n"):
        if paragraph.strip():
            writer.writerow([paragraph.strip()])

    return output.getvalue()
