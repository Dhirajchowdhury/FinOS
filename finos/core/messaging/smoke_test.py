"""End-to-end smoke test CLI utility for FinOS Core Kafka messaging."""

from __future__ import annotations

import sys
import uuid
from datetime import datetime, timezone
from typing import Any

from finos.core.messaging.admin import KafkaAdmin
from finos.core.messaging.config import KafkaConfig
from finos.core.messaging.consumer import KafkaConsumer
from finos.core.messaging.errors import FinOSKafkaError
from finos.core.messaging.events import FinOSEvent
from finos.core.messaging.producer import KafkaProducer
from finos.core.messaging.topics import TopicCategory, TopicDefinition

SMOKE_TEST_TOPIC = "finos.test.smoke"
SMOKE_TEST_GROUP = "finos.test.smoke.group"

SMOKE_TEST_TOPIC_DEF = TopicDefinition(
    name=SMOKE_TEST_TOPIC,
    num_partitions=1,
    replication_factor=1,
    category=TopicCategory.SYSTEM,
    description="Dedicated topic for Kafka end-to-end smoke testing.",
)


def run_smoke_test(
    config: KafkaConfig | None = None,
    admin: KafkaAdmin | None = None,
    producer: KafkaProducer | None = None,
    consumer: KafkaConsumer | None = None,
) -> bool:
    """Execute end-to-end smoke test over dedicated finos.test.smoke topic.

    Args:
        config: Optional KafkaConfig instance.
        admin: Optional KafkaAdmin instance.
        producer: Optional KafkaProducer instance.
        consumer: Optional KafkaConsumer instance.

    Returns:
        True if produce-consume-validate pipeline succeeds, False otherwise.
    """
    if config is None:
        config = KafkaConfig.from_env()

    if admin is None:
        admin = KafkaAdmin(config=config)

    if producer is None:
        producer = KafkaProducer(config=config)

    if consumer is None:
        consumer = KafkaConsumer(
            group_id=SMOKE_TEST_GROUP,
            config=config,
            auto_offset_reset="earliest",
            enable_auto_commit=False,
        )

    print(f"Starting Kafka Smoke Test on topic '{SMOKE_TEST_TOPIC}'...")

    try:
        # Step 1: Ensure dedicated smoke test topic exists
        print("1. Verifying/creating dedicated smoke test topic...")
        admin.create_topic(SMOKE_TEST_TOPIC_DEF)

        # Step 2: Create test event payload
        test_event_id = str(uuid.uuid4())
        test_correlation_id = str(uuid.uuid4())
        test_event = FinOSEvent(
            event_id=test_event_id,
            event_type="smoke.test.event",
            event_version="1.0",
            source="finos-smoke-test",
            entity_id="SMOKE_ENTITY",
            correlation_id=test_correlation_id,
            payload={"smoke_test_run": True, "timestamp": datetime.now(timezone.utc).isoformat()},
        )

        # Step 3: Publish event
        print(f"2. Publishing test event (event_id={test_event_id})...")
        report = producer.publish(SMOKE_TEST_TOPIC, test_event, key="SMOKE_KEY", block=True, timeout=5.0)
        if report.error:
            raise report.error

        print(f"   Published to partition {report.partition} at offset {report.offset}.")

        # Step 4: Consume and validate event
        print("3. Consuming test event...")
        consumer.subscribe([SMOKE_TEST_TOPIC])

        received_events: list[FinOSEvent] = []

        def smoke_handler(evt: FinOSEvent) -> None:
            received_events.append(evt)

        # Bounded poll for message
        for _ in range(10):
            processed = consumer.poll_and_process_one(smoke_handler, timeout=1.0)
            if processed:
                break

        if not received_events:
            raise FinOSKafkaError("Smoke test failed: No event consumed within timeout.")

        consumed_event = received_events[0]

        # Step 5: Validate event payload integrity
        print("4. Validating event fields...")
        assert consumed_event.event_id == test_event_id, "Mismatch in event_id"
        assert consumed_event.event_type == "smoke.test.event", "Mismatch in event_type"
        assert consumed_event.correlation_id == test_correlation_id, "Mismatch in correlation_id"
        assert consumed_event.payload.get("smoke_test_run") is True, "Mismatch in payload contents"

        print("[SMOKE TEST RESULT]: PASS")
        print("   All event envelope fields validated successfully.")
        return True

    except Exception as exc:
        print(f"[SMOKE TEST RESULT]: FAIL")
        print(f"   Error Type: {type(exc).__name__}")
        print(f"   Error Details: {exc}")
        return False
    finally:
        try:
            producer.close()
            consumer.close()
        except Exception:
            pass


def main() -> None:
    """CLI entry point for python -m finos.core.messaging.smoke_test."""
    success = run_smoke_test()
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
