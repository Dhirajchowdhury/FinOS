"""Unit tests for FinOS News Agent Kafka Event Layer Integration (Phase 6B)."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

from finos.core.agents import FinOSAgentInput, NewsAgent, NewsAssessment
from finos.core.messaging.events import FinOSEvent
from finos.core.messaging.producer import DeliveryReport, KafkaProducer
from finos.core.messaging.publisher import EventPublisher
from finos.core.messaging.topics import TOPIC_NEWS_PROCESSED, TOPIC_NEWS_RAW


@pytest.mark.unit
def test_news_kafka_disabled_by_default():
    """Verify NewsAgent works without publishing events when Kafka events are disabled."""
    agent = NewsAgent()
    assert agent.publisher.enabled is False

    inp = FinOSAgentInput(
        entity_id="NVDA",
        as_of_date="2026-09-25",
        context={
            "raw_articles": [
                {"title": "Nvidia launches new GPU", "summary": "Strong demand for AI chips", "source": "Bloomberg"}
            ]
        },
    )

    out = agent.analyze(inp)
    assert out.agent_name == "News Agent"
    assert out.entity_id == "NVDA"
    assert isinstance(out.findings, NewsAssessment)


@pytest.mark.unit
def test_news_kafka_events_published_when_enabled():
    """Verify news.raw and news.processed events are published when Kafka events are enabled."""
    mock_producer = MagicMock(spec=KafkaProducer)
    mock_report = DeliveryReport("evt-1", "corr-1", TOPIC_NEWS_RAW, "NVDA")
    mock_producer.publish.return_value = mock_report

    publisher = EventPublisher(enabled=True, producer=mock_producer)
    agent = NewsAgent(publisher=publisher)

    inp = FinOSAgentInput(
        entity_id="NVDA",
        as_of_date="2026-09-25",
        context={
            "correlation_id": "test-correlation-12345",
            "raw_articles": [
                {"title": "Nvidia launches new GPU", "summary": "Strong demand for AI chips", "source": "Bloomberg"}
            ],
        },
    )

    out = agent.analyze(inp)
    assert out.entity_id == "NVDA"

    # Verify 2 events were published (news.raw and news.processed)
    assert mock_producer.publish.call_count == 2

    # Call 1: news.raw
    call1_topic = mock_producer.publish.call_args_list[0][1]["topic"]
    call1_event: FinOSEvent = mock_producer.publish.call_args_list[0][1]["event"]
    call1_key = mock_producer.publish.call_args_list[0][1]["key"]

    assert call1_topic == "finos.news.raw"
    assert call1_event.event_type == "news.raw"
    assert call1_event.entity_id == "NVDA"
    assert call1_event.correlation_id == "test-correlation-12345"
    assert call1_key == "NVDA"

    # Call 2: news.processed
    call2_topic = mock_producer.publish.call_args_list[1][1]["topic"]
    call2_event: FinOSEvent = mock_producer.publish.call_args_list[1][1]["event"]
    call2_key = mock_producer.publish.call_args_list[1][1]["key"]

    assert call2_topic == "finos.news.processed"
    assert call2_event.event_type == "news.processed"
    assert call2_event.entity_id == "NVDA"
    assert call2_event.correlation_id == "test-correlation-12345"
    assert call2_key == "NVDA"


@pytest.mark.unit
def test_news_kafka_failure_isolation():
    """Verify NewsAgent execution succeeds cleanly even if Kafka event publication raises an exception."""
    mock_producer = MagicMock(spec=KafkaProducer)
    mock_producer.publish.side_effect = Exception("Kafka connection timeout")

    publisher = EventPublisher(enabled=True, producer=mock_producer)
    agent = NewsAgent(publisher=publisher)

    inp = FinOSAgentInput(
        entity_id="AAPL",
        as_of_date="2026-09-25",
        context={
            "raw_articles": [
                {"title": "Apple sales surge", "summary": "Record revenue beat", "source": "Reuters"}
            ]
        },
    )

    # MUST NOT raise exception; business output must be returned normally
    out = agent.analyze(inp)
    assert out.agent_name == "News Agent"
    assert out.entity_id == "AAPL"
    assert isinstance(out.findings, NewsAssessment)


@pytest.mark.unit
def test_news_kafka_correlation_id_propagation():
    """Verify correlation ID is preserved across news.raw and news.processed events."""
    mock_producer = MagicMock(spec=KafkaProducer)
    publisher = EventPublisher(enabled=True, producer=mock_producer)
    agent = NewsAgent(publisher=publisher)

    custom_corr_id = "corr-unique-9999"
    inp = FinOSAgentInput(
        entity_id="TSLA",
        as_of_date="2026-09-25",
        context={
            "correlation_id": custom_corr_id,
            "raw_articles": [
                {"title": "Tesla Q3 report", "summary": "Deliveries exceed guidance", "source": "CNBC"}
            ],
        },
    )

    agent.analyze(inp)

    event1: FinOSEvent = mock_producer.publish.call_args_list[0][1]["event"]
    event2: FinOSEvent = mock_producer.publish.call_args_list[1][1]["event"]

    assert event1.correlation_id == custom_corr_id
    assert event2.correlation_id == custom_corr_id
