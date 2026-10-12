"""FinOS Core Kafka Messaging Foundation Package.

Provides application-level event envelopes, topic definitions, typed configuration,
admin abstractions, producer, consumer, event publisher, and operational CLI tooling.
"""

from finos.core.messaging.admin import KafkaAdmin
from finos.core.messaging.bootstrap import run_bootstrap
from finos.core.messaging.config import KafkaConfig
from finos.core.messaging.consumer import KafkaConsumer
from finos.core.messaging.errors import (
    FinOSKafkaError,
    KafkaConfigurationError,
    KafkaConnectionError,
    KafkaConsumeError,
    KafkaPublishError,
    KafkaSerializationError,
    KafkaTopicError,
)
from finos.core.messaging.events import FinOSEvent
from finos.core.messaging.healthcheck import run_healthcheck
from finos.core.messaging.producer import DeliveryReport, KafkaProducer
from finos.core.messaging.publisher import EventPublisher
from finos.core.messaging.smoke_test import run_smoke_test
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
    TopicCategory,
    TopicDefinition,
    TopicRegistry,
)

__all__ = [
    # Config
    "KafkaConfig",
    # Event Envelope
    "FinOSEvent",
    # Topic Registry & Definitions
    "TopicCategory",
    "TopicDefinition",
    "TopicRegistry",
    "TOPIC_NEWS_RAW",
    "TOPIC_NEWS_PROCESSED",
    "TOPIC_MARKET_RAW",
    "TOPIC_MARKET_PROCESSED",
    "TOPIC_MACRO_UPDATED",
    "TOPIC_COMPANY_UPDATED",
    "TOPIC_GRAPH_UPDATED",
    "TOPIC_RISK_UPDATED",
    "TOPIC_PORTFOLIO_UPDATED",
    "TOPIC_ANALYSIS_REQUESTED",
    "TOPIC_ANALYSIS_COMPLETED",
    "TOPIC_DECISION_REQUESTED",
    "TOPIC_DECISION_COMPLETED",
    "TOPIC_DEAD_LETTER",
    # Admin
    "KafkaAdmin",
    # Producer, Consumer & Publisher
    "KafkaProducer",
    "DeliveryReport",
    "KafkaConsumer",
    "EventPublisher",
    # Operational Tools
    "run_healthcheck",
    "run_bootstrap",
    "run_smoke_test",
    # Errors
    "FinOSKafkaError",
    "KafkaConfigurationError",
    "KafkaConnectionError",
    "KafkaSerializationError",
    "KafkaPublishError",
    "KafkaConsumeError",
    "KafkaTopicError",
]
