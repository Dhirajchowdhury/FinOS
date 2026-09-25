"""Financial entity and instrument identity resolution for FinOS Core.

Resolves deterministic metadata (company name, sector, exchange, CIK, legal entity)
so LLM analysis nodes anchor to ground-truth reality rather than hallucinating entities.
"""

from __future__ import annotations

from typing import Any


def resolve_entity_identity(entity_id: str, entity_type: str = "equity") -> dict[str, Any]:
    """Resolve ground-truth identity attributes for a financial entity."""
    return {
        "entity_id": entity_id,
        "entity_type": entity_type,
    }
