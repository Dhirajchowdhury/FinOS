"""Unit and integration tests for Phase 6F Application Event Bridge, FastAPI REST & WebSocket endpoints."""

import asyncio
import json
import uuid
from unittest import mock

import pytest
from starlette.testclient import TestClient

from finos.api.app import app, ws_manager
from finos.core.messaging.config import KafkaConfig
from finos.core.messaging.event_bridge import KafkaEventBridge, WebSocketManager
from finos.core.messaging.events import FinOSEvent
from finos.core.messaging.publisher import EventPublisher

pytestmark = pytest.mark.integration


@pytest.fixture
def client():
    """FastAPI TestClient fixture."""
    with TestClient(app) as test_client:
        yield test_client


class TestWebSocketManager:
    """Tests for WebSocketManager connection pooling and event broadcasting."""

    def test_ws_manager_connection_lifecycle(self):
        async def run_test():
            manager = WebSocketManager()
            assert manager.active_connections_count() == 0

            mock_ws = mock.AsyncMock()
            mock_ws.client_state = 1  # CONNECTED

            await manager.connect(mock_ws)
            assert manager.active_connections_count() == 1

            manager.disconnect(mock_ws)
            assert manager.active_connections_count() == 0

        asyncio.run(run_test())

    def test_ws_manager_channel_scoping(self):
        async def run_test():
            manager = WebSocketManager()
            correlation_id = "test-scope-123"

            mock_ws = mock.AsyncMock()
            mock_ws.client_state = 1

            await manager.connect(mock_ws, correlation_id=correlation_id)
            assert manager.active_connections_count() == 1

            # Broadcast to matching correlation ID
            payload = {"event_type": "risk.updated", "correlation_id": correlation_id}
            sent_count = await manager.broadcast_event(payload, correlation_id=correlation_id)
            assert sent_count == 1
            mock_ws.send_json.assert_called_once_with(payload)

            # Broadcast to non-matching correlation ID
            sent_count = await manager.broadcast_event(payload, correlation_id="other-id")
            assert sent_count == 0

            manager.disconnect(mock_ws, correlation_id=correlation_id)
            assert manager.active_connections_count() == 0

        asyncio.run(run_test())


class TestKafkaEventBridge:
    """Tests for KafkaEventBridge conversion and dispatch."""

    def test_event_bridge_dispatch_event(self):
        async def run_test():
            manager = WebSocketManager()
            bridge = KafkaEventBridge(ws_manager=manager)

            event = FinOSEvent(
                event_type="decision.completed",
                event_version="1.0",
                source="Trading Agent",
                entity_id="AAPL",
                correlation_id="corr-bridge-test",
                payload={"action": "Buy", "confidence": 0.85},
            )

            mock_ws = mock.AsyncMock()
            mock_ws.client_state = 1
            await manager.connect(mock_ws, correlation_id="corr-bridge-test")

            bridge.dispatch_event(event)
            # Give background broadcast task a moment to execute
            await asyncio.sleep(0.05)

            mock_ws.send_json.assert_called_once()
            args, kwargs = mock_ws.send_json.call_args
            event_dict = args[0]
            assert event_dict["event_type"] == "decision.completed"
            assert event_dict["entity_id"] == "AAPL"
            assert event_dict["correlation_id"] == "corr-bridge-test"

        asyncio.run(run_test())

    def test_event_bridge_kafka_disabled_lifecycle(self):
        with mock.patch.dict("os.environ", {"FINOS_KAFKA_EVENTS_ENABLED": "false"}):
            bridge = KafkaEventBridge()
            assert bridge.enabled is False
            bridge.start()
            assert bridge._running is True
            bridge.stop()
            assert bridge._running is False


class TestFastAPIEndpoints:
    """Tests for FastAPI REST and WebSocket endpoints."""

    def test_health_check_endpoint(self, client):
        response = client.get("/api/v1/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "FinOS Real-Time API"
        assert "kafka_events_enabled" in data
        assert "active_websocket_connections" in data

    def test_create_and_get_analysis_rest(self, client):
        payload = {
            "entity_id": "MSFT",
            "as_of_date": "2026-03-31",
            "request": "Test trade setup assessment",
            "context": {"market": "NASDAQ"},
        }

        response = client.post("/api/v1/analysis", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "correlation_id" in data
        assert data["entity_id"] == "MSFT"
        assert data["status"] == "completed"
        assert "state" in data

        corr_id = data["correlation_id"]
        get_res = client.get(f"/api/v1/analysis/{corr_id}")
        assert get_res.status_code == 200
        get_data = get_res.json()
        assert get_data["correlation_id"] == corr_id
        assert get_data["status"] == "completed"

    def test_get_unknown_analysis_returns_404(self, client):
        response = client.get("/api/v1/analysis/non-existent-correlation-id")
        assert response.status_code == 404

    def test_websocket_events_stream(self, client):
        correlation_id = str(uuid.uuid4())
        with client.websocket_connect(f"/ws/events?correlation_id={correlation_id}") as websocket:
            websocket.send_text("ping")
            data = websocket.receive_text()
            assert data == "pong"

    def test_websocket_scoped_analysis_stream(self, client):
        correlation_id = str(uuid.uuid4())
        with client.websocket_connect(f"/ws/analysis/{correlation_id}") as websocket:
            websocket.send_text("ping")
            data = websocket.receive_text()
            assert data == "pong"


class TestEventPublisherListenerBridge:
    """Tests for EventPublisher -> KafkaEventBridge -> WebSocket broadcasting integration."""

    def test_publisher_listener_triggers_websocket(self, client):
        correlation_id = f"corr-pub-ws-{uuid.uuid4()}"

        with client.websocket_connect(f"/ws/events?correlation_id={correlation_id}") as websocket:
            payload = {
                "entity_id": "NVDA",
                "as_of_date": "2026-03-31",
                "request": "Evaluate real-time event publishing",
                "context": {"correlation_id": correlation_id},
            }
            res = client.post("/api/v1/analysis", json=payload)
            assert res.status_code == 200

            event_data = websocket.receive_json()
            assert isinstance(event_data, dict)
            assert "event_type" in event_data
            assert event_data["correlation_id"] == correlation_id
