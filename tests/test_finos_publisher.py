"""Unit tests for EventPublisher and Phase 6A Kafka integration."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

from finos.core.agents.base import FinOSAgentInput, FinOSAgentOutput
from finos.core.graph.engine import FinosGraphEngine
from finos.core.messaging.events import FinOSEvent
from finos.core.messaging.producer import DeliveryReport, KafkaProducer
from finos.core.messaging.publisher import EventPublisher
from finos.core.messaging.topics import TOPIC_NEWS_PROCESSED, TOPIC_GRAPH_UPDATED, TOPIC_DEAD_LETTER


@pytest.mark.unit
def test_event_publisher_disabled_by_default():
    """Verify EventPublisher is disabled by default and performs zero I/O."""
    publisher = EventPublisher()
    assert publisher.enabled is False
    assert publisher._get_producer() is None

    # Calling publish when disabled returns False immediately
    event = FinOSEvent(event_type="test", source="test", entity_id="NVDA")
    assert publisher.publish_event(event) is False


@pytest.mark.unit
def test_event_publisher_enabled_with_mock_producer():
    """Verify EventPublisher delegates to KafkaProducer when enabled."""
    mock_producer = MagicMock(spec=KafkaProducer)
    mock_report = DeliveryReport("evt-1", "corr-1", TOPIC_NEWS_PROCESSED, "AAPL")
    mock_producer.publish.return_value = mock_report

    publisher = EventPublisher(enabled=True, producer=mock_producer)
    assert publisher.enabled is True

    # 1. Test agent started
    res_started = publisher.publish_agent_started(
        agent_name="News Agent",
        entity_id="AAPL",
        entity_type="equity",
        as_of_date="2026-09-25",
        correlation_id="corr-100",
    )
    assert res_started is True
    assert mock_producer.publish.call_count == 1

    # 2. Test agent completed
    output = FinOSAgentOutput(
        agent_name="News Agent",
        entity_id="AAPL",
        as_of_date="2026-09-25",
        summary="Positive news",
    )
    res_completed = publisher.publish_agent_completed(output, correlation_id="corr-100")
    assert res_completed is True
    assert mock_producer.publish.call_count == 2

    # 3. Test agent failed
    res_failed = publisher.publish_agent_failed(
        agent_name="News Agent",
        entity_id="AAPL",
        entity_type="equity",
        as_of_date="2026-09-25",
        correlation_id="corr-100",
        error_message="API Rate Limit Exceeded",
    )
    assert res_failed is True
    assert mock_producer.publish.call_count == 3


@pytest.mark.unit
def test_event_publisher_failure_isolation():
    """Verify failure isolation: publishing exception logs warning and returns False without raising."""
    mock_producer = MagicMock(spec=KafkaProducer)
    mock_producer.publish.side_effect = Exception("Kafka Broker Down")

    publisher = EventPublisher(enabled=True, producer=mock_producer)
    event = FinOSEvent(event_type="test", source="unit", entity_id="TSLA")

    # MUST return False, MUST NOT raise exception!
    res = publisher.publish_event(event)
    assert res is False


@pytest.mark.unit
def test_graph_engine_execution_with_events_disabled():
    """Verify FinosGraphEngine executes cleanly when Kafka events are disabled."""
    engine = FinosGraphEngine()
    assert engine.publisher.enabled is False

    state = engine.execute(entity_id="RELIANCE", as_of_date="2026-09-25")
    assert state["entity_id"] == "RELIANCE"
    assert "correlation_id" in state["metadata"]
    assert state["sender"] == "Report Agent"


@pytest.mark.unit
def test_graph_engine_execution_with_mocked_publisher():
    """Verify FinosGraphEngine triggers publisher events when enabled."""
    mock_publisher = MagicMock(spec=EventPublisher)
    mock_publisher.enabled = True

    engine = FinosGraphEngine()
    engine.publisher = mock_publisher

    state = engine.execute(entity_id="RELIANCE", as_of_date="2026-09-25")

    assert state["entity_id"] == "RELIANCE"
    # Verify agent started & completed events were published
    assert mock_publisher.publish_agent_started.call_count == 10
    assert mock_publisher.publish_agent_completed.call_count == 10
    assert mock_publisher.publish_graph_state_updated.call_count == 2
