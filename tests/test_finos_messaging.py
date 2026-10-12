"""Unit tests for FinOS Kafka Messaging Foundation (Phase 2)."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from unittest.mock import MagicMock, patch

import pytest
from pydantic import BaseModel

from finos.core.agents.base import FinOSAgentInput, FinOSAgentOutput
from finos.core.messaging.admin import KafkaAdmin
from finos.core.messaging.config import KafkaConfig
from finos.core.messaging.errors import (
    KafkaConfigurationError,
    KafkaConnectionError,
    KafkaSerializationError,
    KafkaTopicError,
)
from finos.core.messaging.events import FinOSEvent
from finos.core.messaging.topics import (
    TOPIC_ANALYSIS_COMPLETED,
    TOPIC_DEAD_LETTER,
    TOPIC_NEWS_RAW,
    TopicCategory,
    TopicDefinition,
    TopicRegistry,
)


# ---------------------------------------------------------------------------
# 1. Kafka Configuration & Validation Tests
# ---------------------------------------------------------------------------

@pytest.mark.unit
def test_kafka_config_defaults():
    """Verify default local configuration settings."""
    config = KafkaConfig()
    assert config.bootstrap_servers == "localhost:9092"
    assert config.client_id == "finos-core-client"
    assert config.security_protocol == "PLAINTEXT"

    rd_dict = config.to_librdkafka_dict()
    assert rd_dict["bootstrap.servers"] == "localhost:9092"
    assert rd_dict["client.id"] == "finos-core-client"
    assert rd_dict["security.protocol"] == "plaintext"


@pytest.mark.unit
def test_kafka_config_from_env(monkeypatch):
    """Verify loading configuration from FINOS_KAFKA_* environment variables."""
    monkeypatch.setenv("FINOS_KAFKA_BOOTSTRAP_SERVERS", "kafka-broker:9094")
    monkeypatch.setenv("FINOS_KAFKA_CLIENT_ID", "test-finos-app")
    monkeypatch.setenv("FINOS_KAFKA_SECURITY_PROTOCOL", "SASL_PLAINTEXT")

    config = KafkaConfig.from_env()
    assert config.bootstrap_servers == "kafka-broker:9094"
    assert config.client_id == "test-finos-app"
    assert config.security_protocol == "SASL_PLAINTEXT"


@pytest.mark.unit
def test_kafka_config_validation():
    """Verify invalid configuration values raise KafkaConfigurationError."""
    with pytest.raises(KafkaConfigurationError, match="bootstrap_servers cannot be empty"):
        KafkaConfig(bootstrap_servers="")

    with pytest.raises(KafkaConfigurationError, match="Invalid security_protocol"):
        KafkaConfig(security_protocol="INVALID_PROTO")


# ---------------------------------------------------------------------------
# 2. Event Envelope & Validation Tests
# ---------------------------------------------------------------------------

@pytest.mark.unit
def test_finos_event_creation():
    """Verify FinOSEvent creation and mandatory field defaults."""
    event = FinOSEvent(
        event_type="news.received",
        source="news-ingestion",
        entity_id="RELIANCE",
        entity_type="equity",
        payload={"headline": "Quarterly Earnings Surge"},
    )
    assert event.event_type == "news.received"
    assert event.event_version == "1.0"
    assert event.source == "news-ingestion"
    assert event.entity_id == "RELIANCE"
    assert event.entity_type == "equity"
    assert len(event.event_id) > 0
    assert len(event.correlation_id) > 0
    assert event.payload == {"headline": "Quarterly Earnings Surge"}


@pytest.mark.unit
def test_finos_event_timestamp_validation():
    """Verify timezone-aware ISO timestamp validation."""
    # Valid timezone-aware ISO string
    valid_tz = "2026-09-25T10:00:00+00:00"
    event = FinOSEvent(
        event_type="test.event",
        source="test",
        entity_id="NVDA",
        timestamp=valid_tz,
    )
    assert event.timestamp == valid_tz

    # Naive timestamp string must fail validation
    with pytest.raises(ValueError, match="missing UTC offset"):
        FinOSEvent(
            event_type="test.event",
            source="test",
            entity_id="NVDA",
            timestamp="2026-09-25T10:00:00",
        )


@pytest.mark.unit
def test_finos_event_malformed_validation():
    """Verify malformed strings raise validation errors."""
    with pytest.raises(ValueError, match="must be a non-empty string"):
        FinOSEvent(
            event_type="   ",
            source="test",
            entity_id="NVDA",
        )


# ---------------------------------------------------------------------------
# 3. Serialization & Deserialization Tests
# ---------------------------------------------------------------------------

@pytest.mark.unit
def test_finos_event_serialization_and_deserialization():
    """Verify event round-trip serialization and deserialization."""
    agent_input = FinOSAgentInput(
        entity_id="AAPL",
        as_of_date="2026-09-25",
        request="Analyze balance sheet",
    )

    event = FinOSEvent(
        event_id="evt-12345",
        event_type="analysis.requested",
        event_version="1.0",
        timestamp="2026-09-25T12:00:00Z",
        source="graph-engine",
        entity_id="AAPL",
        correlation_id="corr-67890",
        payload=agent_input.model_dump(),
    )

    # String serialization & deserialization
    serialized_str = event.serialize()
    deserialized = FinOSEvent.deserialize(serialized_str)

    assert deserialized.event_id == "evt-12345"
    assert deserialized.event_type == "analysis.requested"
    assert deserialized.source == "graph-engine"
    assert deserialized.entity_id == "AAPL"
    assert deserialized.payload["request"] == "Analyze balance sheet"

    # Bytes serialization & deserialization
    serialized_bytes = event.serialize_bytes()
    deserialized_from_bytes = FinOSEvent.deserialize(serialized_bytes)
    assert deserialized_from_bytes.event_id == "evt-12345"


@pytest.mark.unit
def test_deterministic_serialization():
    """Verify serialization produces identical, key-sorted JSON output for equal logical events."""
    event1 = FinOSEvent(
        event_id="constant-id",
        event_type="risk.updated",
        event_version="1.0",
        timestamp="2026-09-25T15:30:00+00:00",
        source="risk-agent",
        entity_id="TCS",
        correlation_id="constant-corr-id",
        payload={"b": 2, "a": 1, "nested": {"z": 100, "y": 200}},
    )

    event2 = FinOSEvent(
        event_id="constant-id",
        event_type="risk.updated",
        event_version="1.0",
        timestamp="2026-09-25T15:30:00+00:00",
        source="risk-agent",
        entity_id="TCS",
        correlation_id="constant-corr-id",
        payload={"nested": {"y": 200, "z": 100}, "a": 1, "b": 2},
    )

    str1 = event1.serialize()
    str2 = event2.serialize()

    assert str1 == str2

    # Verify keys are sorted alphabetically in output string
    data1 = json.loads(str1)
    keys1 = list(data1.keys())
    assert keys1 == sorted(keys1)


@pytest.mark.unit
def test_deserialization_invalid_payloads():
    """Verify invalid JSON or non-dict payloads raise KafkaSerializationError."""
    with pytest.raises(KafkaSerializationError, match="Invalid JSON format"):
        FinOSEvent.deserialize("not-valid-json{")

    with pytest.raises(KafkaSerializationError, match="must be a JSON object"):
        FinOSEvent.deserialize('["item1", "item2"]')

    with pytest.raises(KafkaSerializationError, match="Validation failed"):
        FinOSEvent.deserialize('{"event_type": "missing_required_fields"}')


# ---------------------------------------------------------------------------
# 4. Topic Registry Tests
# ---------------------------------------------------------------------------

@pytest.mark.unit
def test_topic_registry_definitions():
    """Verify topic definitions, partition counts, and replication factors."""
    news_raw = TopicRegistry.get(TOPIC_NEWS_RAW)
    assert news_raw.name == "finos.news.raw"
    assert news_raw.num_partitions == 3
    assert news_raw.replication_factor == 1
    assert news_raw.category == TopicCategory.RAW_INGESTION

    dead_letter = TopicRegistry.get(TOPIC_DEAD_LETTER)
    assert dead_letter.name == "finos.dead-letter"
    assert dead_letter.num_partitions == 1
    assert dead_letter.replication_factor == 1
    assert dead_letter.category == TopicCategory.SYSTEM
    assert dead_letter.config.get("retention.ms") == "604800000"


@pytest.mark.unit
def test_topic_registry_listings():
    """Verify listing all topics in registry."""
    all_topics = TopicRegistry.list_all()
    all_names = TopicRegistry.list_names()

    assert len(all_topics) >= 14
    assert TOPIC_NEWS_RAW in all_names
    assert TOPIC_ANALYSIS_COMPLETED in all_names
    assert TOPIC_DEAD_LETTER in all_names

    with pytest.raises(KafkaTopicError, match="is not registered"):
        TopicRegistry.get("unregistered.topic.name")


# ---------------------------------------------------------------------------
# 5. Kafka Admin Abstraction Tests (Network Isolated / Mocked)
# ---------------------------------------------------------------------------

@pytest.mark.unit
def test_admin_client_deferred_initialization():
    """Verify KafkaAdmin instantiation performs zero network or client initialization."""
    admin = KafkaAdmin(config=KafkaConfig(bootstrap_servers="non-existent-host:9092"))
    # Private client attribute must be None initially
    assert admin._admin_client is None


@pytest.mark.unit
def test_admin_client_topic_creation_mocked():
    """Verify idempotent topic creation using mocked AdminClient."""
    mock_librdkafka_admin = MagicMock()
    
    # Mock create_topics futures response
    mock_future_success = MagicMock()
    mock_future_success.result.return_value = None

    mock_librdkafka_admin.create_topics.return_value = {
        TOPIC_NEWS_RAW: mock_future_success
    }

    admin = KafkaAdmin(admin_client=mock_librdkafka_admin)

    # Test single topic creation
    res = admin.create_topic(TOPIC_NEWS_RAW)
    assert res is True
    mock_librdkafka_admin.create_topics.assert_called_once()


@pytest.mark.unit
def test_admin_client_idempotent_topic_creation_mocked():
    """Verify TOPIC_ALREADY_EXISTS does not fail creation."""
    mock_librdkafka_admin = MagicMock()
    
    mock_future_exists = MagicMock()
    mock_future_exists.result.side_exception = Exception("KafkaError: TOPIC_ALREADY_EXISTS (36)")
    mock_future_exists.result.side_effect = Exception("KafkaError: TOPIC_ALREADY_EXISTS (36)")

    mock_librdkafka_admin.create_topics.return_value = {
        TOPIC_NEWS_RAW: mock_future_exists
    }

    admin = KafkaAdmin(admin_client=mock_librdkafka_admin)
    res = admin.create_topic(TOPIC_NEWS_RAW)
    assert res is True
