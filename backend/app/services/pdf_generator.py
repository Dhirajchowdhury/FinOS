"""Pure-Python PDF generator for FinOS sentiment & market-impact reports.

Generates standards-compliant PDF 1.4 binary documents without external dependencies.
"""

from datetime import datetime, timezone


def _clean_pdf_text(text: str) -> str:
    """Escapes non-ASCII characters and parentheses for PDF text string literals."""
    if not text:
        return ""
    cleaned = text.encode("ascii", "replace").decode("ascii")
    cleaned = cleaned.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
    return cleaned


def _as_dict(value):
    return value if isinstance(value, dict) else {}


def _build_lines(record, state: dict) -> list[str]:
    """Flatten the response state into printable text lines."""
    report = _as_dict(state.get("report"))
    sentiment = _as_dict(report.get("sentiment"))
    data_quality = _as_dict(report.get("data_quality"))

    entity_id = record.entity_id or _as_dict(state.get("request")).get("entity_id", "SECURITY")
    as_of_date = record.as_of_date or _as_dict(state.get("request")).get("as_of_date", "")
    created_at = (
        record.created_at.strftime("%Y-%m-%d %H:%M UTC")
        if hasattr(record, "created_at") and record.created_at
        else datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    )

    lines: list[str] = [
        "FinOS Sentiment & Market Impact Report",
        "=" * 60,
        f"Target Symbol: {entity_id}",
        f"As Of Date:    {as_of_date}",
        f"Generated:     {created_at}",
        f"Data Status:   {_as_dict(state).get('data_status', '')}",
        f"User Request:  {record.request or ''}",
        "=" * 60,
        "",
    ]

    score = sentiment.get("score")
    lines += [
        "SENTIMENT",
        "-" * 60,
        f"  Band:       {sentiment.get('band', '')}",
        f"  Score:      {'n/a' if score is None else score}",
        f"  Confidence: {sentiment.get('confidence', '')}",
        f"  Source:     {sentiment.get('source', '')}",
        f"  Rationale:  {sentiment.get('rationale', '')}",
        "",
    ]

    lines += ["OBSERVED FACTS", "-" * 60]
    facts = report.get("observed_facts", []) or []
    if facts:
        for ref in facts:
            ref = _as_dict(ref)
            when = ref.get("published_at") or "date unknown"
            lines.append(f"  [{ref.get('evidence_id', '')}] ({when}) {ref.get('title', '')}")
            if ref.get("url"):
                lines.append(f"        {ref['url']}")
    else:
        lines.append("  No evidence available.")
    lines.append("")

    lines += ["EVENTS", "-" * 60]
    events = report.get("events", []) or []
    if events:
        for event in events:
            event = _as_dict(event)
            lines.append(
                f"  [{event.get('event_id', '')}] {event.get('event_type', '')}: "
                f"{event.get('summary', '')}"
            )
    else:
        lines.append("  No events identified.")
    lines.append("")

    lines += ["IMPACT HYPOTHESES (unverified)", "-" * 60]
    paths = report.get("impact_hypotheses", []) or []
    if paths:
        for path in paths:
            path = _as_dict(path)
            target = _as_dict(path.get("target"))
            lines.append(
                f"  [{path.get('pathway_id', '')}] {path.get('source_factor', '')} -> "
                f"{target.get('entity_id', '')} ({path.get('direction', '')}, "
                f"{path.get('horizon', '')}): {path.get('mechanism', '')}"
            )
    else:
        lines.append("  No impact hypotheses derived.")
    lines.append("")

    lines += ["DATA QUALITY", "-" * 60]
    for source in data_quality.get("sources", []) or []:
        source = _as_dict(source)
        lines.append(
            f"  {source.get('vendor', '')}: {source.get('status', '')} "
            f"(freshness: {source.get('freshness', '')})"
        )
    for missing in data_quality.get("missing_inputs", []) or []:
        lines.append(f"  Missing input: {missing}")
    lines.append("")

    lines += ["UNAVAILABLE EVIDENCE", "-" * 60]
    unavailable = report.get("unavailable_evidence", []) or []
    if unavailable:
        for item in unavailable:
            item = _as_dict(item)
            lines.append(
                f"  {item.get('capability', '')}: {item.get('status', '')} - {item.get('reason', '')}"
            )
    else:
        lines.append("  None.")
    lines.append("")

    lines += ["FULL REPORT", "-" * 60]
    final_report = record.final_report or ""
    if final_report:
        for paragraph in final_report.split("\n"):
            lines.append(paragraph)

    return lines


def generate_report_pdf(record, state: dict) -> bytes:
    """Generates clean, institutional PDF report bytes for an AnalysisRecord."""
    lines = _build_lines(record, state)

    page_commands = []
    current_page_cmds = ["BT", "/F1 10 Tf", "14 TL", "50 750 Td"]
    y_pos = 750

    for raw_line in lines:
        line_clean = _clean_pdf_text(raw_line)
        chunk_size = 85
        sublines = [line_clean[i:i + chunk_size] for i in range(0, len(line_clean), chunk_size)] or [""]

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

    pdf_objects: list[bytes] = []
    pdf_objects.append(b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n")

    num_pages = len(page_commands)
    page_obj_ids = [3 + i for i in range(num_pages)]
    content_obj_ids = [3 + num_pages + i for i in range(num_pages)]
    font_obj_id = 3 + (num_pages * 2)

    page_refs = " ".join([f"{pid} 0 R" for pid in page_obj_ids])
    pdf_objects.append(
        f"2 0 obj\n<< /Type /Pages /Kids [{page_refs}] /Count {num_pages} >>\nendobj\n".encode("ascii")
    )

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

    for idx in range(num_pages):
        content_id = content_obj_ids[idx]
        cmds_list = page_commands[idx]
        stream_data = ("\n".join(cmds_list) + "\n").encode("latin-1")
        header = f"{content_id} 0 obj\n<< /Length {len(stream_data)} >>\nstream\n".encode("ascii")
        footer = b"endstream\nendobj\n"
        pdf_objects.append(header + stream_data + footer)

    font_str = (
        f"{font_obj_id} 0 obj\n"
        f"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\n"
        f"endobj\n"
    )
    pdf_objects.append(font_str.encode("ascii"))

    body_bytes = bytearray()
    body_bytes.extend(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")

    offsets = [0]
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
