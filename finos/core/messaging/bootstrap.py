"""Topic bootstrap CLI utility for FinOS Core."""

from __future__ import annotations

import sys
from typing import Any

from finos.core.messaging.admin import KafkaAdmin
from finos.core.messaging.config import KafkaConfig
from finos.core.messaging.errors import FinOSKafkaError, KafkaTopicError
from finos.core.messaging.topics import TopicDefinition, TopicRegistry


def run_bootstrap(
    config: KafkaConfig | None = None,
    admin: KafkaAdmin | None = None,
) -> dict[str, str]:
    """Idempotently create and verify all FinOS topics defined in TopicRegistry.

    Args:
        config: Optional KafkaConfig instance.
        admin: Optional pre-constructed or mocked KafkaAdmin instance.

    Returns:
        Dictionary mapping topic names to status string ('CREATED', 'ALREADY EXISTS', 'MISMATCH', 'FAILED').
    """
    if config is None:
        config = KafkaConfig.from_env()

    if admin is None:
        admin = KafkaAdmin(config=config)

    print(f"Connecting to Kafka broker(s) for topic bootstrap: {config.bootstrap_servers}...")

    registered_topics = TopicRegistry.list_all()
    results: dict[str, str] = {}

    try:
        existing_topics = set(admin.list_topics(timeout=5.0))
    except Exception as exc:
        print(f"[BOOTSTRAP ERROR]: Unable to connect to Kafka broker: {exc}")
        for t in registered_topics:
            results[t.name] = "FAILED"
        return results

    missing_topics: list[TopicDefinition] = []

    for t_def in registered_topics:
        if t_def.name in existing_topics:
            # Check for topic configuration / partition mismatch
            try:
                desc = admin.describe_topic(t_def.name, timeout=5.0)
                actual_partitions = desc.get("partition_count", 0)
                if actual_partitions != t_def.num_partitions:
                    print(
                        f"  [MISMATCH] Topic '{t_def.name}' exists with {actual_partitions} partitions "
                        f"(requested: {t_def.num_partitions})"
                    )
                    results[t_def.name] = "MISMATCH"
                else:
                    results[t_def.name] = "ALREADY EXISTS"
            except Exception:
                results[t_def.name] = "ALREADY EXISTS"
        else:
            missing_topics.append(t_def)

    if missing_topics:
        print(f"Creating {len(missing_topics)} missing FinOS topic(s)...")
        for t_def in missing_topics:
            try:
                success = admin.create_topic(t_def)
                if success:
                    results[t_def.name] = "CREATED"
                    print(f"  [CREATED] {t_def.name} (partitions: {t_def.num_partitions}, replication: {t_def.replication_factor})")
                else:
                    results[t_def.name] = "FAILED"
                    print(f"  [FAILED] Could not create topic '{t_def.name}'")
            except Exception as exc:
                results[t_def.name] = "FAILED"
                print(f"  [FAILED] Exception creating topic '{t_def.name}': {exc}")
    else:
        print("All registered FinOS topics already exist on the cluster.")

    print("\n--- Topic Bootstrap Summary ---")
    for name, status in results.items():
        print(f"  {name:<30} -> {status}")

    return results


def main() -> None:
    """CLI entry point for python -m finos.core.messaging.bootstrap."""
    results = run_bootstrap()
    has_failed = any(status in ("FAILED", "MISMATCH") for status in results.values())
    sys.exit(1 if has_failed or not results else 0)


if __name__ == "__main__":
    main()
