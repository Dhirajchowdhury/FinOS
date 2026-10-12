"""Domain-specific Kafka messaging exceptions for FinOS Core."""

from __future__ import annotations


class FinOSKafkaError(Exception):
    """Base exception for all FinOS Kafka messaging errors."""

    def __init__(self, message: str, cause: Exception | None = None) -> None:
        super().__init__(message)
        self.cause = cause
        if isinstance(cause, BaseException):
            self.__cause__ = cause



class KafkaConfigurationError(FinOSKafkaError):
    """Raised when Kafka configuration settings are invalid or missing."""

    pass


class KafkaConnectionError(FinOSKafkaError):
    """Raised when establishing or maintaining connection to Kafka broker fails."""

    pass


class KafkaSerializationError(FinOSKafkaError):
    """Raised when event payload serialization or deserialization fails."""

    pass


class KafkaPublishError(FinOSKafkaError):
    """Raised when producing/publishing an event to Kafka fails."""

    pass


class KafkaConsumeError(FinOSKafkaError):
    """Raised when consuming an event from Kafka fails."""

    pass


class KafkaTopicError(FinOSKafkaError):
    """Raised when topic operations (creation, describe, deletion) fail."""

    pass
