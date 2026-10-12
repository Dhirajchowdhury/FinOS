"""FastAPI application providing REST & WebSocket endpoints for FinOS real-time events."""

from __future__ import annotations

import asyncio
import logging
import uuid
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, HTTPException, Query, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, Field

from finos.core.graph.engine import FinosGraphEngine
from finos.core.messaging.config import KafkaConfig
from finos.core.messaging.event_bridge import KafkaEventBridge, WebSocketManager
from finos.core.messaging.publisher import EventPublisher

logger = logging.getLogger(__name__)

# In-memory storage for analysis results
ANALYSIS_RESULTS: dict[str, dict[str, Any]] = {}

# Global WebSocket Manager & Event Bridge instances
ws_manager = WebSocketManager()
event_bridge = KafkaEventBridge(ws_manager=ws_manager)
graph_engine = FinosGraphEngine()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager for FastAPI app startup and shutdown."""
    logger.info("Initializing FinOS FastAPI application & Real-Time Event Bridge...")
    loop = asyncio.get_running_loop()
    event_bridge.start(loop=loop)

    # Attach event bridge listener to graph engine publisher
    if hasattr(graph_engine, "publisher") and graph_engine.publisher:
        graph_engine.publisher.add_listener(event_bridge.dispatch_event)

    yield

    logger.info("Shutting down FinOS FastAPI application...")
    event_bridge.stop()


app = FastAPI(
    title="FinOS Real-Time Event API",
    description="FastAPI REST and WebSocket API exposing real-time FinOS agent and decision workflow events.",
    version="1.0.0",
    lifespan=lifespan,
)


def get_ws_manager() -> WebSocketManager:
    """Dependency accessor for WebSocketManager."""
    return ws_manager


def get_event_bridge() -> KafkaEventBridge:
    """Dependency accessor for KafkaEventBridge."""
    return event_bridge


class AnalysisRequest(BaseModel):
    """REST request schema for initiating a FinOS analysis workflow."""
    entity_id: str = Field(..., description="Target entity ticker symbol (e.g. NVDA, AAPL, RELIANCE.NS)")
    as_of_date: str = Field(default="2026-03-31", description="Point-in-time date YYYY-MM-DD")
    request: str = Field(default="Full financial and risk assessment", description="Analysis objective")
    context: dict[str, Any] = Field(default_factory=dict, description="Optional execution context")


class AnalysisResponse(BaseModel):
    """REST response schema for completed FinOS analysis."""
    correlation_id: str
    entity_id: str
    as_of_date: str
    status: str
    state: dict[str, Any]


@app.get("/api/v1/health")
async def health_check() -> dict[str, Any]:
    """Health check endpoint returning API service & messaging status."""
    return {
        "status": "healthy",
        "service": "FinOS Real-Time API",
        "version": "1.0.0",
        "kafka_events_enabled": event_bridge.enabled,
        "active_websocket_connections": ws_manager.active_connections_count(),
    }


@app.post("/api/v1/analysis", response_model=AnalysisResponse)
async def create_analysis(payload: AnalysisRequest) -> AnalysisResponse:
    """Trigger synchronous FinOS analysis workflow and emit real-time event updates."""
    correlation_id = payload.context.get("correlation_id") or str(uuid.uuid4())
    exec_context = dict(payload.context)
    exec_context["correlation_id"] = correlation_id

    # Create dedicated EventPublisher with listener attached
    publisher = EventPublisher(enabled=event_bridge.enabled or True)
    publisher.add_listener(event_bridge.dispatch_event)

    # Attach publisher to engine & domain agents
    graph_engine.publisher = publisher
    for agent_attr in [
        "news_agent",
        "macro_agent",
        "credit_agent",
        "investment_agent",
        "risk_agent",
        "portfolio_agent",
        "trading_agent",
        "tax_agent",
        "fraud_agent",
        "report_agent",
    ]:
        setattr(getattr(graph_engine, agent_attr), "publisher", publisher)

    try:
        result_state = graph_engine.execute(
            entity_id=payload.entity_id,
            as_of_date=payload.as_of_date,
            request=payload.request,
            context=exec_context,
        )
    except Exception as exc:
        logger.error("Analysis execution error for %s: %s", payload.entity_id, exc)
        raise HTTPException(status_code=500, detail=f"Analysis execution failed: {exc}") from exc

    # Convert state to dict safely
    state_dict = result_state.model_dump() if hasattr(result_state, "model_dump") else dict(result_state)
    ANALYSIS_RESULTS[correlation_id] = state_dict

    return AnalysisResponse(
        correlation_id=correlation_id,
        entity_id=payload.entity_id,
        as_of_date=payload.as_of_date,
        status="completed",
        state=state_dict,
    )


@app.get("/api/v1/analysis/{correlation_id}")
async def get_analysis(correlation_id: str) -> dict[str, Any]:
    """Retrieve stored analysis result by correlation ID."""
    if correlation_id not in ANALYSIS_RESULTS:
        raise HTTPException(status_code=404, detail=f"Analysis with correlation_id '{correlation_id}' not found.")
    return {
        "correlation_id": correlation_id,
        "status": "completed",
        "state": ANALYSIS_RESULTS[correlation_id],
    }


@app.websocket("/ws/events")
async def websocket_events_endpoint(websocket: WebSocket, correlation_id: str | None = Query(default=None)):
    """WebSocket endpoint for receiving real-time FinOS events.

    Query params:
        correlation_id: Optional correlation ID to subscribe to a specific workflow execution.
    """
    await ws_manager.connect(websocket, correlation_id=correlation_id)
    try:
        while True:
            # Keep connection alive; accept optional ping/pong or client messages
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, correlation_id=correlation_id)
    except Exception as exc:
        logger.warning("WebSocket client connection closed with exception: %s", exc)
        ws_manager.disconnect(websocket, correlation_id=correlation_id)


@app.websocket("/ws/analysis/{correlation_id}")
async def websocket_analysis_endpoint(websocket: WebSocket, correlation_id: str):
    """Scoped WebSocket endpoint for a specific analysis workflow correlation ID."""
    await ws_manager.connect(websocket, correlation_id=correlation_id)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, correlation_id=correlation_id)
    except Exception as exc:
        logger.warning("Scoped WebSocket client connection closed with exception: %s", exc)
        ws_manager.disconnect(websocket, correlation_id=correlation_id)
