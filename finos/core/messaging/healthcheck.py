"""Real-time Kafka healthcheck CLI utility for FinOS Core."""

from __future__ import annotations

import sys
from typing import Any

from finos.core.messaging.admin import KafkaAdmin
from finos.core.messaging.config import KafkaConfig
from finos.core.messaging.errors import FinOSKafkaError


def run_healthcheck(config: KafkaConfig | None = None, admin: KafkaAdmin | None = None) -> bool:
    """Verify real Kafka broker connectivity and metadata retrieval.

    Args:
        config: Optional KafkaConfig instance.
        admin: Optional pre-constructed or mocked KafkaAdmin instance.

    Returns:
        True if Kafka broker is reachable and metadata is retrieved, False otherwise.
    """
    if config is None:
        config = KafkaConfig.from_env()

    if admin is None:
        admin = KafkaAdmin(config=config)

    print(f"Connecting to Kafka broker(s): {config.bootstrap_servers}...")
    try:
        topics = admin.list_topics(timeout=5.0)
        print(f"[HEALTHCHECK RESULT]: PASS")
        print(f"  Broker Address: {config.bootstrap_servers}")
        print(f"  Security Protocol: {config.security_protocol}")
        print(f"  Discovered Topics Count: {len(topics)}")
        return True
    except Exception as exc:
        print(f"[HEALTHCHECK RESULT]: FAIL")
        print(f"  Broker Address: {config.bootstrap_servers}")
        print(f"  Error Type: {type(exc).__name__}")
        print(f"  Error Message: {exc}")
        return False


def main() -> None:
    """CLI entry point for python -m finos.core.messaging.healthcheck."""
    success = run_healthcheck()
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
