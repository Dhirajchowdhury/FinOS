"""EventPublisher abstraction for optional Kafka domain event publishing."""

from __future__ import annotations

import logging
import os
import uuid
from datetime import datetime, timezone
from typing import Any

from finos.core.agents.base import FinOSAgentOutput
from finos.core.config import FINOS_CONFIG
from finos.core.messaging.config import KafkaConfig
from finos.core.messaging.events import FinOSEvent
from finos.core.messaging.producer import KafkaProducer
from finos.core.messaging.topics import (
    TOPIC_ANALYSIS_COMPLETED,
    TOPIC_ANALYSIS_REQUESTED,
    TOPIC_COMPANY_UPDATED,
    TOPIC_DEAD_LETTER,
    TOPIC_DECISION_COMPLETED,
    TOPIC_DECISION_REQUESTED,
    TOPIC_GRAPH_UPDATED,
    TOPIC_MACRO_UPDATED,
    TOPIC_MARKET_PROCESSED,
    TOPIC_MARKET_RAW,
    TOPIC_NEWS_PROCESSED,
    TOPIC_NEWS_RAW,
    TOPIC_PORTFOLIO_UPDATED,
    TOPIC_RISK_UPDATED,
    TopicDefinition,
)
from finos.core.state.base import FinosState

logger = logging.getLogger(__name__)

# Topic mapping for domain agents
AGENT_TOPIC_MAP: dict[str, str] = {
    "News Agent": TOPIC_NEWS_PROCESSED,
    "Macro Economy Agent": TOPIC_MACRO_UPDATED,
    "Credit Agent": TOPIC_COMPANY_UPDATED,
    "Risk Agent": TOPIC_RISK_UPDATED,
    "Portfolio Agent": TOPIC_PORTFOLIO_UPDATED,
    "Trading Agent": TOPIC_DECISION_COMPLETED,
    "Report Agent": TOPIC_ANALYSIS_COMPLETED,
}


class EventPublisher:
    """Thin, optional domain event publishing abstraction over KafkaProducer.

    Ensures complete failure isolation: If Kafka is disabled or unavailable, event publishing
    fails gracefully without breaking core FinOS execution.
    """

    def __init__(
        self,
        config: dict[str, Any] | None = None,
        kafka_config: KafkaConfig | None = None,
        producer: KafkaProducer | None = None,
        enabled: bool | None = None,
    ) -> None:
        """Initialize EventPublisher.

        Args:
            config: Optional FinOS core configuration dictionary.
            kafka_config: Optional KafkaConfig instance.
            producer: Optional pre-constructed or mocked KafkaProducer instance.
            enabled: Explicit boolean override for enabling event publishing.
        """
        self._core_config = config or FINOS_CONFIG
        self._kafka_config = kafka_config
        self._producer = producer

        self._listeners: list[Any] = []

        # Check enable flag in priority: explicit arg -> env var -> core config -> False
        if enabled is not None:
            self._enabled = enabled
        else:
            raw_env = os.getenv("FINOS_KAFKA_EVENTS_ENABLED") or os.getenv("KAFKA_EVENTS_ENABLED")
            if raw_env is not None and raw_env.strip() != "":
                self._enabled = raw_env.strip().lower() in ("true", "1", "yes", "on")
            else:
                self._enabled = bool(self._core_config.get("kafka_events_enabled", False))

    @property
    def enabled(self) -> bool:
        """Return True if Kafka event publishing is enabled."""
        return self._enabled

    def add_listener(self, listener: Any) -> None:
        """Register an in-memory listener callback for event bridge forwarding."""
        if listener not in self._listeners:
            self._listeners.append(listener)

    def remove_listener(self, listener: Any) -> None:
        """Remove an in-memory listener callback."""
        if listener in self._listeners:
            self._listeners.remove(listener)

    def _notify_listeners(self, event: FinOSEvent, topic: str) -> None:
        """Notify in-memory listeners safely."""
        for listener in self._listeners:
            try:
                listener(event, topic)
            except Exception as exc:
                logger.warning("EventPublisher: Listener error (%s): %s", listener, exc)

    def _get_producer(self) -> KafkaProducer | None:
        """Lazily initialize KafkaProducer if enabled."""
        if not self._enabled:
            return None

        if self._producer is not None:
            return self._producer

        try:
            k_cfg = self._kafka_config or KafkaConfig.from_env()
            self._producer = KafkaProducer(config=k_cfg)
            return self._producer
        except Exception as exc:
            logger.warning("EventPublisher: Failed to instantiate KafkaProducer (%s). Disabling events.", exc)
            return None

    def publish_event(
        self,
        event: FinOSEvent,
        topic: str | TopicDefinition | None = None,
        key: str | bytes | None = None,
    ) -> bool:
        """Publish a FinOSEvent with failure isolation.

        Returns:
            True if event was successfully queued/published, False otherwise.
        """
        target_topic = str(topic.name) if isinstance(topic, TopicDefinition) else (topic or TOPIC_GRAPH_UPDATED)
        target_key = key or event.entity_id

        # Notify in-memory event bridge listeners if registered
        self._notify_listeners(event, target_topic)

        if not self._enabled:
            return False

        producer = self._get_producer()
        if producer is None:
            return False

        try:
            producer.publish(topic=target_topic, event=event, key=target_key, block=False)
            return True
        except Exception as exc:
            logger.warning(
                "EventPublisher: Non-fatal failure publishing event '%s' to topic '%s': %s",
                event.event_type,
                target_topic,
                exc,
            )
            return False

    def publish_news_raw(
        self,
        entity_id: str,
        as_of_date: str,
        raw_payload: dict[str, Any],
        correlation_id: str,
        source: str = "yfinance_news_dataflows",
        key: str | bytes | None = None,
    ) -> bool:
        """Publish a news.raw event to finos.news.raw topic."""
        if not self._enabled:
            return False

        event = FinOSEvent(
            event_type="news.raw",
            event_version="1.0",
            source=source,
            entity_id=entity_id,
            entity_type="equity",
            correlation_id=correlation_id,
            payload={
                "as_of_date": as_of_date,
                **raw_payload,
            },
        )
        return self.publish_event(event, topic=TOPIC_NEWS_RAW, key=key or entity_id)

    def publish_news_processed(
        self,
        agent_output: FinOSAgentOutput,
        correlation_id: str,
    ) -> bool:
        """Publish a news.processed event to finos.news.processed topic."""
        if not self._enabled:
            return False

        payload_dict = (
            agent_output.model_dump()
            if hasattr(agent_output, "model_dump")
            else agent_output.dict()
            if hasattr(agent_output, "dict")
            else dict(agent_output)
        )

        event = FinOSEvent(
            event_type="news.processed",
            event_version="1.0",
            source=agent_output.agent_name,
            entity_id=agent_output.entity_id,
            entity_type="equity",
            correlation_id=correlation_id,
            payload=payload_dict,
        )
        return self.publish_event(event, topic=TOPIC_NEWS_PROCESSED, key=agent_output.entity_id)

    def publish_market_raw(
        self,
        entity_id: str,
        as_of_date: str,
        raw_payload: dict[str, Any],
        correlation_id: str,
        source: str = "yfinance_market_dataflows",
        key: str | bytes | None = None,
    ) -> bool:
        """Publish a market.raw event to finos.market.raw topic."""
        if not self._enabled:
            return False

        event = FinOSEvent(
            event_type="market.raw",
            event_version="1.0",
            source=source,
            entity_id=entity_id,
            entity_type="equity",
            correlation_id=correlation_id,
            payload={
                "as_of_date": as_of_date,
                **raw_payload,
            },
        )
        return self.publish_event(event, topic=TOPIC_MARKET_RAW, key=key or entity_id)

    def publish_market_processed(
        self,
        entity_id: str,
        as_of_date: str,
        processed_payload: dict[str, Any] | FinOSAgentOutput,
        correlation_id: str,
        source: str = "MarketProcessor",
        key: str | bytes | None = None,
    ) -> bool:
        """Publish a market.processed event to finos.market.processed topic."""
        if not self._enabled:
            return False

        if isinstance(processed_payload, FinOSAgentOutput):
            payload_dict = (
                processed_payload.model_dump()
                if hasattr(processed_payload, "model_dump")
                else processed_payload.dict()
                if hasattr(processed_payload, "dict")
                else dict(processed_payload)
            )
            source_name = processed_payload.agent_name
        else:
            payload_dict = processed_payload
            source_name = source

        event = FinOSEvent(
            event_type="market.processed",
            event_version="1.0",
            source=source_name,
            entity_id=entity_id,
            entity_type="equity",
            correlation_id=correlation_id,
            payload={
                "as_of_date": as_of_date,
                **payload_dict,
            } if isinstance(payload_dict, dict) and "as_of_date" not in payload_dict else payload_dict,
        )
        return self.publish_event(event, topic=TOPIC_MARKET_PROCESSED, key=key or entity_id)

    def publish_macro_updated(
        self,
        agent_output: FinOSAgentOutput,
        correlation_id: str,
        key: str | bytes | None = None,
    ) -> bool:
        """Publish a macro.updated event to finos.macro.updated topic."""
        if not self._enabled:
            return False

        payload_dict = (
            agent_output.model_dump()
            if hasattr(agent_output, "model_dump")
            else agent_output.dict()
            if hasattr(agent_output, "dict")
            else dict(agent_output)
        )

        event = FinOSEvent(
            event_type="macro.updated",
            event_version="1.0",
            source=agent_output.agent_name,
            entity_id=agent_output.entity_id,
            entity_type="macro_series",
            correlation_id=correlation_id,
            payload=payload_dict,
        )
        return self.publish_event(event, topic=TOPIC_MACRO_UPDATED, key=key or agent_output.entity_id)

    def publish_risk_updated(
        self,
        agent_output: FinOSAgentOutput,
        correlation_id: str,
        key: str | bytes | None = None,
    ) -> bool:
        """Publish a risk.updated event to finos.risk.updated topic."""
        if not self._enabled:
            return False

        payload_dict = (
            agent_output.model_dump()
            if hasattr(agent_output, "model_dump")
            else agent_output.dict()
            if hasattr(agent_output, "dict")
            else dict(agent_output)
        )

        event = FinOSEvent(
            event_type="risk.updated",
            event_version="1.0",
            source=agent_output.agent_name,
            entity_id=agent_output.entity_id,
            entity_type="equity",
            correlation_id=correlation_id,
            payload=payload_dict,
        )
        return self.publish_event(event, topic=TOPIC_RISK_UPDATED, key=key or agent_output.entity_id)

    def publish_portfolio_updated(
        self,
        agent_output: FinOSAgentOutput,
        correlation_id: str,
        key: str | bytes | None = None,
    ) -> bool:
        """Publish a portfolio.updated event to finos.portfolio.updated topic."""
        if not self._enabled:
            return False

        payload_dict = (
            agent_output.model_dump()
            if hasattr(agent_output, "model_dump")
            else agent_output.dict()
            if hasattr(agent_output, "dict")
            else dict(agent_output)
        )

        event = FinOSEvent(
            event_type="portfolio.updated",
            event_version="1.0",
            source=agent_output.agent_name,
            entity_id=agent_output.entity_id,
            entity_type="equity",
            correlation_id=correlation_id,
            payload=payload_dict,
        )
        return self.publish_event(event, topic=TOPIC_PORTFOLIO_UPDATED, key=key or agent_output.entity_id)

    def publish_decision_requested(
        self,
        entity_id: str,
        as_of_date: str,
        correlation_id: str,
        source: str = "Trading Agent",
        context: dict[str, Any] | None = None,
        key: str | bytes | None = None,
    ) -> bool:
        """Publish a decision.requested event to finos.decision.requested topic."""
        if not self._enabled:
            return False

        event = FinOSEvent(
            event_type="decision.requested",
            event_version="1.0",
            source=source,
            entity_id=entity_id,
            entity_type="equity",
            correlation_id=correlation_id,
            payload={
                "as_of_date": as_of_date,
                "context": context or {},
                "status": "requested",
            },
        )
        return self.publish_event(event, topic=TOPIC_DECISION_REQUESTED, key=key or entity_id)

    def publish_decision_completed(
        self,
        agent_output: FinOSAgentOutput,
        correlation_id: str,
        key: str | bytes | None = None,
    ) -> bool:
        """Publish a decision.completed event to finos.decision.completed topic."""
        if not self._enabled:
            return False

        payload_dict = (
            agent_output.model_dump()
            if hasattr(agent_output, "model_dump")
            else agent_output.dict()
            if hasattr(agent_output, "dict")
            else dict(agent_output)
        )

        event = FinOSEvent(
            event_type="decision.completed",
            event_version="1.0",
            source=agent_output.agent_name,
            entity_id=agent_output.entity_id,
            entity_type="equity",
            correlation_id=correlation_id,
            payload=payload_dict,
        )
        return self.publish_event(event, topic=TOPIC_DECISION_COMPLETED, key=key or agent_output.entity_id)

    def publish_analysis_requested(
        self,
        entity_id: str,
        as_of_date: str,
        request: str,
        correlation_id: str,
        entity_type: str = "equity",
        market: str = "NSE India",
        context: dict[str, Any] | None = None,
    ) -> bool:
        """Publish an analysis.requested event to finos.analysis.requested topic."""
        if not self._enabled:
            return False

        event = FinOSEvent(
            event_type="analysis.requested",
            event_version="1.0",
            source="FinosGraphEngine",
            entity_id=entity_id,
            entity_type=entity_type,
            correlation_id=correlation_id,
            payload={
                "as_of_date": as_of_date,
                "request": request,
                "market": market,
                "context": context or {},
                "status": "requested",
            },
        )
        return self.publish_event(event, topic=TOPIC_ANALYSIS_REQUESTED, key=entity_id)

    def publish_analysis_completed(
        self,
        entity_id: str,
        as_of_date: str,
        correlation_id: str,
        report_output: dict[str, Any] | FinOSAgentOutput | None = None,
        data_quality: dict[str, Any] | None = None,
    ) -> bool:
        """Publish an analysis.completed event to finos.analysis.completed topic."""
        if not self._enabled:
            return False

        if isinstance(report_output, FinOSAgentOutput):
            payload_dict = (
                report_output.model_dump()
                if hasattr(report_output, "model_dump")
                else report_output.dict()
                if hasattr(report_output, "dict")
                else dict(report_output)
            )
        else:
            payload_dict = report_output or {}

        event = FinOSEvent(
            event_type="analysis.completed",
            event_version="1.0",
            source="FinosGraphEngine",
            entity_id=entity_id,
            entity_type="equity",
            correlation_id=correlation_id,
            payload={
                "as_of_date": as_of_date,
                "status": "completed",
                "report": payload_dict,
                "data_quality": data_quality or {},
            },
        )
        return self.publish_event(event, topic=TOPIC_ANALYSIS_COMPLETED, key=entity_id)

    def publish_agent_started(
        self,
        agent_name: str,
        entity_id: str,
        entity_type: str,
        as_of_date: str,
        correlation_id: str,
        context: dict[str, Any] | None = None,
    ) -> bool:
        """Publish an agent execution started event."""
        if not self._enabled:
            return False

        event = FinOSEvent(
            event_type=f"{agent_name.lower().replace(' ', '_')}.started",
            event_version="1.0",
            source=agent_name,
            entity_id=entity_id,
            entity_type=entity_type,
            correlation_id=correlation_id,
            payload={
                "as_of_date": as_of_date,
                "context": context or {},
                "status": "started",
            },
        )
        return self.publish_event(event, topic=TOPIC_ANALYSIS_REQUESTED, key=entity_id)

    def publish_agent_completed(
        self,
        agent_output: FinOSAgentOutput,
        correlation_id: str,
        topic: str | TopicDefinition | None = None,
    ) -> bool:
        """Publish an agent execution completed event."""
        if not self._enabled:
            return False

        target_topic = topic or AGENT_TOPIC_MAP.get(agent_output.agent_name, TOPIC_GRAPH_UPDATED)

        payload_dict = (
            agent_output.model_dump()
            if hasattr(agent_output, "model_dump")
            else agent_output.dict()
            if hasattr(agent_output, "dict")
            else dict(agent_output)
        )

        event = FinOSEvent(
            event_type=f"{agent_output.agent_name.lower().replace(' ', '_')}.completed",
            event_version="1.0",
            source=agent_output.agent_name,
            entity_id=agent_output.entity_id,
            entity_type="equity",
            correlation_id=correlation_id,
            payload=payload_dict,
        )
        return self.publish_event(event, topic=target_topic, key=agent_output.entity_id)

    def publish_agent_failed(
        self,
        agent_name: str,
        entity_id: str,
        entity_type: str,
        as_of_date: str,
        correlation_id: str,
        error_message: str,
    ) -> bool:
        """Publish an agent execution failed event."""
        if not self._enabled:
            return False

        event = FinOSEvent(
            event_type=f"{agent_name.lower().replace(' ', '_')}.failed",
            event_version="1.0",
            source=agent_name,
            entity_id=entity_id,
            entity_type=entity_type,
            correlation_id=correlation_id,
            payload={
                "as_of_date": as_of_date,
                "error_message": error_message,
                "status": "failed",
            },
        )
        return self.publish_event(event, topic=TOPIC_DEAD_LETTER, key=entity_id)

    def publish_graph_state_updated(
        self,
        state: FinosState,
        stage_name: str,
        correlation_id: str,
    ) -> bool:
        """Publish a FinosState progression event."""
        if not self._enabled:
            return False

        entity_id = state.get("entity_id", "UNKNOWN")
        entity_type = state.get("entity_type", "equity")

        event = FinOSEvent(
            event_type=f"graph.{stage_name}",
            event_version="1.0",
            source="FinosGraphEngine",
            entity_id=entity_id,
            entity_type=entity_type,
            correlation_id=correlation_id,
            payload={
                "stage": stage_name,
                "sender": state.get("sender", "system"),
                "as_of_date": state.get("as_of_date", ""),
                "data_quality": state.get("data_quality", {}),
            },
        )
        return self.publish_event(event, topic=TOPIC_GRAPH_UPDATED, key=entity_id)

    def close(self) -> None:
        """Close underlying producer if active."""
        if self._producer is not None:
            try:
                self._producer.close()
            except Exception as exc:
                logger.warning("EventPublisher: Error closing producer: %s", exc)
            finally:
                self._producer = None
