"""Unit and integration tests for FinOS Kafka Producer (Phase 3)."""

from __future__ import annotations

import socket
from unittest.mock import MagicMock, patch

import pytest

from finos.core.messaging.config import KafkaConfig
from finos.core.messaging.errors import (
    KafkaConfigurationError,
    KafkaConnectionError,
    KafkaPublishError,
    KafkaSerializationError,
    KafkaTopicError,
)
from finos.core.messaging.events import FinOSEvent
from finos.core.messaging.producer import DeliveryReport, KafkaProducer
from finos.core.messaging.topics import TOPIC_NEWS_RAW, TopicDefinition, TopicRegistry


# ---------------------------------------------------------------------------
# Helper Mock Factories
# ---------------------------------------------------------------------------

def _create_mock_producer(delivery_error: Exception | None = None, partition: int = 0, offset: int = 100):
    """Helper to create a mocked confluent_kafka.Producer instance."""
    mock_prod = MagicMock()

    def mock_produce(topic, value, key=None, on_delivery=None):
        if on_delivery:
            if delivery_error:
                on_delivery(delivery_error, None)
            else:
                mock_msg = MagicMock()
                mock_msg.partition.return_value = partition
                mock_msg.offset.return_value = offset
                on_delivery(None, mock_msg)

    mock_prod.produce.side_effect = mock_produce
    mock_prod.flush.return_value = 0
    return mock_prod


# ---------------------------------------------------------------------------
# Unit Tests (Network Isolated / Mocked Broker)
# ---------------------------------------------------------------------------

@pytest.mark.unit
def test_producer_configuration_defaults():
    """Verify default producer reliability configuration settings."""
    prod = KafkaProducer(config=KafkaConfig())
    cfg_dict = prod._get_producer_config()

    assert cfg_dict["enable.idempotence"] is True
    assert cfg_dict["acks"] == "all"
    assert cfg_dict["retries"] == 5
    assert cfg_dict["max.in.flight.requests.per.connection"] <= 5


@pytest.mark.unit
def test_producer_configuration_in_flight_validation():
    """Verify max.in.flight.requests.per.connection > 5 raises KafkaConfigurationError."""
    config = KafkaConfig(extra_config={"max.in.flight.requests.per.connection": 6})
    prod = KafkaProducer(config=config)
    with pytest.raises(KafkaConfigurationError, match="must be <= 5"):
        prod._get_producer_config()


@pytest.mark.unit
def test_producer_successful_publish():
    """Verify successful publish of a valid FinOSEvent."""
    mock_lib_prod = _create_mock_producer(partition=2, offset=500)
    producer = KafkaProducer(producer=mock_lib_prod)

    event = FinOSEvent(
        event_type="news.received",
        source="unit-test",
        entity_id="RELIANCE",
        payload={"headline": "Quarterly Profits Up"},
    )

    report = producer.publish(TOPIC_NEWS_RAW, event, key="RELIANCE")

    assert report.event_id == event.event_id
    assert report.topic == "finos.news.raw"
    assert report.key == "RELIANCE"
    assert report.partition == 2
    assert report.offset == 500
    assert report.error is None
    assert report.completed is True

    mock_lib_prod.produce.assert_called_once()


@pytest.mark.unit
def test_producer_message_key_handling():
    """Verify message key handling for string, bytes, and None."""
    mock_lib_prod = _create_mock_producer()
    producer = KafkaProducer(producer=mock_lib_prod)

    event = FinOSEvent(event_type="test", source="unit", entity_id="AAPL")

    # 1. String key
    report1 = producer.publish(TOPIC_NEWS_RAW, event, key="AAPL")
    assert report1.key == "AAPL"

    # 2. Bytes key
    report2 = producer.publish(TOPIC_NEWS_RAW, event, key=b"AAPL_BYTES")
    assert report2.key == "AAPL_BYTES"

    # 3. None key
    report3 = producer.publish(TOPIC_NEWS_RAW, event, key=None)
    assert report3.key is None


@pytest.mark.unit
def test_producer_invalid_event_rejection():
    """Verify non-FinOSEvent parameters raise KafkaSerializationError."""
    mock_lib_prod = _create_mock_producer()
    producer = KafkaProducer(producer=mock_lib_prod)

    raw_dict = {"event_type": "invalid", "entity_id": "RAW"}
    with pytest.raises(KafkaSerializationError, match="requires a FinOSEvent instance"):
        producer.publish(TOPIC_NEWS_RAW, raw_dict)  # type: ignore


@pytest.mark.unit
def test_producer_serialization_failure():
    """Verify serialization failures raise KafkaSerializationError."""
    mock_lib_prod = _create_mock_producer()
    producer = KafkaProducer(producer=mock_lib_prod)

    event = FinOSEvent(event_type="test", source="unit", entity_id="GOOGL")
    with patch.object(FinOSEvent, "serialize_bytes", side_effect=Exception("Encoding error")):
        with pytest.raises(KafkaSerializationError, match="Event serialization failed"):
            producer.publish(TOPIC_NEWS_RAW, event)



@pytest.mark.unit
def test_producer_invalid_topic_rejection():
    """Verify empty or invalid topic parameters raise KafkaTopicError."""
    mock_lib_prod = _create_mock_producer()
    producer = KafkaProducer(producer=mock_lib_prod)

    event = FinOSEvent(event_type="test", source="unit", entity_id="AMZN")

    with pytest.raises(KafkaTopicError, match="Topic name cannot be empty"):
        producer.publish("", event)

    with pytest.raises(KafkaTopicError, match="Invalid topic parameter type"):
        producer.publish(123, event)  # type: ignore


@pytest.mark.unit
def test_producer_delivery_failure_callback():
    """Verify delivery callback handles failed delivery properly."""
    delivery_err = Exception("KafkaError: MSG_TIMED_OUT (-192)")
    mock_lib_prod = _create_mock_producer(delivery_error=delivery_err)
    producer = KafkaProducer(producer=mock_lib_prod)

    event = FinOSEvent(event_type="test", source="unit", entity_id="MSFT")

    # Non-blocking publish captures delivery error in report
    report = producer.publish(TOPIC_NEWS_RAW, event)
    assert report.error is not None
    assert "Delivery failed" in str(report.error)

    # Blocking publish raises delivery error immediately
    with pytest.raises(KafkaPublishError, match="Delivery failed"):
        producer.publish(TOPIC_NEWS_RAW, event, block=True)


@pytest.mark.unit
def test_producer_flush_and_close():
    """Verify flush and close lifecycle operations."""
    mock_lib_prod = _create_mock_producer()
    mock_lib_prod.flush.return_value = 0

    producer = KafkaProducer(producer=mock_lib_prod)
    remaining = producer.flush()
    assert remaining == 0

    producer.close()
    # Second close must be safe & idempotent
    producer.close()

    # Publishing after close must raise KafkaPublishError
    event = FinOSEvent(event_type="test", source="unit", entity_id="NVDA")
    with pytest.raises(KafkaPublishError, match="closed"):
        producer.publish(TOPIC_NEWS_RAW, event)


@pytest.mark.unit
def test_producer_flush_timeout_error():
    """Verify undelivered messages during flush raise KafkaPublishError."""
    mock_lib_prod = _create_mock_producer()
    mock_lib_prod.flush.return_value = 3  # 3 messages stuck in queue

    producer = KafkaProducer(producer=mock_lib_prod)
    with pytest.raises(KafkaPublishError, match="Flush timeout: 3 messages remained"):
        producer.flush(timeout=1.0)


# ---------------------------------------------------------------------------
# Integration Test (Real Local Kafka Broker - Skipped if offline)
# ---------------------------------------------------------------------------

def _is_kafka_reachable(host: str = "localhost", port: int = 9092) -> bool:
    """Check if local Kafka broker socket is open."""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(0.5)
        res = sock.connect_ex((host, port))
        sock.close()
        return res == 0
    except Exception:
        return False


@pytest.mark.integration
def test_real_kafka_producer_integration():
    """Integration test against local Kafka broker on finos.test.producer topic.

    Safely skipped if no real Kafka broker is listening on localhost:9092.
    """
    if not _is_kafka_reachable("localhost", 9092):
        pytest.skip("Local Kafka broker (localhost:9092) is not reachable; skipping integration test.")

    test_topic = "finos.test.producer"
    config = KafkaConfig(bootstrap_servers="localhost:9092", client_id="finos-test-producer-client")
    producer = KafkaProducer(config=config)

    event = FinOSEvent(
        event_type="integration.test.published",
        source="pytest-integration",
        entity_id="TEST_ENTITY",
        payload={"message": "Phase 3 Real Kafka Producer Verification"},
    )

    try:
        report = producer.publish(test_topic, event, key="TEST_KEY", block=True, timeout=5.0)
        assert report.completed is True
        assert report.error is None
        assert report.partition is not None
        assert report.offset is not None
    finally:
        producer.close()
