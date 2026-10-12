"""Unit tests for Phase 6E Decision Engine Kafka event integration."""

import uuid
from unittest import mock

import pytest

from finos.core.agents.base import FinOSAgentInput
from finos.core.agents.trading import TradingAgent, TradingProposal
from finos.core.graph.engine import FinosGraphEngine
from finos.core.messaging.events import FinOSEvent
from finos.core.messaging.publisher import EventPublisher
from finos.core.messaging.topics import (
    TOPIC_DECISION_COMPLETED,
    TOPIC_DECISION_REQUESTED,
)


@pytest.fixture
def mock_producer():
    """Mock KafkaProducer instance."""
    with mock.patch("finos.core.messaging.publisher.KafkaProducer") as mock_cls:
        instance = mock_cls.return_value
        instance.publish.return_value = True
        yield instance


class TestDecisionKafkaIntegration:
    """Tests for Decision Engine (TradingAgent) Kafka event publishing."""

    def test_decision_requested_and_completed_publication(self, mock_producer):
        """Verify decision.requested and decision.completed events are emitted properly."""
        publisher = EventPublisher(enabled=True, producer=mock_producer)
        agent = TradingAgent(publisher=publisher)
        correlation_id = str(uuid.uuid4())

        agent_input = FinOSAgentInput(
            entity_id="TSLA",
            as_of_date="2026-03-31",
            request="Evaluate trade setup",
            context={
                "correlation_id": correlation_id,
                "market": "NASDAQ",
                "investment_assessment": mock.Mock(
                    findings={"rating": "Buy"},
                    summary="Strong buy rating on TSLA growth",
                ),
                "risk_assessment": mock.Mock(
                    summary="Moderate risk due to market volatility",
                ),
            },
        )

        output = agent.analyze(agent_input)

        assert output is not None
        assert output.entity_id == "TSLA"
        assert output.agent_name == "Trading Agent"
        assert isinstance(output.findings, TradingProposal)
        assert output.findings.action == "Buy"

        # Verify producer calls (decision.requested then decision.completed)
        assert mock_producer.publish.call_count == 2
        calls = mock_producer.publish.call_args_list

        # 1. decision.requested
        req_kwargs = calls[0].kwargs
        assert req_kwargs["topic"] == TOPIC_DECISION_REQUESTED
        assert req_kwargs["key"] == "TSLA"
        req_event: FinOSEvent = req_kwargs["event"]
        assert req_event.event_type == "decision.requested"
        assert req_event.entity_id == "TSLA"
        assert req_event.correlation_id == correlation_id
        assert req_event.payload["as_of_date"] == "2026-03-31"

        # 2. decision.completed
        comp_kwargs = calls[1].kwargs
        assert comp_kwargs["topic"] == TOPIC_DECISION_COMPLETED
        assert comp_kwargs["key"] == "TSLA"
        comp_event: FinOSEvent = comp_kwargs["event"]
        assert comp_event.event_type == "decision.completed"
        assert comp_event.entity_id == "TSLA"
        assert comp_event.correlation_id == correlation_id
        assert comp_event.payload["summary"] == output.summary
        assert comp_event.payload["findings"]["action"] == "Buy"

    def test_decision_kafka_disabled(self):
        """Verify Decision Engine operates normally when Kafka is disabled."""
        publisher = EventPublisher(enabled=False)
        agent = TradingAgent(publisher=publisher)

        agent_input = FinOSAgentInput(
            entity_id="TSLA",
            as_of_date="2026-03-31",
            context={"market": "NASDAQ"},
        )

        output = agent.analyze(agent_input)
        assert output is not None
        assert output.entity_id == "TSLA"
        assert output.agent_name == "Trading Agent"
        assert isinstance(output.findings, TradingProposal)

    def test_decision_requested_failure_isolation(self, mock_producer):
        """Verify decision.requested failure does not stop Decision Engine execution."""
        publisher = EventPublisher(enabled=True, producer=mock_producer)
        # Mock publish_decision_requested to fail
        with mock.patch.object(publisher, "publish_decision_requested", side_effect=Exception("Requested publish fail")):
            agent = TradingAgent(publisher=publisher)
            agent_input = FinOSAgentInput(
                entity_id="TSLA",
                as_of_date="2026-03-31",
                context={"correlation_id": "test-req-fail-corr"},
            )

            output = agent.analyze(agent_input)
            assert output is not None
            assert output.entity_id == "TSLA"
            assert output.agent_name == "Trading Agent"
            assert isinstance(output.findings, TradingProposal)

    def test_decision_completed_failure_isolation(self, mock_producer):
        """Verify decision.completed failure does not alter Decision Engine output."""
        mock_producer.publish.side_effect = Exception("Kafka connection lost")
        publisher = EventPublisher(enabled=True, producer=mock_producer)
        agent = TradingAgent(publisher=publisher)

        agent_input = FinOSAgentInput(
            entity_id="TSLA",
            as_of_date="2026-03-31",
            context={"correlation_id": "test-comp-fail-corr"},
        )

        output = agent.analyze(agent_input)
        assert output is not None
        assert output.entity_id == "TSLA"
        assert output.agent_name == "Trading Agent"
        assert isinstance(output.findings, TradingProposal)

    def test_decision_correlation_id_consistency(self, mock_producer):
        """Verify correlation_id is consistent across decision.requested and decision.completed."""
        publisher = EventPublisher(enabled=True, producer=mock_producer)
        agent = TradingAgent(publisher=publisher)
        correlation_id = "corr-fixed-12345"

        agent_input = FinOSAgentInput(
            entity_id="AAPL",
            as_of_date="2026-03-31",
            context={"correlation_id": correlation_id},
        )

        agent.analyze(agent_input)

        calls = mock_producer.publish.call_args_list
        assert len(calls) == 2

        req_event: FinOSEvent = calls[0].kwargs["event"]
        comp_event: FinOSEvent = calls[1].kwargs["event"]

        assert req_event.correlation_id == correlation_id
        assert comp_event.correlation_id == correlation_id


class TestGraphEngineDecisionIntegration:
    """Tests for Graph Engine execution with Decision Engine Kafka events enabled."""

    def test_graph_engine_decision_events_emission(self, mock_producer):
        publisher = EventPublisher(enabled=True, producer=mock_producer)
        engine = FinosGraphEngine()
        engine.publisher = publisher

        # Inject publisher into all agents
        for agent_attr in [
            "news_agent",
            "macro_agent",
            "credit_agent",
            "investment_agent",
            "risk_agent",
            "portfolio_agent",
            "trading_agent",
            "tax_agent",
            "fraud_agent",
            "report_agent",
        ]:
            setattr(getattr(engine, agent_attr), "publisher", publisher)

        correlation_id = str(uuid.uuid4())
        state = engine.execute(
            entity_id="TATAMOTORS.NS",
            as_of_date="2026-03-31",
            request="Evaluate trade setup",
            context={"correlation_id": correlation_id},
        )

        assert state is not None
        assert state["entity_id"] == "TATAMOTORS.NS"

        # Check all published topics
        published_calls = mock_producer.publish.call_args_list
        topics_called = [call.kwargs["topic"] for call in published_calls]

        assert TOPIC_DECISION_REQUESTED in topics_called
        assert TOPIC_DECISION_COMPLETED in topics_called

        # Find decision.requested event
        dec_req_calls = [c for c in published_calls if c.kwargs["topic"] == TOPIC_DECISION_REQUESTED]
        assert len(dec_req_calls) >= 1
        dec_req_event: FinOSEvent = dec_req_calls[0].kwargs["event"]
        assert dec_req_event.event_type == "decision.requested"
        assert dec_req_event.correlation_id == correlation_id
        assert dec_req_event.entity_id == "TATAMOTORS.NS"

        # Find decision.completed event
        dec_comp_calls = [c for c in published_calls if c.kwargs["topic"] == TOPIC_DECISION_COMPLETED]
        assert len(dec_comp_calls) >= 1
        dec_comp_event: FinOSEvent = dec_comp_calls[0].kwargs["event"]
        assert dec_comp_event.event_type == "decision.completed"
        assert dec_comp_event.correlation_id == correlation_id
        assert dec_comp_event.entity_id == "TATAMOTORS.NS"
