"""FinOS Kafka Consumer wrapper for reliable event consumption."""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Callable, Sequence
from confluent_kafka import Consumer, KafkaError, TopicPartition

from finos.core.messaging.config import KafkaConfig
from finos.core.messaging.errors import (
    KafkaConfigurationError,
    KafkaConnectionError,
    KafkaConsumeError,
    KafkaSerializationError,
    KafkaTopicError,
)
from finos.core.messaging.events import FinOSEvent
from finos.core.messaging.producer import KafkaProducer
from finos.core.messaging.topics import TOPIC_DEAD_LETTER, TopicDefinition

logger = logging.getLogger(__name__)

SUPPORTED_EVENT_VERSIONS = {"1.0"}


class KafkaConsumer:
    """FinOS Kafka Consumer wrapper for consuming FinOSEvent envelopes.

    Enforces explicit offset commits and reliable message processing pipeline:
    - enable.auto.commit = False (explicit commit after successful handler execution)
    - auto.offset.reset = 'earliest'
    - explicit rebalance callbacks (on_assign, on_revoke, on_lost)
    """

    def __init__(
        self,
        group_id: str,
        config: KafkaConfig | None = None,
        auto_offset_reset: str = "earliest",
        enable_auto_commit: bool = False,
        consumer: Any | None = None,
        dlq_producer: KafkaProducer | None = None,
        dlq_topic: str = TOPIC_DEAD_LETTER,
    ) -> None:
        """Initialize KafkaConsumer.

        Args:
            group_id: Mandatory consumer group identifier (e.g., 'finos-news-agent').
            config: Optional KafkaConfig instance. Defaults to environment settings if None.
            auto_offset_reset: Offset reset strategy ('earliest', 'latest', 'error').
            enable_auto_commit: Explicitly set auto commit (defaults to False for manual commits).
            consumer: Optional pre-constructed or mocked confluent_kafka.Consumer for testing.
            dlq_producer: Optional KafkaProducer instance for sending failed events to DLQ.
            dlq_topic: Topic name for dead-letter events (defaults to 'finos.dead-letter').

        Raises:
            KafkaConfigurationError: If group_id is empty or invalid.
        """
        if not isinstance(group_id, str) or not group_id.strip():
            raise KafkaConfigurationError("group_id must be a non-empty string.")

        self.group_id = group_id.strip()
        self._config = config
        self.auto_offset_reset = auto_offset_reset
        self.enable_auto_commit = enable_auto_commit
        self._consumer = consumer
        self._dlq_producer = dlq_producer
        self.dlq_topic = dlq_topic

        self._running = False
        self._closed = False
        self._subscribed_topics: list[str] = []
        self._assigned_partitions: list[TopicPartition] = []

    @property
    def config(self) -> KafkaConfig:
        if self._config is None:
            self._config = KafkaConfig.from_env()
        return self._config

    def _get_consumer_config(self) -> dict[str, Any]:
        """Construct confluent-kafka Consumer configuration dictionary."""
        base_dict = self.config.to_librdkafka_dict()

        consumer_opts: dict[str, Any] = {
            "group.id": self.group_id,
            "auto.offset.reset": self.auto_offset_reset,
            "enable.auto.commit": self.enable_auto_commit,
        }

        for k, v in consumer_opts.items():
            base_dict[k] = v

        return base_dict

    def _get_consumer(self) -> Any:
        """Lazily initialize confluent_kafka.Consumer."""
        if self._closed:
            raise KafkaConsumeError("Cannot perform consumer action: KafkaConsumer is closed.")

        if self._consumer is not None:
            return self._consumer

        try:
            cfg = self._get_consumer_config()
            self._consumer = Consumer(cfg)
            return self._consumer
        except Exception as exc:
            raise KafkaConnectionError(f"Failed to instantiate confluent_kafka.Consumer: {exc}", cause=exc) from exc

    def _on_assign(self, consumer: Any, partitions: list[TopicPartition]) -> None:
        """Rebalance callback when partitions are assigned to this consumer."""
        self._assigned_partitions = partitions
        part_str = ", ".join(f"{p.topic}[{p.partition}]" for p in partitions)
        logger.info("Kafka consumer assigned partitions | group_id=%s partitions=[%s]", self.group_id, part_str)

    def _on_revoke(self, consumer: Any, partitions: list[TopicPartition]) -> None:
        """Rebalance callback when partitions are about to be revoked from this consumer."""
        part_str = ", ".join(f"{p.topic}[{p.partition}]" for p in partitions)
        logger.info("Kafka consumer revoked partitions | group_id=%s partitions=[%s]", self.group_id, part_str)
        # Commit offsets before revocation if manual commit is active
        if not self.enable_auto_commit and self._consumer is not None:
            try:
                self._consumer.commit(asynchronous=False)
            except Exception as exc:
                logger.warning("Error committing offsets during partition revocation: %s", exc)
        self._assigned_partitions = []

    def _on_lost(self, consumer: Any, partitions: list[TopicPartition]) -> None:
        """Rebalance callback when partition ownership is lost.

        CRITICAL: Does NOT commit offsets when ownership is lost.
        """
        part_str = ", ".join(f"{p.topic}[{p.partition}]" for p in partitions)
        logger.warning("Kafka consumer lost partition ownership | group_id=%s partitions=[%s]", self.group_id, part_str)
        self._assigned_partitions = []

    def subscribe(self, topics: Sequence[TopicDefinition | str]) -> None:
        """Subscribe consumer to a list of TopicDefinition objects or topic name strings.

        Args:
            topics: Sequence of topics to subscribe to.

        Raises:
            KafkaTopicError: If topics list is empty or contains invalid topic names.
        """
        if not topics:
            raise KafkaTopicError("Topics list for subscription cannot be empty.")

        resolved_names: list[str] = []
        for t in topics:
            if isinstance(t, TopicDefinition):
                resolved_names.append(t.name)
            elif isinstance(t, str):
                name = t.strip()
                if not name:
                    raise KafkaTopicError("Topic name in subscription cannot be empty.")
                resolved_names.append(name)
            else:
                raise KafkaTopicError(f"Invalid topic type in subscription: {type(t).__name__}")

        consumer = self._get_consumer()
        try:
            consumer.subscribe(
                resolved_names,
                on_assign=self._on_assign,
                on_revoke=self._on_revoke,
                on_lost=self._on_lost,
            )
            self._subscribed_topics = resolved_names
            logger.info("Kafka consumer subscribed to topics | group_id=%s topics=%s", self.group_id, resolved_names)
        except Exception as exc:
            raise KafkaTopicError(f"Failed to subscribe to topics {resolved_names}: {exc}", cause=exc) from exc

    def poll_and_process_one(
        self,
        handler: Callable[[FinOSEvent], None],
        timeout: float = 1.0,
    ) -> bool:
        """Poll for a single message, deserialize, execute handler, and commit offset on success.

        Args:
            handler: Callable accepting deserialized FinOSEvent.
            timeout: Maximum poll wait time in seconds.

        Returns:
            True if a message was successfully processed and committed, False if poll timed out or was empty.

        Raises:
            KafkaConsumeError: On broker transport error.
            KafkaSerializationError: On invalid event envelope or unsupported schema version.
            Exception: Re-raises handler exceptions without committing offset.
        """
        if self._closed:
            raise KafkaConsumeError("Cannot poll: KafkaConsumer is closed.")

        consumer = self._get_consumer()
        try:
            msg = consumer.poll(timeout=timeout)
        except Exception as exc:
            raise KafkaConsumeError(f"Kafka consumer poll failed: {exc}", cause=exc) from exc

        if msg is None:
            return False

        # 1. Transport / Broker Error Check
        if msg.error():
            if msg.error().code() == KafkaError._PARTITION_EOF:
                return False
            raise KafkaConsumeError(f"Broker returned transport error: {msg.error()}", cause=msg.error())

        raw_val = msg.value()
        topic_name = msg.topic()
        partition = msg.partition()
        offset = msg.offset()

        # 2. Deserialization & Event Envelope Validation
        try:
            event = FinOSEvent.deserialize(raw_val)
        except Exception as exc:
            err = KafkaSerializationError(f"Deserialization failed for message on '{topic_name}': {exc}", cause=exc)
            self._send_to_dlq_if_configured(raw_val, topic_name, err)
            raise err from exc

        # 3. Event Version Validation
        if event.event_version not in SUPPORTED_EVENT_VERSIONS:
            err = KafkaSerializationError(
                f"Unsupported event_version '{event.event_version}' for event '{event.event_id}'. Supported: {sorted(SUPPORTED_EVENT_VERSIONS)}"
            )
            self._send_to_dlq_if_configured(raw_val, topic_name, err, event=event)
            raise err

        # 4. Execute Caller Handler
        try:
            handler(event)
        except Exception as exc:
            logger.error(
                "Handler exception during message processing | event_id=%s topic=%s partition=%s offset=%s error=%s",
                event.event_id,
                topic_name,
                partition,
                offset,
                exc,
            )
            self._send_to_dlq_if_configured(raw_val, topic_name, exc, event=event)
            # DO NOT COMMIT OFFSET ON HANDLER FAILURE
            raise

        # 5. Commit Offset Explicitly After Handler Success
        if not self.enable_auto_commit:
            try:
                consumer.commit(msg, asynchronous=False)
                logger.info(
                    "Kafka message processed & offset committed | event_id=%s topic=%s partition=%s offset=%s",
                    event.event_id,
                    topic_name,
                    partition,
                    offset,
                )
            except Exception as exc:
                raise KafkaConsumeError(f"Failed to commit offset for event '{event.event_id}': {exc}", cause=exc) from exc

        return True

    def consume(
        self,
        handler: Callable[[FinOSEvent], None],
        max_messages: int | None = None,
        timeout: float = 1.0,
    ) -> int:
        """Controlled polling loop over subscribed topics.

        Args:
            handler: Callable accepting deserialized FinOSEvent.
            max_messages: Maximum number of messages to consume before returning (None for continuous loop).
            timeout: Bounded timeout per poll in seconds.

        Returns:
            Number of successfully processed messages.
        """
        self._running = True
        processed_count = 0

        try:
            while self._running:
                if max_messages is not None and processed_count >= max_messages:
                    break

                processed = self.poll_and_process_one(handler, timeout=timeout)
                if processed:
                    processed_count += 1
        finally:
            self._running = False

        return processed_count

    def _send_to_dlq_if_configured(
        self,
        raw_val: bytes | None,
        topic: str,
        error: Exception,
        event: FinOSEvent | None = None,
    ) -> None:
        """Helper to transform failed event and publish to dead-letter queue if dlq_producer is set."""
        if self._dlq_producer is None:
            return

        dlq_payload = {
            "original_event_id": event.event_id if event else "UNKNOWN",
            "original_event_type": event.event_type if event else "UNKNOWN",
            "original_topic": topic,
            "correlation_id": event.correlation_id if event else str(uuid.uuid4()),
            "error_type": type(error).__name__,
            "error_message": str(error),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

        dlq_event = FinOSEvent(
            event_type="dead_letter.recorded",
            event_version="1.0",
            source=f"consumer-{self.group_id}",
            entity_id=event.entity_id if event else "UNKNOWN",
            correlation_id=dlq_payload["correlation_id"],
            payload=dlq_payload,
        )

        try:
            self._dlq_producer.publish(self.dlq_topic, dlq_event)
            logger.info("Sent failed message to DLQ topic '%s'", self.dlq_topic)
        except Exception as exc:
            logger.warning("Failed to publish to DLQ topic '%s': %s", self.dlq_topic, exc)

    def stop(self) -> None:
        """Signal consumption loop to stop processing further messages."""
        self._running = False

    def close(self) -> None:
        """Gracefully close Kafka consumer, releasing cluster resources.

        Safe to invoke multiple times idempotently.
        """
        if self._closed:
            return

        self._running = False
        self._closed = True

        if self._consumer is not None:
            try:
                self._consumer.close()
                logger.info("Kafka consumer closed cleanly | group_id=%s", self.group_id)
            except Exception as exc:
                logger.warning("Error closing Kafka consumer: %s", exc)
            finally:
                self._consumer = None
