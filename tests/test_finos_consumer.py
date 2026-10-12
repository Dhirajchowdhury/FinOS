"""Unit and integration tests for FinOS Kafka Consumer (Phase 4)."""

from __future__ import annotations

import socket
from unittest.mock import MagicMock, patch

import pytest
from confluent_kafka import KafkaError, TopicPartition

from finos.core.messaging.config import KafkaConfig
from finos.core.messaging.consumer import KafkaConsumer
from finos.core.messaging.errors import (
    KafkaConfigurationError,
    KafkaConnectionError,
    KafkaConsumeError,
    KafkaSerializationError,
    KafkaTopicError,
)
from finos.core.messaging.events import FinOSEvent
from finos.core.messaging.producer import KafkaProducer
from finos.core.messaging.topics import TOPIC_DEAD_LETTER, TOPIC_NEWS_PROCESSED, TOPIC_NEWS_RAW, TopicRegistry


# ---------------------------------------------------------------------------
# Helper Mock Factories
# ---------------------------------------------------------------------------

def _create_mock_message(
    value: bytes | str | None = None,
    topic: str = "finos.news.raw",
    partition: int = 0,
    offset: int = 42,
    error: Any | None = None,
):
    """Helper factory for confluent_kafka.Message mock objects."""
    msg = MagicMock()
    msg.error.return_value = error
    msg.topic.return_value = topic
    msg.partition.return_value = partition
    msg.offset.return_value = offset

    if isinstance(value, str):
        msg.value.return_value = value.encode("utf-8")
    else:
        msg.value.return_value = value

    return msg


# ---------------------------------------------------------------------------
# Unit Tests (Network Isolated / Mocked Broker)
# ---------------------------------------------------------------------------

@pytest.mark.unit
def test_consumer_initialization_and_config():
    """Verify consumer initialization, group_id, auto_offset_reset, and enable_auto_commit settings."""
    consumer = KafkaConsumer(
        group_id="finos-news-agent",
        auto_offset_reset="earliest",
        enable_auto_commit=False,
    )
    assert consumer.group_id == "finos-news-agent"
    assert consumer.auto_offset_reset == "earliest"
    assert consumer.enable_auto_commit is False

    cfg_dict = consumer._get_consumer_config()
    assert cfg_dict["group.id"] == "finos-news-agent"
    assert cfg_dict["auto.offset.reset"] == "earliest"
    assert cfg_dict["enable.auto.commit"] is False


@pytest.mark.unit
def test_consumer_invalid_group_id():
    """Verify empty or whitespace group_id raises KafkaConfigurationError."""
    with pytest.raises(KafkaConfigurationError, match="group_id must be a non-empty string"):
        KafkaConsumer(group_id="")

    with pytest.raises(KafkaConfigurationError, match="group_id must be a non-empty string"):
        KafkaConsumer(group_id="   ")


@pytest.mark.unit
def test_consumer_subscribe_single_and_multiple_topics():
    """Verify subscribing to single, multiple, and TopicDefinition topics."""
    mock_lib_consumer = MagicMock()
    consumer = KafkaConsumer(group_id="test-group", consumer=mock_lib_consumer)

    # 1. TopicDefinition & str list
    consumer.subscribe([TOPIC_NEWS_RAW, TOPIC_NEWS_PROCESSED])
    assert consumer._subscribed_topics == ["finos.news.raw", "finos.news.processed"]
    mock_lib_consumer.subscribe.assert_called_once()


@pytest.mark.unit
def test_consumer_subscribe_invalid_topic():
    """Verify empty topics or invalid types raise KafkaTopicError."""
    mock_lib_consumer = MagicMock()
    consumer = KafkaConsumer(group_id="test-group", consumer=mock_lib_consumer)

    with pytest.raises(KafkaTopicError, match="cannot be empty"):
        consumer.subscribe([])

    with pytest.raises(KafkaTopicError, match="cannot be empty"):
        consumer.subscribe([""])

    with pytest.raises(KafkaTopicError, match="Invalid topic type"):
        consumer.subscribe([123])  # type: ignore


@pytest.mark.unit
def test_valid_event_consumption_deserialization_and_commit():
    """Verify valid event polling, deserialization, handler invocation, and explicit offset commit."""
    event = FinOSEvent(
        event_type="news.received",
        source="news-service",
        entity_id="AAPL",
        payload={"headline": "Apple Unveils New Product Line"},
    )
    mock_msg = _create_mock_message(value=event.serialize_bytes())

    mock_lib_consumer = MagicMock()
    mock_lib_consumer.poll.return_value = mock_msg

    consumer = KafkaConsumer(group_id="test-group", consumer=mock_lib_consumer, enable_auto_commit=False)

    received_events = []

    def test_handler(evt: FinOSEvent):
        received_events.append(evt)

    processed = consumer.poll_and_process_one(test_handler, timeout=0.1)

    assert processed is True
    assert len(received_events) == 1
    assert received_events[0].entity_id == "AAPL"

    # Explicit commit called on success
    mock_lib_consumer.commit.assert_called_once_with(mock_msg, asynchronous=False)


@pytest.mark.unit
def test_consumption_invalid_json():
    """Verify invalid JSON raises KafkaSerializationError."""
    mock_msg = _create_mock_message(value=b"not-valid-json{")
    mock_lib_consumer = MagicMock()
    mock_lib_consumer.poll.return_value = mock_msg

    consumer = KafkaConsumer(group_id="test-group", consumer=mock_lib_consumer)

    with pytest.raises(KafkaSerializationError, match="Deserialization failed"):
        consumer.poll_and_process_one(lambda e: None)

    # Failed deserialization must NOT commit offset
    mock_lib_consumer.commit.assert_not_called()


@pytest.mark.unit
def test_consumption_invalid_event_envelope():
    """Verify JSON object missing required FinOSEvent fields raises KafkaSerializationError."""
    mock_msg = _create_mock_message(value=b'{"missing_required": "fields"}')
    mock_lib_consumer = MagicMock()
    mock_lib_consumer.poll.return_value = mock_msg

    consumer = KafkaConsumer(group_id="test-group", consumer=mock_lib_consumer)

    with pytest.raises(KafkaSerializationError, match="Validation failed"):
        consumer.poll_and_process_one(lambda e: None)

    mock_lib_consumer.commit.assert_not_called()


@pytest.mark.unit
def test_consumption_unknown_event_version():
    """Verify unsupported event_version raises KafkaSerializationError."""
    event = FinOSEvent(
        event_type="test",
        event_version="99.0",  # Unsupported version
        source="test",
        entity_id="NVDA",
    )
    mock_msg = _create_mock_message(value=event.serialize_bytes())
    mock_lib_consumer = MagicMock()
    mock_lib_consumer.poll.return_value = mock_msg

    consumer = KafkaConsumer(group_id="test-group", consumer=mock_lib_consumer)

    with pytest.raises(KafkaSerializationError, match="Unsupported event_version '99.0'"):
        consumer.poll_and_process_one(lambda e: None)

    mock_lib_consumer.commit.assert_not_called()


@pytest.mark.unit
def test_handler_failure_does_not_commit():
    """Verify handler exceptions prevent offset commitment and raise exception."""
    event = FinOSEvent(event_type="test", source="unit", entity_id="TSLA")
    mock_msg = _create_mock_message(value=event.serialize_bytes())
    mock_lib_consumer = MagicMock()
    mock_lib_consumer.poll.return_value = mock_msg

    consumer = KafkaConsumer(group_id="test-group", consumer=mock_lib_consumer)

    def failing_handler(evt: FinOSEvent):
        raise RuntimeError("Business logic failure")

    with pytest.raises(RuntimeError, match="Business logic failure"):
        consumer.poll_and_process_one(failing_handler)

    # FAILED HANDLER MUST NOT COMMIT OFFSET
    mock_lib_consumer.commit.assert_not_called()


@pytest.mark.unit
def test_commit_failure():
    """Verify commit errors raise KafkaConsumeError."""
    event = FinOSEvent(event_type="test", source="unit", entity_id="MSFT")
    mock_msg = _create_mock_message(value=event.serialize_bytes())
    mock_lib_consumer = MagicMock()
    mock_lib_consumer.poll.return_value = mock_msg
    mock_lib_consumer.commit.side_effect = Exception("Commit timeout")

    consumer = KafkaConsumer(group_id="test-group", consumer=mock_lib_consumer, enable_auto_commit=False)

    with pytest.raises(KafkaConsumeError, match="Failed to commit offset"):
        consumer.poll_and_process_one(lambda e: None)


@pytest.mark.unit
def test_broker_transport_error():
    """Verify broker error returned on message raises KafkaConsumeError."""
    mock_err = MagicMock()
    mock_err.code.return_value = KafkaError._ALL_BROKERS_DOWN
    mock_err.__str__.return_value = "KafkaError: All brokers down (-187)"

    mock_msg = _create_mock_message(error=mock_err)
    mock_lib_consumer = MagicMock()
    mock_lib_consumer.poll.return_value = mock_msg

    consumer = KafkaConsumer(group_id="test-group", consumer=mock_lib_consumer)

    with pytest.raises(KafkaConsumeError, match="Broker returned transport error"):
        consumer.poll_and_process_one(lambda e: None)


@pytest.mark.unit
def test_rebalance_callbacks():
    """Verify on_assign, on_revoke, and on_lost rebalance callbacks."""
    mock_lib_consumer = MagicMock()
    consumer = KafkaConsumer(group_id="test-group", consumer=mock_lib_consumer, enable_auto_commit=False)

    partitions = [TopicPartition("finos.news.raw", 0), TopicPartition("finos.news.raw", 1)]

    # 1. Assign
    consumer._on_assign(mock_lib_consumer, partitions)
    assert consumer._assigned_partitions == partitions

    # 2. Revoke (must commit offsets before revoking)
    consumer._on_revoke(mock_lib_consumer, partitions)
    assert consumer._assigned_partitions == []
    mock_lib_consumer.commit.assert_called_once_with(asynchronous=False)

    mock_lib_consumer.reset_mock()

    # 3. Lost (must NOT commit offsets when lost)
    consumer._on_lost(mock_lib_consumer, partitions)
    assert consumer._assigned_partitions == []
    mock_lib_consumer.commit.assert_not_called()


@pytest.mark.unit
def test_graceful_stop_and_close():
    """Verify graceful stop and close lifecycle handling."""
    mock_lib_consumer = MagicMock()
    consumer = KafkaConsumer(group_id="test-group", consumer=mock_lib_consumer)

    consumer.stop()
    assert consumer._running is False

    consumer.close()
    assert consumer._closed is True
    mock_lib_consumer.close.assert_called_once()

    # Second close call must be safe & idempotent
    consumer.close()

    # Polling after close must raise KafkaConsumeError
    with pytest.raises(KafkaConsumeError, match="closed"):
        consumer.poll_and_process_one(lambda e: None)


@pytest.mark.unit
def test_dead_letter_queue_transformation_and_publication():
    """Verify DLQ transformation and publication on failed deserialization/handler."""
    mock_dlq_producer = MagicMock(spec=KafkaProducer)
    mock_msg = _create_mock_message(value=b"corrupted-payload", topic="finos.news.raw")
    mock_lib_consumer = MagicMock()
    mock_lib_consumer.poll.return_value = mock_msg

    consumer = KafkaConsumer(
        group_id="test-group",
        consumer=mock_lib_consumer,
        dlq_producer=mock_dlq_producer,
        dlq_topic=TOPIC_DEAD_LETTER,
    )

    with pytest.raises(KafkaSerializationError):
        consumer.poll_and_process_one(lambda e: None)

    # Verify DLQ publication call
    mock_dlq_producer.publish.assert_called_once()
    call_args = mock_dlq_producer.publish.call_args
    assert call_args[0][0] == TOPIC_DEAD_LETTER
    dlq_evt = call_args[0][1]
    assert dlq_evt.event_type == "dead_letter.recorded"
    assert dlq_evt.payload["original_topic"] == "finos.news.raw"
    assert dlq_evt.payload["error_type"] == "KafkaSerializationError"


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
def test_real_kafka_consumer_integration():
    """Integration test producing and consuming on real local Kafka broker.

    Safely skipped if no real Kafka broker is listening on localhost:9092.
    """
    if not _is_kafka_reachable("localhost", 9092):
        pytest.skip("Local Kafka broker (localhost:9092) is not reachable; skipping integration test.")

    test_topic = "finos.test.consumer"
    test_group = "finos.test.consumer.group"

    config = KafkaConfig(bootstrap_servers="localhost:9092", client_id="finos-test-consumer-client")
    producer = KafkaProducer(config=config)
    consumer = KafkaConsumer(group_id=test_group, config=config, auto_offset_reset="earliest")

    event = FinOSEvent(
        event_type="integration.consumer.test",
        source="pytest-integration",
        entity_id="CONSUMER_TEST",
        payload={"message": "Phase 4 Real Kafka Consumer Verification"},
    )

    received_events: list[FinOSEvent] = []

    try:
        # 1. Publish event
        producer.publish(test_topic, event, block=True, timeout=5.0)

        # 2. Subscribe & consume
        consumer.subscribe([test_topic])
        
        # Poll up to 10 iterations to receive message
        for _ in range(10):
            processed = consumer.poll_and_process_one(lambda e: received_events.append(e), timeout=1.0)
            if processed:
                break

        assert len(received_events) == 1
        assert received_events[0].entity_id == "CONSUMER_TEST"
    finally:
        producer.close()
        consumer.close()
