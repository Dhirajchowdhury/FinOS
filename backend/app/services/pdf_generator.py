"""Pure-Python PDF generator for FinOS institutional financial analysis reports.

Generates standards-compliant PDF 1.4 binary documents without external dependencies.
"""

from datetime import datetime, timezone
import json


def _clean_pdf_text(text: str) -> str:
    """Escapes non-ASCII characters and parentheses for PDF text string literals."""
    if not text:
        return ""
    # Replace non-ascii chars with ASCII equivalents or space
    cleaned = text.encode("ascii", "replace").decode("ascii")
    # PDF string escapes
    cleaned = cleaned.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
    return cleaned


def generate_report_pdf(record, state: dict) -> bytes:
    """Generates clean, institutional PDF report bytes for an AnalysisRecord."""
    lines: list[str] = []

    request_str = record.request or state.get("request", "")
    entity_id = record.entity_id or state.get("entity_id", "SECURITY")
    as_of_date = record.as_of_date or state.get("as_of_date", "")
    created_at = record.created_at.strftime("%Y-%m-%d %H:%M UTC") if hasattr(record, "created_at") and record.created_at else datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

    lines.append(f"FinOS Comprehensive Financial Analysis Report")
    lines.append(f"=" * 60)
    lines.append(f"Target Symbol: {entity_id}")
    lines.append(f"As Of Date:    {as_of_date}")
    lines.append(f"Generated:     {created_at}")
    lines.append(f"User Request:  {request_str}")
    lines.append(f"=" * 60)
    lines.append("")

    # Extract Agent Assessments
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

    lines.append("10-DOMAIN AGENT EXECUTIVE SUMMARY MATRIX")
    lines.append("-" * 60)
    for key, label in agent_keys:
        agent_data = state.get(key) or {}
        summary = agent_data.get("summary") or agent_data.get("findings", {}).get("summary", "Analysis completed.") if isinstance(agent_data, dict) else str(agent_data)
        lines.append(f"[{label}]")
        lines.append(f"  Summary: {summary}")
        lines.append("")

    lines.append("-" * 60)
    lines.append("FULL SYNTHESIZED REPORT")
    lines.append("-" * 60)

    final_report = record.final_report or state.get("report", {}).get("metadata", {}).get("full_report_markdown") or state.get("report", {}).get("summary", "")
    if final_report:
        for paragraph in final_report.split("\n"):
            lines.append(paragraph)

    # Convert lines to PDF content stream commands (14 TL for text leading)
    page_commands = []
    current_page_cmds = ["BT", "/F1 10 Tf", "14 TL", "50 750 Td"]
    y_pos = 750

    for raw_line in lines:
        line_clean = _clean_pdf_text(raw_line)
        # Handle simple wrapping for long lines (~85 chars)
        chunk_size = 85
        sublines = [line_clean[i:i+chunk_size] for i in range(0, len(line_clean), chunk_size)] or [""]

        for subline in sublines:
            current_page_cmds.append(f"({subline}) Tj T*")
            y_pos -= 14
            if y_pos < 50:
                current_page_cmds.append("ET")
                page_commands.append(current_page_cmds)
                y_pos = 750
                current_page_cmds = ["BT", "/F1 10 Tf", "14 TL", "50 750 Td"]

    if current_page_cmds:
        current_page_cmds.append("ET")
        page_commands.append(current_page_cmds)

    # Assemble PDF 1.4 Binary Structures
    pdf_objects: list[bytes] = []

    # Object 1: Catalog
    pdf_objects.append(b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n")

    num_pages = len(page_commands)
    page_obj_ids = [3 + i for i in range(num_pages)]
    content_obj_ids = [3 + num_pages + i for i in range(num_pages)]
    font_obj_id = 3 + (num_pages * 2)

    # Object 2: Pages
    page_refs = " ".join([f"{pid} 0 R" for pid in page_obj_ids])
    pdf_objects.append(f"2 0 obj\n<< /Type /Pages /Kids [{page_refs}] /Count {num_pages} >>\nendobj\n".encode("ascii"))

    # Object 3..N: Page objects
    for idx in range(num_pages):
        page_id = page_obj_ids[idx]
        content_id = content_obj_ids[idx]
        page_str = (
            f"{page_id} 0 obj\n"
            f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
            f"/Contents {content_id} 0 R /Resources << /Font << /F1 {font_obj_id} 0 R >> >> >>\n"
            f"endobj\n"
        )
        pdf_objects.append(page_str.encode("ascii"))

    # Contents objects
    for idx in range(num_pages):
        content_id = content_obj_ids[idx]
        cmds_list = page_commands[idx]
        stream_data = ("\n".join(cmds_list) + "\n").encode("latin-1")
        
        header = f"{content_id} 0 obj\n<< /Length {len(stream_data)} >>\nstream\n".encode("ascii")
        footer = b"endstream\nendobj\n"
        pdf_objects.append(header + stream_data + footer)

    # Font Object
    font_str = (
        f"{font_obj_id} 0 obj\n"
        f"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\n"
        f"endobj\n"
    )
    pdf_objects.append(font_str.encode("ascii"))

    # Build binary PDF stream with XRef
    body_bytes = bytearray()
    body_bytes.extend(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")

    offsets = [0]  # dummy offset for object 0
    for obj_bytes in pdf_objects:
        offsets.append(len(body_bytes))
        body_bytes.extend(obj_bytes)

    xref_start = len(body_bytes)
    total_objs = len(pdf_objects) + 1
    xref_str = f"xref\n0 {total_objs}\n0000000000 65535 f \n"
    for idx in range(1, total_objs):
        xref_str += f"{offsets[idx]:010d} 00000 n \n"

    trailer_str = (
        f"trailer\n<< /Size {total_objs} /Root 1 0 R >>\n"
        f"startxref\n{xref_start}\n%%EOF\n"
    )

    body_bytes.extend(xref_str.encode("ascii"))
    body_bytes.extend(trailer_str.encode("ascii"))

    return bytes(body_bytes)

    return bytes(body_bytes)
