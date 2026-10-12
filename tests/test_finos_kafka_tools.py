"""Unit and integration tests for FinOS Kafka tools (Phase 5)."""

from __future__ import annotations

import socket
from unittest.mock import MagicMock, patch

import pytest

from finos.core.messaging.admin import KafkaAdmin
from finos.core.messaging.bootstrap import run_bootstrap
from finos.core.messaging.config import KafkaConfig
from finos.core.messaging.consumer import KafkaConsumer
from finos.core.messaging.errors import KafkaConnectionError
from finos.core.messaging.events import FinOSEvent
from finos.core.messaging.healthcheck import run_healthcheck
from finos.core.messaging.producer import DeliveryReport, KafkaProducer
from finos.core.messaging.smoke_test import SMOKE_TEST_TOPIC, run_smoke_test
from finos.core.messaging.topics import TOPIC_NEWS_RAW, TopicDefinition, TopicRegistry


# ---------------------------------------------------------------------------
# Unit Tests (Network Isolated / Mocked Broker)
# ---------------------------------------------------------------------------

@pytest.mark.unit
def test_healthcheck_success_unit():
    """Verify healthcheck PASS when admin.list_topics succeeds."""
    mock_admin = MagicMock(spec=KafkaAdmin)
    mock_admin.list_topics.return_value = ["finos.news.raw", "finos.market.raw"]

    res = run_healthcheck(config=KafkaConfig(), admin=mock_admin)
    assert res is True
    mock_admin.list_topics.assert_called_once()


@pytest.mark.unit
def test_healthcheck_failure_unit():
    """Verify healthcheck FAIL when admin.list_topics raises exception."""
    mock_admin = MagicMock(spec=KafkaAdmin)
    mock_admin.list_topics.side_effect = KafkaConnectionError("Broker unreachable")

    res = run_healthcheck(config=KafkaConfig(), admin=mock_admin)
    assert res is False


@pytest.mark.unit
def test_bootstrap_success_and_idempotency_unit():
    """Verify topic bootstrap missing topic creation and existing topic handling."""
    mock_admin = MagicMock(spec=KafkaAdmin)
    
    # 1. First run: no existing topics
    mock_admin.list_topics.return_value = []
    mock_admin.create_topic.return_value = True

    results1 = run_bootstrap(config=KafkaConfig(), admin=mock_admin)
    assert results1[TOPIC_NEWS_RAW] == "CREATED"
    assert mock_admin.create_topic.call_count >= 14

    # 2. Second run: all topics exist with matching partition count
    all_names = TopicRegistry.list_names()
    mock_admin.list_topics.return_value = all_names
    mock_admin.describe_topic.side_effect = lambda t: {"partition_count": TopicRegistry.get(t).num_partitions}

    results2 = run_bootstrap(config=KafkaConfig(), admin=mock_admin)
    assert results2[TOPIC_NEWS_RAW] == "ALREADY EXISTS"


@pytest.mark.unit
def test_bootstrap_mismatch_unit():
    """Verify topic bootstrap detects partition mismatch on existing topic."""
    mock_admin = MagicMock(spec=KafkaAdmin)
    mock_admin.list_topics.return_value = [TOPIC_NEWS_RAW]
    # Topic requested 3 partitions, but cluster has 1
    mock_admin.describe_topic.return_value = {"partition_count": 1}

    results = run_bootstrap(config=KafkaConfig(), admin=mock_admin)
    assert results[TOPIC_NEWS_RAW] == "MISMATCH"


@pytest.mark.unit
def test_smoke_test_success_unit():
    """Verify smoke_test pipeline execution with mocked components."""
    mock_admin = MagicMock(spec=KafkaAdmin)
    mock_producer = MagicMock(spec=KafkaProducer)
    mock_consumer = MagicMock(spec=KafkaConsumer)

    # Mock publish report
    report = DeliveryReport("evt-123", "corr-456", SMOKE_TEST_TOPIC, "SMOKE_KEY")
    report.partition = 0
    report.offset = 10
    report.completed = True
    mock_producer.publish.return_value = report

    # Mock consumer poll_and_process_one to pass published event to handler
    def mock_poll(handler, timeout=1.0):
        # Extract published event from producer call args
        published_event = mock_producer.publish.call_args[0][1]
        handler(published_event)
        return True

    mock_consumer.poll_and_process_one.side_effect = mock_poll

    res = run_smoke_test(
        config=KafkaConfig(),
        admin=mock_admin,
        producer=mock_producer,
        consumer=mock_consumer,
    )
    assert res is True
    mock_admin.create_topic.assert_called_once()
    mock_producer.publish.assert_called_once()
    mock_consumer.subscribe.assert_called_once_with([SMOKE_TEST_TOPIC])



@pytest.mark.unit
def test_smoke_test_failure_unit():
    """Verify smoke test failure handling when publish or consume fails."""
    mock_admin = MagicMock(spec=KafkaAdmin)
    mock_producer = MagicMock(spec=KafkaProducer)
    mock_consumer = MagicMock(spec=KafkaConsumer)

    mock_producer.publish.side_effect = KafkaConnectionError("Producer failure")

    res = run_smoke_test(
        config=KafkaConfig(),
        admin=mock_admin,
        producer=mock_producer,
        consumer=mock_consumer,
    )
    assert res is False


# ---------------------------------------------------------------------------
# Integration Tests (Real Local Kafka Broker - Skipped if offline)
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
def test_real_kafka_healthcheck_integration():
    """Integration test verifying healthcheck against real local Kafka broker."""
    if not _is_kafka_reachable("localhost", 9092):
        pytest.skip("Local Kafka broker (localhost:9092) is not reachable; skipping integration test.")

    res = run_healthcheck(config=KafkaConfig(bootstrap_servers="localhost:9092"))
    assert res is True


@pytest.mark.integration
def test_real_kafka_bootstrap_integration():
    """Integration test verifying bootstrap topic creation on real local Kafka broker."""
    if not _is_kafka_reachable("localhost", 9092):
        pytest.skip("Local Kafka broker (localhost:9092) is not reachable; skipping integration test.")

    results = run_bootstrap(config=KafkaConfig(bootstrap_servers="localhost:9092"))
    assert len(results) >= 14
    assert all(status in ("CREATED", "ALREADY EXISTS") for status in results.values())


@pytest.mark.integration
def test_real_kafka_smoke_test_integration():
    """Integration test executing full produce-consume pipeline on real local Kafka broker."""
    if not _is_kafka_reachable("localhost", 9092):
        pytest.skip("Local Kafka broker (localhost:9092) is not reachable; skipping integration test.")

    res = run_smoke_test(config=KafkaConfig(bootstrap_servers="localhost:9092"))
    assert res is True
