"""Unit tests for Phase 6C Market and Macro Economy Kafka event integration."""

import uuid
from unittest import mock

import pytest

from finos.core.agents.base import FinOSAgentInput
from finos.core.agents.macro import MacroEconomyAgent
from finos.core.messaging.events import FinOSEvent
from finos.core.messaging.publisher import EventPublisher
from finos.core.messaging.topics import TOPIC_MACRO_UPDATED, TOPIC_MARKET_PROCESSED, TOPIC_MARKET_RAW


@pytest.fixture
def mock_producer():
    """Mock KafkaProducer instance."""
    with mock.patch("finos.core.messaging.publisher.KafkaProducer") as mock_cls:
        instance = mock_cls.return_value
        instance.publish.return_value = True
        yield instance


class TestMarketKafkaIntegration:
    """Tests for Market pipeline Kafka event publishing."""

    def test_market_raw_event_publication(self, mock_producer):
        publisher = EventPublisher(enabled=True, producer=mock_producer)
        raw_payload = {
            "symbol": "AAPL",
            "price": 185.5,
            "volume": 54000000,
            "ohlc": {"open": 184.0, "high": 186.2, "low": 183.5, "close": 185.5},
        }
        correlation_id = str(uuid.uuid4())

        published = publisher.publish_market_raw(
            entity_id="AAPL",
            as_of_date="2026-03-31",
            raw_payload=raw_payload,
            correlation_id=correlation_id,
            source="yfinance_market_dataflows",
            key="AAPL",
        )

        assert published is True
        assert mock_producer.publish.call_count == 1
        args, kwargs = mock_producer.publish.call_args
        assert kwargs["topic"] == TOPIC_MARKET_RAW
        assert kwargs["key"] == "AAPL"

        event: FinOSEvent = kwargs["event"]
        assert event.event_type == "market.raw"
        assert event.entity_id == "AAPL"
        assert event.correlation_id == correlation_id
        assert event.source == "yfinance_market_dataflows"
        assert event.payload["symbol"] == "AAPL"
        assert event.payload["as_of_date"] == "2026-03-31"

    def test_market_processed_event_publication(self, mock_producer):
        publisher = EventPublisher(enabled=True, producer=mock_producer)
        processed_payload = {
            "symbol": "RELIANCE.NS",
            "rsi": 62.5,
            "sma_50": 2850.0,
            "trend": "bullish",
            "support": 2800.0,
            "resistance": 2920.0,
        }
        correlation_id = str(uuid.uuid4())

        published = publisher.publish_market_processed(
            entity_id="RELIANCE.NS",
            as_of_date="2026-03-31",
            processed_payload=processed_payload,
            correlation_id=correlation_id,
            source="MarketProcessor",
            key="RELIANCE.NS",
        )

        assert published is True
        assert mock_producer.publish.call_count == 1
        args, kwargs = mock_producer.publish.call_args
        assert kwargs["topic"] == TOPIC_MARKET_PROCESSED
        assert kwargs["key"] == "RELIANCE.NS"

        event: FinOSEvent = kwargs["event"]
        assert event.event_type == "market.processed"
        assert event.entity_id == "RELIANCE.NS"
        assert event.correlation_id == correlation_id
        assert event.source == "MarketProcessor"
        assert event.payload["rsi"] == 62.5
        assert event.payload["as_of_date"] == "2026-03-31"

    def test_market_events_disabled_when_kafka_disabled(self):
        publisher = EventPublisher(enabled=False)
        raw_published = publisher.publish_market_raw(
            entity_id="AAPL",
            as_of_date="2026-03-31",
            raw_payload={"price": 180.0},
            correlation_id="corr-123",
        )
        processed_published = publisher.publish_market_processed(
            entity_id="AAPL",
            as_of_date="2026-03-31",
            processed_payload={"rsi": 50},
            correlation_id="corr-123",
        )
        assert raw_published is False
        assert processed_published is False

    def test_market_events_failure_isolation(self, mock_producer):
        mock_producer.publish.side_effect = Exception("Kafka connection lost")
        publisher = EventPublisher(enabled=True, producer=mock_producer)

        # Failure during raw publish should return False safely without throwing exception
        raw_published = publisher.publish_market_raw(
            entity_id="AAPL",
            as_of_date="2026-03-31",
            raw_payload={"price": 180.0},
            correlation_id="corr-456",
        )
        assert raw_published is False

        # Failure during processed publish should also return False safely
        proc_published = publisher.publish_market_processed(
            entity_id="AAPL",
            as_of_date="2026-03-31",
            processed_payload={"rsi": 55.0},
            correlation_id="corr-456",
        )
        assert proc_published is False


class TestMacroKafkaIntegration:
    """Tests for Macro Economy Agent Kafka event publishing."""

    def test_macro_updated_event_publication(self, mock_producer):
        publisher = EventPublisher(enabled=True, producer=mock_producer)
        agent = MacroEconomyAgent(publisher=publisher)
        correlation_id = str(uuid.uuid4())

        agent_input = FinOSAgentInput(
            entity_id="MACRO_US",
            as_of_date="2026-03-31",
            context={
                "correlation_id": correlation_id,
                "cpi_data": "CPI index: 310.2",
                "fed_funds_rate_data": "Fed Funds Rate: 5.25%",
            },
        )

        output = agent.analyze(agent_input)

        assert output is not None
        assert output.entity_id == "MACRO_US"
        assert output.confidence > 0.0

        # Verify event was published
        assert mock_producer.publish.call_count == 1
        args, kwargs = mock_producer.publish.call_args
        assert kwargs["topic"] == TOPIC_MACRO_UPDATED
        assert kwargs["key"] == "MACRO_US"

        event: FinOSEvent = kwargs["event"]
        assert event.event_type == "macro.updated"
        assert event.entity_id == "MACRO_US"
        assert event.entity_type == "macro_series"
        assert event.correlation_id == correlation_id
        assert event.payload["summary"] == output.summary

    def test_macro_kafka_disabled(self):
        publisher = EventPublisher(enabled=False)
        agent = MacroEconomyAgent(publisher=publisher)

        agent_input = FinOSAgentInput(
            entity_id="MACRO_US",
            as_of_date="2026-03-31",
            context={"cpi_data": "CPI index: 310.2"},
        )

        output = agent.analyze(agent_input)
        assert output is not None
        assert output.agent_name == "Macro Economy Agent"

    def test_macro_kafka_failure_isolation(self, mock_producer):
        mock_producer.publish.side_effect = Exception("Kafka cluster unreachable")
        publisher = EventPublisher(enabled=True, producer=mock_producer)
        agent = MacroEconomyAgent(publisher=publisher)

        agent_input = FinOSAgentInput(
            entity_id="MACRO_US",
            as_of_date="2026-03-31",
            context={
                "correlation_id": "test-corr-id",
                "cpi_data": "CPI index: 310.2",
            },
        )

        # Agent analysis should complete and return output cleanly despite Kafka failure
        output = agent.analyze(agent_input)
        assert output is not None
        assert output.entity_id == "MACRO_US"
        assert output.agent_name == "Macro Economy Agent"
