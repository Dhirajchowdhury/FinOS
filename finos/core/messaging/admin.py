"""Kafka Admin abstraction for topic management in FinOS Core."""

from __future__ import annotations

from typing import Any, Sequence
from confluent_kafka import KafkaError
from confluent_kafka.admin import AdminClient, NewTopic

from finos.core.messaging.config import KafkaConfig
from finos.core.messaging.errors import KafkaConnectionError, KafkaTopicError
from finos.core.messaging.topics import TopicDefinition, TopicRegistry


class KafkaAdmin:
    """FinOS Kafka Admin Client wrapper for topic creation, listing, and inspection.

    IMPORTANT: This class does NOT establish network connections or perform I/O
    on module import or class instantiation. AdminClient connection is deferred
    until explicit operation methods are invoked.
    """

    def __init__(self, config: KafkaConfig | None = None, admin_client: Any = None) -> None:
        """Initialize KafkaAdmin abstraction.

        Args:
            config: Optional KafkaConfig. If omitted, constructed from environment settings.
            admin_client: Optional pre-constructed or mocked AdminClient instance for testing.
        """
        self._config = config
        self._admin_client = admin_client

    @property
    def config(self) -> KafkaConfig:
        if self._config is None:
            self._config = KafkaConfig.from_env()
        return self._config

    def _get_client(self) -> AdminClient:
        """Return confluent-kafka AdminClient instance, creating it lazily if necessary."""
        if self._admin_client is not None:
            return self._admin_client

        try:
            client_dict = self.config.to_librdkafka_dict()
            self._admin_client = AdminClient(client_dict)
            return self._admin_client
        except Exception as exc:
            raise KafkaConnectionError(f"Failed to initialize confluent_kafka AdminClient: {exc}", cause=exc) from exc

    def create_topic(self, topic: TopicDefinition | str) -> bool:
        """Idempotently create a single Kafka topic.

        Args:
            topic: TopicDefinition object or registered topic name string.

        Returns:
            True if topic was created or already existed.
        """
        if isinstance(topic, str):
            topic_def = TopicRegistry.get(topic)
        else:
            topic_def = topic

        return self.create_topics([topic_def])[topic_def.name]

    def create_topics(self, topics: Sequence[TopicDefinition] | None = None) -> dict[str, bool]:
        """Idempotently create multiple Kafka topics.

        Args:
            topics: Sequence of TopicDefinition objects. If None, creates all topics in TopicRegistry.

        Returns:
            Dictionary mapping topic names to boolean indicating success or existing status.
        """
        if topics is None:
            topics = TopicRegistry.list_all()

        if not topics:
            return {}

        client = self._get_client()

        new_topics = [
            NewTopic(
                topic=t.name,
                num_partitions=t.num_partitions,
                replication_factor=t.replication_factor,
                config=t.config,
            )
            for t in topics
        ]

        try:
            futures = client.create_topics(new_topics)
        except Exception as exc:
            raise KafkaTopicError(f"Topic creation request failed: {exc}", cause=exc) from exc

        results: dict[str, bool] = {}
        for topic_name, future in futures.items():
            try:
                future.result()
                results[topic_name] = True
            except Exception as exc:
                # Handle idempotent creation (already exists)
                err_msg = str(exc)
                if "TOPIC_ALREADY_EXISTS" in err_msg or "already exists" in err_msg.lower():
                    results[topic_name] = True
                else:
                    raise KafkaTopicError(f"Failed to create topic '{topic_name}': {exc}", cause=exc) from exc

        return results

    def list_topics(self, timeout: float = 10.0) -> list[str]:
        """List all topics present on the Kafka cluster.

        Args:
            timeout: Maximum wait time in seconds.

        Returns:
            List of topic names.
        """
        client = self._get_client()
        try:
            metadata = client.list_topics(timeout=timeout)
            return list(metadata.topics.keys())
        except Exception as exc:
            raise KafkaConnectionError(f"Failed to list topics from Kafka cluster: {exc}", cause=exc) from exc

    def describe_topic(self, topic_name: str, timeout: float = 10.0) -> dict[str, Any]:
        """Describe topic details (partition count, metadata) from the cluster.

        Args:
            topic_name: Name of the topic.
            timeout: Maximum wait time in seconds.

        Returns:
            Dictionary containing topic metadata.
        """
        client = self._get_client()
        try:
            metadata = client.list_topics(topic=topic_name, timeout=timeout)
            if topic_name not in metadata.topics:
                raise KafkaTopicError(f"Topic '{topic_name}' not found on Kafka cluster.")

            t_meta = metadata.topics[topic_name]
            if t_meta.error is not None and t_meta.error != KafkaError._NO_ERROR:
                raise KafkaTopicError(f"Topic '{topic_name}' metadata error: {t_meta.error}")

            partitions = [
                {
                    "id": p_id,
                    "leader": p_meta.leader,
                    "replicas": p_meta.replicas,
                    "isrs": p_meta.isrs,
                }
                for p_id, p_meta in t_meta.partitions.items()
            ]

            return {
                "name": topic_name,
                "partition_count": len(partitions),
                "partitions": partitions,
            }
        except Exception as exc:
            if isinstance(exc, (KafkaTopicError, KafkaConnectionError)):
                raise
            raise KafkaTopicError(f"Failed to describe topic '{topic_name}': {exc}", cause=exc) from exc
