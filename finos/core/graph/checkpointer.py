"""Checkpointing abstractions for resumable FinOS workflows.

Handles per-entity isolated SQLite checkpoint databases, deterministic thread ID
generation with run signatures to prevent corrupted state resumes, and WAL cleanup.
"""

from __future__ import annotations

import hashlib
from pathlib import Path


class FinosCheckpointer:
    """Manages SQLite checkpoint lifecycle for FinOS workflows."""

    def __init__(self, cache_dir: str | Path):
        self.cache_dir = Path(cache_dir)
        self.checkpoints_dir = self.cache_dir / "checkpoints"

    def thread_id(self, entity_id: str, as_of_date: str, signature: str = "") -> str:
        """Generate deterministic 16-character thread ID."""
        base = f"{entity_id.upper()}:{as_of_date}"
        if signature:
            base = f"{base}:{signature}"
        return hashlib.sha256(base.encode("utf-8")).hexdigest()[:16]

    def get_db_path(self, entity_id: str) -> Path:
        """Resolve safe sqlite database path for entity."""
        self.checkpoints_dir.mkdir(parents=True, exist_ok=True)
        safe_name = "".join(c for c in entity_id if c.isalnum() or c in ("-", "_", ".")).upper()
        return self.checkpoints_dir / f"{safe_name}.db"
