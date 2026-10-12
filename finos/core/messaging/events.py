"""Generic FinOS event envelope and deterministic serialization utilities."""

from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field, field_validator

from finos.core.messaging.errors import KafkaSerializationError


def _json_default(obj: Any) -> Any:
    """Fallback JSON serializer for custom domain objects, datetimes, and UUIDs."""
    if hasattr(obj, "model_dump"):
        return obj.model_dump(mode="json")
    if hasattr(obj, "dict") and callable(obj.dict):
        return obj.dict()
    if isinstance(obj, datetime):
        if obj.tzinfo is None:
            obj = obj.replace(tzinfo=timezone.utc)
        return obj.isoformat()
    if isinstance(obj, uuid.UUID):
        return str(obj)
    if isinstance(obj, Enum):
        return obj.value
    if isinstance(obj, (set, frozenset)):
        return sorted(list(obj))
    raise TypeError(f"Object of type {type(obj).__name__} is not JSON serializable")


class FinOSEvent(BaseModel):
    """Generic FinOS event envelope for Kafka event transport.

    Attributes:
        event_id: Unique UUID identifier for the event instance.
        event_type: Categorical event classification (e.g., 'news.received', 'risk.updated').
        event_version: Mandatory schema version specification (e.g., '1.0').
        timestamp: Timezone-aware ISO 8601 timestamp string.
        source: Emitting system or agent identifier (e.g., 'news-ingestion').
        entity_id: Primary subject identifier under analysis (e.g., 'RELIANCE', 'CPIAUCSL').
        entity_type: Classification of the entity (e.g., 'equity', 'macro_series', 'company').
        correlation_id: Tracing correlation UUID spanning multi-stage agent workflows.
        payload: JSON serializable payload containing business metrics or serialized agent models.
    """

    event_id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        description="Unique identifier for the event.",
    )
    event_type: str = Field(
        ...,
        description="Categorical type of the event (e.g., 'news.received', 'analysis.completed').",
    )
    event_version: str = Field(
        default="1.0",
        description="Mandatory schema version indicator.",
    )
    timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat(),
        description="Timezone-aware ISO 8601 timestamp string.",
    )
    source: str = Field(
        ...,
        description="System or component emitting the event.",
    )
    entity_id: str = Field(
        ...,
        description="Financial entity subject identifier.",
    )
    entity_type: str = Field(
        default="equity",
        description="Category of the entity.",
    )
    correlation_id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        description="Tracing correlation ID spanning multi-step agent workflows.",
    )
    payload: Any = Field(
        default_factory=dict,
        description="JSON serializable event payload.",
    )

    @field_validator("event_id", "event_type", "event_version", "source", "entity_id", "correlation_id")
    @classmethod
    def validate_non_empty_strings(cls, v: str, info) -> str:
        if not isinstance(v, str) or not v.strip():
            raise ValueError(f"Field '{info.field_name}' must be a non-empty string.")
        return v.strip()

    @field_validator("timestamp")
    @classmethod
    def validate_timezone_aware_timestamp(cls, v: str) -> str:
        if not isinstance(v, str) or not v.strip():
            raise ValueError("Timestamp must be a valid non-empty ISO string.")

        try:
            iso_str = v.replace("Z", "+00:00")
            parsed = datetime.fromisoformat(iso_str)
            if parsed.tzinfo is None:
                raise ValueError("Timestamp must be timezone-aware (missing UTC offset or 'Z').")
        except ValueError as exc:
            raise ValueError(f"Invalid timezone-aware ISO timestamp '{v}': {exc}") from exc
        return v

    def serialize(self) -> str:
        """Deterministically serialize the FinOSEvent envelope to a UTF-8 JSON string."""
        try:
            data = self.model_dump(mode="python")
            return json.dumps(data, default=_json_default, sort_keys=True, ensure_ascii=False)
        except Exception as exc:
            raise KafkaSerializationError(f"Failed to serialize FinOSEvent: {exc}", cause=exc) from exc

    def serialize_bytes(self) -> bytes:
        """Deterministically serialize the FinOSEvent envelope to UTF-8 encoded bytes."""
        return self.serialize().encode("utf-8")

    @classmethod
    def deserialize(cls, raw: str | bytes | dict[str, Any]) -> FinOSEvent:
        """Deserialize raw string, bytes, or dictionary into a validated FinOSEvent."""
        if isinstance(raw, bytes):
            try:
                raw = raw.decode("utf-8")
            except UnicodeDecodeError as exc:
                raise KafkaSerializationError(f"Failed UTF-8 decoding of event bytes: {exc}", cause=exc) from exc

        if isinstance(raw, str):
            try:
                data = json.loads(raw)
            except json.JSONDecodeError as exc:
                raise KafkaSerializationError(f"Invalid JSON format for FinOSEvent: {exc}", cause=exc) from exc
        elif isinstance(raw, dict):
            data = raw
        else:
            raise KafkaSerializationError(f"Unsupported event payload type: {type(raw).__name__}")

        if not isinstance(data, dict):
            raise KafkaSerializationError("FinOSEvent JSON payload must be a JSON object / dict.")

        try:
            return cls.model_validate(data)
        except Exception as exc:
            raise KafkaSerializationError(f"Validation failed for FinOSEvent envelope: {exc}", cause=exc) from exc
