"""Centralized Kafka topic registry and topic definitions for FinOS Core."""

from __future__ import annotations

from enum import Enum
from typing import Any
from pydantic import BaseModel, Field, field_validator

from finos.core.messaging.errors import KafkaTopicError


class TopicCategory(str, Enum):
    """Categorical classification of FinOS topics."""

    RAW_INGESTION = "raw_ingestion"
    PROCESSED_DATA = "processed_data"
    AGENT_UPDATE = "agent_update"
    WORKFLOW_GRAPH = "workflow_graph"
    ANALYSIS_REQUEST = "analysis_request"
    DECISION_STATE = "decision_state"
    SYSTEM = "system"


class TopicDefinition(BaseModel):
    """Configuration definition for a Kafka topic in FinOS.

    Attributes:
        name: Full Kafka topic name string (e.g., 'finos.news.raw').
        num_partitions: Number of topic partitions (local dev default: 3 for standard, 1 for dead-letter).
        replication_factor: Topic replication factor (local dev default: 1).
        category: Categorical group of the topic.
        description: Terse purpose description of the topic.
        config: Optional topic-level configuration overrides (e.g. retention.ms).
    """

    name: str = Field(..., description="Unique Kafka topic name.")
    num_partitions: int = Field(default=3, ge=1, description="Partition count.")
    replication_factor: int = Field(default=1, ge=1, description="Replication factor.")
    category: TopicCategory = Field(default=TopicCategory.PROCESSED_DATA, description="Topic classification.")
    description: str = Field(default="", description="Topic description.")
    config: dict[str, str] = Field(default_factory=dict, description="Topic level configuration parameters.")

    @field_validator("name")
    @classmethod
    def validate_topic_name(cls, v: str) -> str:
        cleaned = v.strip()
        if not cleaned:
            raise KafkaTopicError("Topic name cannot be empty.")
        if not cleaned.startswith("finos."):
            raise KafkaTopicError(f"Topic name '{v}' must start with standard namespace prefix 'finos.'")
        return cleaned


# Centralized FinOS Topic Constants
TOPIC_NEWS_RAW = "finos.news.raw"
TOPIC_NEWS_PROCESSED = "finos.news.processed"

TOPIC_MARKET_RAW = "finos.market.raw"
TOPIC_MARKET_PROCESSED = "finos.market.processed"

TOPIC_MACRO_UPDATED = "finos.macro.updated"

TOPIC_COMPANY_UPDATED = "finos.company.updated"
TOPIC_GRAPH_UPDATED = "finos.graph.updated"

TOPIC_RISK_UPDATED = "finos.risk.updated"
TOPIC_PORTFOLIO_UPDATED = "finos.portfolio.updated"

TOPIC_ANALYSIS_REQUESTED = "finos.analysis.requested"
TOPIC_ANALYSIS_COMPLETED = "finos.analysis.completed"

TOPIC_DECISION_REQUESTED = "finos.decision.requested"
TOPIC_DECISION_COMPLETED = "finos.decision.completed"

TOPIC_DEAD_LETTER = "finos.dead-letter"


class TopicRegistry:
    """Centralized registry of all FinOS Kafka topic definitions."""

    _TOPICS: dict[str, TopicDefinition] = {
        TOPIC_NEWS_RAW: TopicDefinition(
            name=TOPIC_NEWS_RAW,
            num_partitions=3,
            replication_factor=1,
            category=TopicCategory.RAW_INGESTION,
            description="Raw ingested headlines, RSS feeds, and financial news items.",
        ),
        TOPIC_NEWS_PROCESSED: TopicDefinition(
            name=TOPIC_NEWS_PROCESSED,
            num_partitions=3,
            replication_factor=1,
            category=TopicCategory.PROCESSED_DATA,
            description="Parsed and sentiment-scored news assessment events.",
        ),
        TOPIC_MARKET_RAW: TopicDefinition(
            name=TOPIC_MARKET_RAW,
            num_partitions=3,
            replication_factor=1,
            category=TopicCategory.RAW_INGESTION,
            description="Raw tick data, price snapshots, and OHLCV feed events.",
        ),
        TOPIC_MARKET_PROCESSED: TopicDefinition(
            name=TOPIC_MARKET_PROCESSED,
            num_partitions=3,
            replication_factor=1,
            category=TopicCategory.PROCESSED_DATA,
            description="Normalized market indicators, volatility, and volume analytics.",
        ),
        TOPIC_MACRO_UPDATED: TopicDefinition(
            name=TOPIC_MACRO_UPDATED,
            num_partitions=3,
            replication_factor=1,
            category=TopicCategory.AGENT_UPDATE,
            description="Macroeconomic regime, CPI, FRED, and rate decision events.",
        ),
        TOPIC_COMPANY_UPDATED: TopicDefinition(
            name=TOPIC_COMPANY_UPDATED,
            num_partitions=3,
            replication_factor=1,
            category=TopicCategory.AGENT_UPDATE,
            description="Corporate fundamental updates, 10-K/10-Q filing events.",
        ),
        TOPIC_GRAPH_UPDATED: TopicDefinition(
            name=TOPIC_GRAPH_UPDATED,
            num_partitions=3,
            replication_factor=1,
            category=TopicCategory.WORKFLOW_GRAPH,
            description="FinosState progression and graph execution state updates.",
        ),
        TOPIC_RISK_UPDATED: TopicDefinition(
            name=TOPIC_RISK_UPDATED,
            num_partitions=3,
            replication_factor=1,
            category=TopicCategory.AGENT_UPDATE,
            description="Risk Agent debate consensus and drawdown assessment updates.",
        ),
        TOPIC_PORTFOLIO_UPDATED: TopicDefinition(
            name=TOPIC_PORTFOLIO_UPDATED,
            num_partitions=3,
            replication_factor=1,
            category=TopicCategory.AGENT_UPDATE,
            description="Portfolio allocation updates and concentration limit signals.",
        ),
        TOPIC_ANALYSIS_REQUESTED: TopicDefinition(
            name=TOPIC_ANALYSIS_REQUESTED,
            num_partitions=3,
            replication_factor=1,
            category=TopicCategory.ANALYSIS_REQUEST,
            description="Trigger requests for end-to-end multi-agent financial analysis.",
        ),
        TOPIC_ANALYSIS_COMPLETED: TopicDefinition(
            name=TOPIC_ANALYSIS_COMPLETED,
            num_partitions=3,
            replication_factor=1,
            category=TopicCategory.ANALYSIS_REQUEST,
            description="Final Report Agent output events containing full executive summaries.",
        ),
        TOPIC_DECISION_REQUESTED: TopicDefinition(
            name=TOPIC_DECISION_REQUESTED,
            num_partitions=3,
            replication_factor=1,
            category=TopicCategory.DECISION_STATE,
            description="Trading proposal generation requests.",
        ),
        TOPIC_DECISION_COMPLETED: TopicDefinition(
            name=TOPIC_DECISION_COMPLETED,
            num_partitions=3,
            replication_factor=1,
            category=TopicCategory.DECISION_STATE,
            description="Final trade execution decisions and order routing parameters.",
        ),
        TOPIC_DEAD_LETTER: TopicDefinition(
            name=TOPIC_DEAD_LETTER,
            num_partitions=1,
            replication_factor=1,
            category=TopicCategory.SYSTEM,
            description="Dead-letter topic for unparseable or rejected event envelopes.",
            config={"retention.ms": "604800000"},  # 7 days retention
        ),
    }

    @classmethod
    def get(cls, topic_name: str) -> TopicDefinition:
        """Get topic definition by topic name. Raises KafkaTopicError if unregistered."""
        if topic_name not in cls._TOPICS:
            raise KafkaTopicError(f"Topic '{topic_name}' is not registered in TopicRegistry.")
        return cls._TOPICS[topic_name]

    @classmethod
    def list_all(cls) -> list[TopicDefinition]:
        """Return all registered topic definitions."""
        return list(cls._TOPICS.values())

    @classmethod
    def list_names(cls) -> list[str]:
        """Return list of all registered topic names."""
        return list(cls._TOPICS.keys())

    @classmethod
    def is_registered(cls, topic_name: str) -> bool:
        """Check whether topic name is registered."""
        return topic_name in cls._TOPICS
