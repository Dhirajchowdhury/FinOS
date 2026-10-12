"""Typed Kafka configuration abstraction for FinOS Core."""

from __future__ import annotations

import os
from typing import Any
from pydantic import BaseModel, Field, field_validator

from finos.core.messaging.errors import KafkaConfigurationError


class KafkaConfig(BaseModel):
    """Typed configuration for Kafka messaging in FinOS Core.

    Supports FINOS_KAFKA_* environment variables with fallbacks to KAFKA_*
    and TRADINGAGENTS_KAFKA_* variables.
    Provides extensible fields for future SSL and SASL authentication parameters.
    """

    bootstrap_servers: str = Field(
        default="localhost:9092",
        description="Comma-separated list of host:port Kafka broker addresses.",
    )
    client_id: str = Field(
        default="finos-core-client",
        description="Client identifier for Kafka connections.",
    )
    security_protocol: str = Field(
        default="PLAINTEXT",
        description="Protocol used to communicate with brokers (PLAINTEXT, SSL, SASL_PLAINTEXT, SASL_SSL).",
    )

    # Extensible Security & Auth fields for future enterprise deployment
    sasl_mechanism: str | None = Field(
        default=None,
        description="SASL mechanism (PLAIN, GSSAPI, SCRAM-SHA-256, SCRAM-SHA-512, OAUTHBEARER).",
    )
    sasl_username: str | None = Field(
        default=None,
        description="Username for SASL authentication.",
    )
    sasl_password: str | None = Field(
        default=None,
        description="Password for SASL authentication.",
    )
    ssl_ca_location: str | None = Field(
        default=None,
        description="Path to CA certificate file for SSL validation.",
    )
    ssl_certificate_location: str | None = Field(
        default=None,
        description="Path to client certificate for SSL mutual authentication.",
    )
    ssl_key_location: str | None = Field(
        default=None,
        description="Path to client key for SSL mutual authentication.",
    )

    # Additional generic driver options
    extra_config: dict[str, Any] = Field(
        default_factory=dict,
        description="Additional low-level librdkafka / confluent-kafka configuration parameters.",
    )

    @field_validator("bootstrap_servers")
    @classmethod
    def validate_bootstrap_servers(cls, v: str) -> str:
        cleaned = v.strip()
        if not cleaned:
            raise KafkaConfigurationError("bootstrap_servers cannot be empty.")
        return cleaned

    @field_validator("security_protocol")
    @classmethod
    def validate_security_protocol(cls, v: str) -> str:
        valid_protocols = {"PLAINTEXT", "SSL", "SASL_PLAINTEXT", "SASL_SSL"}
        norm = v.strip().upper()
        if norm not in valid_protocols:
            raise KafkaConfigurationError(
                f"Invalid security_protocol '{v}'. Must be one of {sorted(valid_protocols)}"
            )
        return norm

    def to_librdkafka_dict(self) -> dict[str, Any]:
        """Convert KafkaConfig into a confluent-kafka / librdkafka compatible dictionary."""
        config: dict[str, Any] = {
            "bootstrap.servers": self.bootstrap_servers,
            "client.id": self.client_id,
            "security.protocol": self.security_protocol.lower(),
        }

        if self.sasl_mechanism:
            config["sasl.mechanism"] = self.sasl_mechanism
        if self.sasl_username:
            config["sasl.username"] = self.sasl_username
        if self.sasl_password:
            config["sasl.password"] = self.sasl_password
        if self.ssl_ca_location:
            config["ssl.ca.location"] = self.ssl_ca_location
        if self.ssl_certificate_location:
            config["ssl.certificate.location"] = self.ssl_certificate_location
        if self.ssl_key_location:
            config["ssl.key.location"] = self.ssl_key_location

        # Layer any extra client overrides
        config.update(self.extra_config)
        return config

    @classmethod
    def from_env(cls) -> KafkaConfig:
        """Instantiate KafkaConfig by querying environment variables in priority order.

        Priority order:
        1. FINOS_KAFKA_*
        2. KAFKA_*
        3. TRADINGAGENTS_KAFKA_*
        4. Sensible local defaults
        """

        def _get_var(key: str, default: str) -> str:
            finos_val = os.getenv(f"FINOS_KAFKA_{key.upper()}")
            if finos_val and finos_val.strip():
                return finos_val.strip()
            kafka_val = os.getenv(f"KAFKA_{key.upper()}")
            if kafka_val and kafka_val.strip():
                return kafka_val.strip()
            ta_val = os.getenv(f"TRADINGAGENTS_KAFKA_{key.upper()}")
            if ta_val and ta_val.strip():
                return ta_val.strip()
            return default

        try:
            return cls(
                bootstrap_servers=_get_var("bootstrap_servers", "localhost:9092"),
                client_id=_get_var("client_id", "finos-core-client"),
                security_protocol=_get_var("security_protocol", "PLAINTEXT"),
                sasl_mechanism=os.getenv("FINOS_KAFKA_SASL_MECHANISM") or os.getenv("KAFKA_SASL_MECHANISM"),
                sasl_username=os.getenv("FINOS_KAFKA_SASL_USERNAME") or os.getenv("KAFKA_SASL_USERNAME"),
                sasl_password=os.getenv("FINOS_KAFKA_SASL_PASSWORD") or os.getenv("KAFKA_SASL_PASSWORD"),
                ssl_ca_location=os.getenv("FINOS_KAFKA_SSL_CA_LOCATION") or os.getenv("KAFKA_SSL_CA_LOCATION"),
            )
        except Exception as exc:
            if isinstance(exc, KafkaConfigurationError):
                raise
            raise KafkaConfigurationError(f"Failed to build KafkaConfig from environment: {exc}", cause=exc) from exc
