"""Unit tests for Phase 6D Risk, Portfolio, and Analysis Lifecycle Kafka event integration."""

import uuid
from unittest import mock

import pytest

from finos.core.agents.base import FinOSAgentInput
from finos.core.agents.portfolio import PortfolioAgent, PortfolioAssessment
from finos.core.agents.risk import RiskAgent, RiskAssessment
from finos.core.graph.engine import FinosGraphEngine
from finos.core.messaging.events import FinOSEvent
from finos.core.messaging.publisher import EventPublisher
from finos.core.messaging.topics import (
    TOPIC_ANALYSIS_COMPLETED,
    TOPIC_ANALYSIS_REQUESTED,
    TOPIC_PORTFOLIO_UPDATED,
    TOPIC_RISK_UPDATED,
)


@pytest.fixture
def mock_producer():
    """Mock KafkaProducer instance."""
    with mock.patch("finos.core.messaging.publisher.KafkaProducer") as mock_cls:
        instance = mock_cls.return_value
        instance.publish.return_value = True
        yield instance


class TestRiskKafkaIntegration:
    """Tests for Risk Agent Kafka event publishing."""

    def test_risk_updated_event_publication(self, mock_producer):
        publisher = EventPublisher(enabled=True, producer=mock_producer)
        agent = RiskAgent(publisher=publisher)
        correlation_id = str(uuid.uuid4())

        agent_input = FinOSAgentInput(
            entity_id="NVDA",
            as_of_date="2026-03-31",
            context={
                "correlation_id": correlation_id,
                "investment_plan": "Bullish GPU demand expansion thesis",
                "credit_report": "Strong balance sheet with minimal net debt",
            },
        )

        output = agent.analyze(agent_input)

        assert output is not None
        assert output.entity_id == "NVDA"
        assert output.agent_name == "Risk Agent"
        assert isinstance(output.findings, RiskAssessment)

        # Verify risk.updated event published
        assert mock_producer.publish.call_count == 1
        args, kwargs = mock_producer.publish.call_args
        assert kwargs["topic"] == TOPIC_RISK_UPDATED
        assert kwargs["key"] == "NVDA"

        event: FinOSEvent = kwargs["event"]
        assert event.event_type == "risk.updated"
        assert event.entity_id == "NVDA"
        assert event.correlation_id == correlation_id
        assert event.payload["summary"] == output.summary

    def test_risk_kafka_disabled(self):
        publisher = EventPublisher(enabled=False)
        agent = RiskAgent(publisher=publisher)

        agent_input = FinOSAgentInput(
            entity_id="NVDA",
            as_of_date="2026-03-31",
            context={"investment_plan": "Growth plan"},
        )

        output = agent.analyze(agent_input)
        assert output is not None
        assert output.agent_name == "Risk Agent"

    def test_risk_kafka_failure_isolation(self, mock_producer):
        mock_producer.publish.side_effect = Exception("Kafka cluster offline")
        publisher = EventPublisher(enabled=True, producer=mock_producer)
        agent = RiskAgent(publisher=publisher)

        agent_input = FinOSAgentInput(
            entity_id="NVDA",
            as_of_date="2026-03-31",
            context={"correlation_id": "test-risk-corr"},
        )

        output = agent.analyze(agent_input)
        assert output is not None
        assert output.entity_id == "NVDA"
        assert output.agent_name == "Risk Agent"


class TestPortfolioKafkaIntegration:
    """Tests for Portfolio Agent Kafka event publishing."""

    def test_portfolio_updated_event_publication(self, mock_producer):
        publisher = EventPublisher(enabled=True, producer=mock_producer)
        agent = PortfolioAgent(publisher=publisher)
        correlation_id = str(uuid.uuid4())

        agent_input = FinOSAgentInput(
            entity_id="AAPL",
            as_of_date="2026-03-31",
            context={
                "correlation_id": correlation_id,
                "portfolio_context": "Current cash balance: $50,000",
                "holdings": [{"symbol": "AAPL", "weight_pct": 4.5}],
            },
        )

        output = agent.analyze(agent_input)

        assert output is not None
        assert output.entity_id == "AAPL"
        assert output.agent_name == "Portfolio Agent"
        assert isinstance(output.findings, PortfolioAssessment)

        # Verify portfolio.updated event published
        assert mock_producer.publish.call_count == 1
        args, kwargs = mock_producer.publish.call_args
        assert kwargs["topic"] == TOPIC_PORTFOLIO_UPDATED
        assert kwargs["key"] == "AAPL"

        event: FinOSEvent = kwargs["event"]
        assert event.event_type == "portfolio.updated"
        assert event.entity_id == "AAPL"
        assert event.correlation_id == correlation_id
        assert event.payload["summary"] == output.summary

    def test_portfolio_kafka_disabled(self):
        publisher = EventPublisher(enabled=False)
        agent = PortfolioAgent(publisher=publisher)

        agent_input = FinOSAgentInput(
            entity_id="AAPL",
            as_of_date="2026-03-31",
        )

        output = agent.analyze(agent_input)
        assert output is not None
        assert output.agent_name == "Portfolio Agent"

    def test_portfolio_kafka_failure_isolation(self, mock_producer):
        mock_producer.publish.side_effect = Exception("Kafka network error")
        publisher = EventPublisher(enabled=True, producer=mock_producer)
        agent = PortfolioAgent(publisher=publisher)

        agent_input = FinOSAgentInput(
            entity_id="AAPL",
            as_of_date="2026-03-31",
            context={"correlation_id": "test-port-corr"},
        )

        output = agent.analyze(agent_input)
        assert output is not None
        assert output.entity_id == "AAPL"
        assert output.agent_name == "Portfolio Agent"


class TestAnalysisLifecycleKafkaIntegration:
    """Tests for Analysis Requested & Completed lifecycle events."""

    def test_analysis_requested_and_completed_emission(self, mock_producer):
        publisher = EventPublisher(enabled=True, producer=mock_producer)
        engine = FinosGraphEngine()
        engine.publisher = publisher

        # Inject publisher into all engine agents so they use mock producer
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
            entity_id="RELIANCE.NS",
            as_of_date="2026-03-31",
            request="Full analysis request",
            context={"correlation_id": correlation_id},
        )

        assert state is not None
        assert state["entity_id"] == "RELIANCE.NS"

        # Check all published topics
        published_calls = mock_producer.publish.call_args_list
        topics_called = [call.kwargs["topic"] for call in published_calls]

        # Verify lifecycle events present
        assert TOPIC_ANALYSIS_REQUESTED in topics_called
        assert TOPIC_ANALYSIS_COMPLETED in topics_called
        assert TOPIC_RISK_UPDATED in topics_called
        assert TOPIC_PORTFOLIO_UPDATED in topics_called

        # Verify analysis.requested payload
        req_calls = [c for c in published_calls if c.kwargs["topic"] == TOPIC_ANALYSIS_REQUESTED]
        assert len(req_calls) >= 1
        req_event: FinOSEvent = req_calls[0].kwargs["event"]
        assert req_event.event_type in ("analysis.requested", "news_agent.started")
        assert req_event.correlation_id == correlation_id

        # Verify analysis.completed payload
        comp_calls = [c for c in published_calls if c.kwargs["topic"] == TOPIC_ANALYSIS_COMPLETED]
        assert len(comp_calls) >= 1
        comp_event: FinOSEvent = comp_calls[-1].kwargs["event"]
        assert comp_event.correlation_id == correlation_id

    def test_analysis_lifecycle_kafka_disabled(self):
        engine = FinosGraphEngine()
        # Publisher disabled by default
        assert engine.publisher.enabled is False

        state = engine.execute(
            entity_id="MSFT",
            as_of_date="2026-03-31",
        )

        assert state is not None
        assert state["entity_id"] == "MSFT"
        assert "report" in state
