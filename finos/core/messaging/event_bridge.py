"""Application Event Bridge & WebSocket Manager for FinOS real-time messaging."""

from __future__ import annotations

import asyncio
import json
import logging
import os
import threading
from typing import Any
from starlette.websockets import WebSocket, WebSocketState

from finos.core.messaging.config import KafkaConfig
from finos.core.messaging.consumer import KafkaConsumer
from finos.core.messaging.events import FinOSEvent
from finos.core.messaging.topics import TopicRegistry

logger = logging.getLogger(__name__)

EVENT_BRIDGE_CONSUMER_GROUP = "finos-web-event-bridge-group"


class WebSocketManager:
    """Manages connected WebSocket clients and handles event broadcasting.

    Thread-safe & async-compatible connection pool.
    """

    def __init__(self) -> None:
        self._global_connections: set[WebSocket] = set()
        self._channel_connections: dict[str, set[WebSocket]] = {}
        self._lock = threading.Lock()

    def active_connections_count(self) -> int:
        """Return total count of active WebSocket clients."""
        with self._lock:
            channel_total = sum(len(conns) for conns in self._channel_connections.values())
            return len(self._global_connections) + channel_total

    async def connect(self, websocket: WebSocket, correlation_id: str | None = None) -> None:
        """Register a WebSocket connection."""
        await websocket.accept()
        with self._lock:
            if correlation_id:
                if correlation_id not in self._channel_connections:
                    self._channel_connections[correlation_id] = set()
                self._channel_connections[correlation_id].add(websocket)
                logger.info("WebSocket connected to channel '%s'", correlation_id)
            else:
                self._global_connections.add(websocket)
                logger.info("WebSocket connected to global events stream")

    def disconnect(self, websocket: WebSocket, correlation_id: str | None = None) -> None:
        """Unregister a WebSocket connection."""
        with self._lock:
            if correlation_id and correlation_id in self._channel_connections:
                self._channel_connections[correlation_id].discard(websocket)
                if not self._channel_connections[correlation_id]:
                    del self._channel_connections[correlation_id]
                logger.info("WebSocket disconnected from channel '%s'", correlation_id)
            else:
                self._global_connections.discard(websocket)
                logger.info("WebSocket disconnected from global stream")

    async def broadcast_event(self, event_dict: dict[str, Any], correlation_id: str | None = None) -> int:
        """Broadcast event dictionary to relevant WebSocket clients.

        Args:
            event_dict: Safe frontend event payload dictionary.
            correlation_id: Target correlation ID for scoped channel delivery.

        Returns:
            Count of clients successfully sent message.
        """
        target_sockets: set[WebSocket] = set()

        with self._lock:
            # Include global subscribers
            target_sockets.update(self._global_connections)
            # Include channel subscribers if correlation_id provided
            if correlation_id and correlation_id in self._channel_connections:
                target_sockets.update(self._channel_connections[correlation_id])

        if not target_sockets:
            return 0

        dead_sockets: list[tuple[WebSocket, str | None]] = []
        sent_count = 0

        for ws in target_sockets:
            try:
                state = getattr(ws, "client_state", None)
                if state == WebSocketState.CONNECTED or state == 1 or str(state) == "WebSocketState.CONNECTED":
                    await ws.send_json(event_dict)
                    sent_count += 1
                else:
                    dead_sockets.append((ws, correlation_id))
            except Exception as exc:
                logger.warning("Error broadcasting event to WebSocket: %s", exc)
                dead_sockets.append((ws, correlation_id))

        # Cleanup dead sockets
        for ws, cid in dead_sockets:
            self.disconnect(ws, cid)

        return sent_count


class KafkaEventBridge:
    """Application-level event bridge wrapping KafkaConsumer and WebSocketManager.

    Converts Kafka domain events into frontend-safe JSON payloads and routes them
    to connected WebSocket clients. Supports both Kafka polling and direct in-memory dispatch.
    """

    def __init__(
        self,
        ws_manager: WebSocketManager | None = None,
        kafka_config: KafkaConfig | None = None,
        consumer_group: str = EVENT_BRIDGE_CONSUMER_GROUP,
    ) -> None:
        self.ws_manager = ws_manager or WebSocketManager()
        self.kafka_config = kafka_config
        self.consumer_group = consumer_group

        self._consumer: KafkaConsumer | None = None
        self._running = False
        self._thread: threading.Thread | None = None
        self._main_loop: asyncio.AbstractEventLoop | None = None

    @property
    def enabled(self) -> bool:
        """Check if Kafka events are enabled."""
        raw_env = os.getenv("FINOS_KAFKA_EVENTS_ENABLED") or os.getenv("KAFKA_EVENTS_ENABLED")
        if raw_env is not None and raw_env.strip() != "":
            return raw_env.strip().lower() in ("true", "1", "yes", "on")
        return False

    def dispatch_event(self, event: FinOSEvent, topic: str | None = None) -> None:
        """Synchronously/in-memory dispatch a FinOSEvent to WebSocket subscribers.

        Ensures real-time updates function even when Kafka is disabled or offline.
        """
        payload = json.loads(event.serialize())
        correlation_id = event.correlation_id

        # Schedule async broadcast on current running asyncio loop if available
        try:
            loop = asyncio.get_running_loop()
            loop.create_task(self.ws_manager.broadcast_event(payload, correlation_id=correlation_id))
        except RuntimeError:
            # If called from a non-async thread without running loop
            if self._main_loop and self._main_loop.is_running():
                asyncio.run_coroutine_threadsafe(
                    self.ws_manager.broadcast_event(payload, correlation_id=correlation_id),
                    self._main_loop,
                )
            else:
                # Direct thread execution fallback
                asyncio.run(self.ws_manager.broadcast_event(payload, correlation_id=correlation_id))

    def _kafka_poll_worker(self) -> None:
        """Background thread worker function for polling Kafka events."""
        if not self.enabled:
            return

        try:
            cfg = self.kafka_config or KafkaConfig.from_env()
            self._consumer = KafkaConsumer(group_id=self.consumer_group, config=cfg)
            topics = TopicRegistry.list_all()
            self._consumer.subscribe(topics)
            logger.info("KafkaEventBridge started polling Kafka topics: %s", [t.name for t in topics])

            while self._running and not self._consumer._closed:
                try:
                    self._consumer.poll_and_process_one(handler=self.dispatch_event, timeout=1.0)
                except Exception as exc:
                    logger.warning("KafkaEventBridge poll iteration notice: %s", exc)
        except Exception as exc:
            logger.warning("KafkaEventBridge: Could not start Kafka consumer (%s). Operating in-memory mode.", exc)
        finally:
            if self._consumer:
                self._consumer.close()

    def start(self, loop: asyncio.AbstractEventLoop | None = None) -> None:
        """Start the application event bridge."""
        if self._running:
            return

        self._running = True
        try:
            self._main_loop = loop or asyncio.get_running_loop()
        except RuntimeError:
            self._main_loop = None

        if self.enabled:
            self._thread = threading.Thread(target=self._kafka_poll_worker, daemon=True, name="KafkaEventBridgeThread")
            self._thread.start()
            logger.info("KafkaEventBridge background thread launched.")
        else:
            logger.info("KafkaEventBridge operating in direct in-memory dispatch mode (Kafka disabled).")

    def stop(self) -> None:
        """Stop the application event bridge cleanly."""
        if not self._running:
            return

        self._running = False
        if self._consumer:
            self._consumer.stop()
            self._consumer.close()

        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=2.0)
        logger.info("KafkaEventBridge stopped cleanly.")
