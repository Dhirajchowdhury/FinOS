"""FinOS Kafka Producer wrapper for reliable event publishing."""

from __future__ import annotations

import logging
from typing import Any, Callable
from confluent_kafka import Producer

from finos.core.messaging.config import KafkaConfig
from finos.core.messaging.errors import (
    KafkaConfigurationError,
    KafkaConnectionError,
    KafkaPublishError,
    KafkaSerializationError,
    KafkaTopicError,
)
from finos.core.messaging.events import FinOSEvent
from finos.core.messaging.topics import TopicDefinition

logger = logging.getLogger(__name__)


class DeliveryReport:
    """Container for delivery report metadata.

    Attributes:
        event_id: Unique event ID.
        correlation_id: Tracing correlation ID.
        topic: Destination topic name.
        key: Message partition key.
        partition: Assigned partition index (populated upon delivery).
        offset: Assigned message offset (populated upon delivery).
        error: Delivery exception if publishing failed.
        completed: Boolean indicating callback completion.
    """

    def __init__(self, event_id: str, correlation_id: str, topic: str, key: str | None = None) -> None:
        self.event_id = event_id
        self.correlation_id = correlation_id
        self.topic = topic
        self.key = key
        self.partition: int | None = None
        self.offset: int | None = None
        self.error: Exception | None = None
        self.completed: bool = False


class KafkaProducer:
    """FinOS Kafka Producer wrapper for publishing FinOSEvent envelopes.

    Enforces idempotent and reliable producer configuration:
    - enable.idempotence = True
    - acks = 'all'
    - retries = 5
    - max.in.flight.requests.per.connection = 5
    """

    def __init__(
        self,
        config: KafkaConfig | None = None,
        producer: Any | None = None,
    ) -> None:
        """Initialize KafkaProducer.

        Args:
            config: Optional KafkaConfig instance. Defaults to environment settings if None.
            producer: Optional pre-constructed or mocked confluent_kafka.Producer for testing.
        """
        self._config = config
        self._producer = producer
        self._closed = False
        self._last_delivery_error: Exception | None = None

    @property
    def config(self) -> KafkaConfig:
        if self._config is None:
            self._config = KafkaConfig.from_env()
        return self._config

    def _get_producer_config(self) -> dict[str, Any]:
        """Construct confluent-kafka Producer configuration dictionary with strict reliability settings."""
        base_dict = self.config.to_librdkafka_dict()

        # Strict reliability defaults
        reliability_defaults: dict[str, Any] = {
            "enable.idempotence": True,
            "acks": "all",
            "retries": 5,
            "max.in.flight.requests.per.connection": 5,
        }

        for k, v in reliability_defaults.items():
            if k not in base_dict:
                base_dict[k] = v

        in_flight = base_dict.get("max.in.flight.requests.per.connection", 5)
        if isinstance(in_flight, int) and in_flight > 5:
            raise KafkaConfigurationError(
                f"max.in.flight.requests.per.connection must be <= 5 for idempotent delivery (got {in_flight})."
            )

        return base_dict

    def _get_producer(self) -> Any:
        """Lazily initialize confluent_kafka.Producer."""
        if self._closed:
            raise KafkaPublishError("Cannot publish message: KafkaProducer is closed.")

        if self._producer is not None:
            return self._producer

        try:
            producer_dict = self._get_producer_config()
            self._producer = Producer(producer_dict)
            return self._producer
        except Exception as exc:
            raise KafkaConnectionError(f"Failed to instantiate confluent_kafka.Producer: {exc}", cause=exc) from exc

    def publish(
        self,
        topic: TopicDefinition | str,
        event: FinOSEvent,
        key: str | bytes | None = None,
        on_delivery: Callable[[DeliveryReport], None] | None = None,
        block: bool = False,
        timeout: float = 10.0,
    ) -> DeliveryReport:
        """Publish a FinOSEvent to a Kafka topic.

        Args:
            topic: TopicDefinition object or topic name string.
            event: Validated FinOSEvent instance.
            key: Optional message partition key (str or bytes).
            on_delivery: Optional custom callback invoked upon delivery success or failure.
            block: If True, flushes immediately and waits for delivery confirmation.
            timeout: Maximum wait time in seconds if block=True.

        Returns:
            DeliveryReport tracking publishing state and metadata.

        Raises:
            KafkaSerializationError: If event parameter is invalid or fails serialization.
            KafkaTopicError: If topic name is empty or invalid.
            KafkaPublishError: If producing or delivery fails.
        """
        if self._closed:
            raise KafkaPublishError("Cannot publish message: KafkaProducer is closed.")

        # 1. Topic validation
        if isinstance(topic, TopicDefinition):
            topic_name = topic.name
        elif isinstance(topic, str):
            topic_name = topic.strip()
            if not topic_name:
                raise KafkaTopicError("Topic name cannot be empty.")
        else:
            raise KafkaTopicError(f"Invalid topic parameter type: {type(topic).__name__}")

        # 2. Event validation
        if not isinstance(event, FinOSEvent):
            raise KafkaSerializationError(
                f"Producer requires a FinOSEvent instance, got {type(event).__name__}"
            )

        # 3. Serialization
        try:
            payload_bytes = event.serialize_bytes()
        except Exception as exc:
            if isinstance(exc, KafkaSerializationError):
                raise
            raise KafkaSerializationError(f"Event serialization failed: {exc}", cause=exc) from exc

        # 4. Key encoding
        key_bytes: bytes | None = None
        key_str: str | None = None
        if key is not None:
            if isinstance(key, bytes):
                key_bytes = key
                key_str = key.decode("utf-8", errors="replace")
            elif isinstance(key, str):
                key_str = key
                key_bytes = key.encode("utf-8")
            else:
                raise KafkaSerializationError(f"Invalid message key type: {type(key).__name__}")

        report = DeliveryReport(
            event_id=event.event_id,
            correlation_id=event.correlation_id,
            topic=topic_name,
            key=key_str,
        )

        def _internal_delivery_callback(err: Any, msg: Any) -> None:
            if err is not None:
                err_msg = str(err)
                exc = KafkaPublishError(
                    f"Delivery failed for event '{event.event_id}' on topic '{topic_name}': {err_msg}"
                )
                report.error = exc
                self._last_delivery_error = exc
                logger.error(
                    "Kafka message delivery failed | event_id=%s correlation_id=%s topic=%s key=%s error=%s",
                    event.event_id,
                    event.correlation_id,
                    topic_name,
                    key_str,
                    err_msg,
                )
            else:
                report.partition = msg.partition() if hasattr(msg, "partition") else None
                report.offset = msg.offset() if hasattr(msg, "offset") else None
                logger.info(
                    "Kafka message delivered | event_id=%s correlation_id=%s topic=%s partition=%s offset=%s",
                    event.event_id,
                    event.correlation_id,
                    topic_name,
                    report.partition,
                    report.offset,
                )

            report.completed = True
            if on_delivery:
                try:
                    on_delivery(report)
                except Exception as exc:
                    logger.warning("Custom on_delivery callback raised error: %s", exc)

        # 5. Produce to Kafka
        producer = self._get_producer()
        try:
            producer.produce(
                topic=topic_name,
                value=payload_bytes,
                key=key_bytes,
                on_delivery=_internal_delivery_callback,
            )
            producer.poll(0)
        except Exception as exc:
            raise KafkaPublishError(
                f"Failed to queue event '{event.event_id}' for topic '{topic_name}': {exc}",
                cause=exc,
            ) from exc

        if block:
            self.flush(timeout=timeout)
            if report.error:
                raise report.error

        return report

    def flush(self, timeout: float = 10.0) -> int:
        """Flush pending messages in the producer queue.

        Args:
            timeout: Maximum wait time in seconds.

        Returns:
            Number of messages still remaining in queue (0 on complete success).

        Raises:
            KafkaPublishError: If flushing times out or undelivered messages remain.
        """
        if self._closed:
            return 0

        if self._producer is None:
            return 0

        try:
            remaining = self._producer.flush(timeout=timeout)
            if remaining > 0:
                raise KafkaPublishError(
                    f"Flush timeout: {remaining} messages remained undelivered after {timeout}s."
                )

            if self._last_delivery_error:
                exc = self._last_delivery_error
                self._last_delivery_error = None
                raise exc

            return remaining
        except Exception as exc:
            if isinstance(exc, KafkaPublishError):
                raise
            raise KafkaPublishError(f"Kafka producer flush operation failed: {exc}", cause=exc) from exc

    def close(self, timeout: float = 10.0) -> None:
        """Gracefully close the producer, flushing all outstanding messages.

        Safe to call multiple times idempotently.
        """
        if self._closed:
            return

        self._closed = True
        if self._producer is not None:
            try:
                self._producer.flush(timeout=timeout)
            except Exception as exc:
                logger.warning("Error flushing producer during close: %s", exc)
            finally:
                self._producer = None
