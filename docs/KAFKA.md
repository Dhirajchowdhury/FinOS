# FinOS Kafka Messaging Architecture & Operational Guide

## 1. Overview & Architectural Role

FinOS implements an application-level event-driven messaging architecture using Apache Kafka as an **event transport mechanism**. 

Key Architectural Boundaries:
- **Event Transport Only**: Kafka functions strictly as a pub/sub bus for event propagation and inter-agent decoupling.
- **Not a Database or Workflow Engine**: Kafka does not replace state persistence (SQLite/PostgreSQL), vector search (Qdrant), or graph orchestration (`FinosGraphEngine`).
- **Synchronous Execution Preserved**: Existing synchronous DAG execution (`FinosGraphEngine.execute()`) remains intact and functional without requiring a running Kafka broker.

```text
FinOS Core Application Layer (finos/core/messaging/)
├── KafkaConfig         # Environment variable resolution & librdkafka settings
├── FinOSEvent          # Generic deterministic event envelope schema
├── TopicRegistry       # Centralized topic definitions & partition specs
├── KafkaAdmin          # Topic management & cluster introspection (lazy I/O)
├── KafkaProducer       # Reliable, idempotent event publisher
├── KafkaConsumer       # Explicit-commit consumer with rebalance callbacks
└── CLI Tools           # Healthcheck, Bootstrap, Smoke Test
```

---

## 2. Configuration & Environment Variables

Kafka settings are managed via `KafkaConfig` ([finos/core/messaging/config.py](file:///c:/Users/User/Desktop/fin/FinOS/finos/core/messaging/config.py)).

### Environment Variable Resolution Hierarchy:
1. `FINOS_KAFKA_*` (Primary standard prefix)
2. `KAFKA_*`
3. `TRADINGAGENTS_KAFKA_*`
4. Sensible local development defaults (`localhost:9092`, `finos-core-client`, `PLAINTEXT`)

| Environment Variable | Local Default | Description |
|---|---|---|
| `FINOS_KAFKA_BOOTSTRAP_SERVERS` | `localhost:9092` | Comma-separated list of broker host:port addresses |
| `FINOS_KAFKA_CLIENT_ID` | `finos-core-client` | Client identifier for Kafka connections |
| `FINOS_KAFKA_SECURITY_PROTOCOL` | `PLAINTEXT` | Transport protocol (`PLAINTEXT`, `SSL`, `SASL_PLAINTEXT`, `SASL_SSL`) |
| `FINOS_KAFKA_SASL_MECHANISM` | *Unset* | SASL mechanism (`PLAIN`, `SCRAM-SHA-256`, `SCRAM-SHA-512`, `OAUTHBEARER`) |
| `FINOS_KAFKA_SASL_USERNAME` | *Unset* | SASL username |
| `FINOS_KAFKA_SASL_PASSWORD` | *Unset* | SASL password |
| `FINOS_KAFKA_SSL_CA_LOCATION` | *Unset* | Path to SSL CA certificate file |

---

## 3. Generic FinOS Event Envelope (`FinOSEvent`)

All events transmitted across Kafka topics use the generic `FinOSEvent` envelope ([finos/core/messaging/events.py](file:///c:/Users/User/Desktop/fin/FinOS/finos/core/messaging/events.py)).

### Envelope Structure:
```json
{
  "event_id": "8f3b2d10-e71a-42a1-9481-19b0689b9101",
  "event_type": "news.received",
  "event_version": "1.0",
  "timestamp": "2026-09-25T12:00:00+00:00",
  "source": "news-ingestion",
  "entity_id": "RELIANCE",
  "entity_type": "equity",
  "correlation_id": "c194a0d5-3129-4112-a720-681b94819102",
  "payload": {
    "headline": "Quarterly profits surge 20% YoY",
    "sentiment": "bullish"
  }
}
```

### Key Principles:
- **Unique Event IDs**: Auto-generated UUID v4 string for deduplication.
- **Timezone-Aware Timestamps**: Enforces UTC ISO 8601 strings (e.g. `2026-09-25T12:00:00+00:00`).
- **Deterministic Serialization**: UTF-8 encoded JSON with sorted keys (`sort_keys=True`) for deterministic byte streams.
- **Schema Reusability**: Accepts serialized representations of `FinOSAgentInput`, `FinOSAgentOutput`, and `FinosState` inside `payload`.

---

## 4. Centralized Topic Registry

Topics are strictly defined in `TopicRegistry` ([finos/core/messaging/topics.py](file:///c:/Users/User/Desktop/fin/FinOS/finos/core/messaging/topics.py)).

| Topic Name | Category | Partitions | Replication | Description |
|---|---|---|---|---|
| `finos.news.raw` | Raw Ingestion | 3 | 1 | Raw ingested financial headlines and feeds |
| `finos.news.processed` | Processed | 3 | 1 | Sentiment and event-parsed news assessments |
| `finos.market.raw` | Raw Ingestion | 3 | 1 | Raw tick data and snapshot price feeds |
| `finos.market.processed` | Processed | 3 | 1 | Normalized market indicators and volatility signals |
| `finos.macro.updated` | Agent Update | 3 | 1 | Macroeconomic regime, FRED, and rate decision events |
| `finos.company.updated` | Agent Update | 3 | 1 | Fundamental filing and 10-K/10-Q events |
| `finos.graph.updated` | Workflow Graph | 3 | 1 | FinosState progression and execution stage updates |
| `finos.risk.updated` | Agent Update | 3 | 1 | Risk Agent consensus and drawdown updates |
| `finos.portfolio.updated` | Agent Update | 3 | 1 | Portfolio allocation and concentration limit updates |
| `finos.analysis.requested` | Analysis Request | 3 | 1 | Multi-agent financial analysis trigger events |
| `finos.analysis.completed` | Analysis Request | 3 | 1 | Synthesized executive summary report events |
| `finos.decision.requested` | Decision State | 3 | 1 | Trading proposal generation trigger events |
| `finos.decision.completed` | Decision State | 3 | 1 | Final trade execution decision events |
| `finos.dead-letter` | System / DLQ | 1 | 1 | Unparseable or rejected event envelopes (7d retention) |
| `finos.test.smoke` | System / Test | 1 | 1 | Dedicated end-to-end smoke test topic |

---

## 5. Kafka Producer (`KafkaProducer`)

`KafkaProducer` ([finos/core/messaging/producer.py](file:///c:/Users/User/Desktop/fin/FinOS/finos/core/messaging/producer.py)) provides reliable event publishing with explicit delivery configurations:

- **Idempotence**: `enable.idempotence = True`
- **Acknowledgment**: `acks = 'all'`
- **Retries**: `retries = 5`
- **In-Flight Constraints**: `max.in.flight.requests.per.connection = 5`

### Python Usage:
```python
from finos.core.messaging import KafkaProducer, FinOSEvent, TOPIC_NEWS_RAW

producer = KafkaProducer()
event = FinOSEvent(
    event_type="news.received",
    source="news-service",
    entity_id="NVDA",
    payload={"headline": "New GPU Chip Architecture Announced"},
)

# Non-blocking publish with delivery report callback
report = producer.publish(TOPIC_NEWS_RAW, event, key="NVDA")

# Or blocking publish with immediate flush
report = producer.publish(TOPIC_NEWS_RAW, event, key="NVDA", block=True)
producer.close()
```

---

## 6. Kafka Consumer (`KafkaConsumer`)

`KafkaConsumer` ([finos/core/messaging/consumer.py](file:///c:/Users/User/Desktop/fin/FinOS/finos/core/messaging/consumer.py)) manages message polling, deserialization, version validation, and manual offset commitments.

- **Explicit Offsets**: `enable.auto.commit = False`
- **Offset Reset**: `auto.offset.reset = 'earliest'`
- **Caller-Defined Consumer Group**: `group_id` must be explicitly specified (e.g. `'finos-news-agent'`).

### Processing Pipeline:
1. Message polled from Kafka broker.
2. Broker/transport errors checked.
3. UTF-8 decode & `FinOSEvent.deserialize()` validation.
4. Schema `event_version` validated against supported set (`{'1.0'}`).
5. Handler function `handler(event)` invoked.
6. **Explicit Commit**: `consumer.commit(msg, asynchronous=False)` executed **ONLY** after successful handler completion.

### Rebalance Callbacks:
- `on_assign`: Logs assigned partitions.
- `on_revoke`: Commits pending processed offsets before partition loss.
- `on_lost`: Treats partition ownership as lost; **does NOT commit offsets**.

---

## 7. Dead-Letter Queue (DLQ)

Failed messages or deserialization exceptions are transformed into DLQ event envelopes and published to `finos.dead-letter` if a `dlq_producer` is attached to `KafkaConsumer`.

### DLQ Event Payload Structure:
```json
{
  "original_event_id": "8f3b2d10-e71a-42a1-9481-19b0689b9101",
  "original_event_type": "news.received",
  "original_topic": "finos.news.raw",
  "correlation_id": "c194a0d5-3129-4112-a720-681b94819102",
  "error_type": "KafkaSerializationError",
  "error_message": "Deserialization failed: Invalid JSON",
  "timestamp": "2026-09-25T12:05:00+00:00"
}
```

---

## 8. CLI Verification & Operational Tooling

FinOS includes three CLI commands for verifying and managing Kafka messaging:

### 1. Healthcheck Utility
Verifies real broker reachability and metadata retrieval via `KafkaAdmin`.
```bash
python -m finos.core.messaging.healthcheck
```
- Outputs `[HEALTHCHECK RESULT]: PASS` or `[HEALTHCHECK RESULT]: FAIL`.
- Exits with status `0` on success or `1` on failure.

### 2. Topic Bootstrap Utility
Idempotently creates all registered FinOS topics on the cluster.
```bash
python -m finos.core.messaging.bootstrap
```
- Reads topic specs from `TopicRegistry`.
- Reports `CREATED`, `ALREADY EXISTS`, or `MISMATCH` if existing topic partitions differ.

### 3. End-to-End Smoke Test
Executes a complete produce-consume-validate pipeline over dedicated topic `finos.test.smoke`.
```bash
python -m finos.core.messaging.smoke_test
```
- Publishes to `finos.test.smoke` using `KafkaProducer`.
- Consumes from `finos.test.smoke` using `KafkaConsumer(group_id="finos.test.smoke.group")`.
- Validates field integrity (`event_id`, `event_type`, `correlation_id`, `payload`).
- Outputs `[SMOKE TEST RESULT]: PASS` or `[SMOKE TEST RESULT]: FAIL`.

---

## 9. Troubleshooting Kafka Unavailability

When running CLI tools or integration tests without a live Kafka broker:

1. **Expected Failure Behavior**:
   Commands will report a clear error message without throwing unhandled tracebacks:
   ```text
   Connecting to Kafka broker(s): localhost:9092...
   [HEALTHCHECK RESULT]: FAIL
     Broker Address: localhost:9092
     Error Type: KafkaConnectionError
     Error Message: Failed to list topics from Kafka cluster: KafkaError: All brokers down (-187)
   ```
2. **Unit Test Safety**:
   The standard test suite (`python -m pytest`) is network-isolated and mocks all Kafka interactions. It passes without requiring a running Kafka broker.
3. **Integration Tests**:
   Integration tests marked `@pytest.mark.integration` automatically detect whether `localhost:9092` is reachable and skip safely if the broker is offline.

---

## 11. Phase 6B — News Pipeline Event Layer Integration

Phase 6B integrates the existing FinOS News Agent pipeline with the Kafka event transport layer in a safe, optional manner via `EventPublisher`.

### Integration Architecture
```text
News Input / Raw Articles
        ↓
   News Agent
        ↓ (Step 1: Raw News Fetch / Normalize)
  EventPublisher.publish_news_raw() ──[FINOS_KAFKA_EVENTS_ENABLED=true]──> [finos.news.raw]
        ↓ (Step 2: Sentiment Assessment Synthesis)
  NewsAssessment Output
        ↓ (Step 3: Processed Assessment Output)
  EventPublisher.publish_news_processed() ──[FINOS_KAFKA_EVENTS_ENABLED=true]──> [finos.news.processed]
```

### News Topics & Event Types
- **`finos.news.raw`**: Carries `news.raw` events containing normalized company headlines, global macro news items, and source metadata.
- **`finos.news.processed`**: Carries `news.processed` events containing the final structured `NewsAssessment` and `FinOSAgentOutput` model dict.

### Configuration & Failure Isolation
- **Configuration**: Activated via `FINOS_KAFKA_EVENTS_ENABLED=true`. When set to `false` (default), zero Kafka connections occur.
- **Failure Isolation**: If Kafka is enabled but broker publishing fails, `EventPublisher` logs a warning and returns `False`. The `NewsAgent.analyze()` execution continues normally and returns its business result without raising exceptions.
- **Correlation & Keying**: Preserves workflow `correlation_id` across both `news.raw` and `news.processed` events. Partition key defaults to ticker symbol (`entity_id`).

### Status
- **IMPLEMENTED**: Optional event emission in `NewsAgent.analyze()` and `EventPublisher`.
- **FUTURE**: Kafka consumer loops driving asynchronous background News processing.

---

## 12. Phase 6C — Market & Macro Economy Pipeline Event Layer Integration

Phase 6C integrates existing FinOS Market data processing and Macro Economy Agent pipeline with the Kafka event transport layer via `EventPublisher`.

### Integration Architecture
```text
Market / Macro Inputs
        ↓
   Market Data Dataflows / Macro Economy Agent
        ↓ (Step 1: Raw Market Tick/OHLCV Ingestion)
  EventPublisher.publish_market_raw() ──[FINOS_KAFKA_EVENTS_ENABLED=true]──> [finos.market.raw]
        ↓ (Step 2: Technical Analytics / Indicator Processing)
  EventPublisher.publish_market_processed() ──[FINOS_KAFKA_EVENTS_ENABLED=true]──> [finos.market.processed]
        ↓ (Step 3: Macro Assessment / FRED Indicator Analysis)
  EventPublisher.publish_macro_updated() ──[FINOS_KAFKA_EVENTS_ENABLED=true]──> [finos.macro.updated]
```

### Topics & Event Types
- **`finos.market.raw`**: Carries `market.raw` events containing raw tick data, OHLCV snapshots, price feeds, and vendor metadata.
- **`finos.market.processed`**: Carries `market.processed` events containing technical indicators (RSI, SMA, MACD, ATR), volatility measures, and market analytics summaries.
- **`finos.macro.updated`**: Carries `macro.updated` events containing the structured `MacroAssessment` and `FinOSAgentOutput` model dict (CPI inflation, Fed Funds rate, unemployment rate, yield curve inversion metrics, economic regime classification).

### Key Strategies & Correlation
- **Market Kafka Key**: Partition key defaults to symbol / ticker (`entity_id`, e.g. `'AAPL'`, `'RELIANCE.NS'`).
- **Macro Kafka Key**: Partition key defaults to series/entity identifier (`entity_id`, e.g. `'MACRO_US'`).
- **Correlation ID**: Preserves workflow `correlation_id` across raw ingestion, processing, and output emission.

### Configuration & Failure Isolation
- **Configuration**: Controlled by `FINOS_KAFKA_EVENTS_ENABLED=true`. Defaults to `false`. When disabled, no Kafka network I/O or client initialization takes place.
- **Failure Isolation**: Kafka producer errors log warnings and return `False`. Business logic execution in `MacroEconomyAgent` or market dataflows completes without exception.

### Status
- **IMPLEMENTED**: `publish_market_raw`, `publish_market_processed`, and `publish_macro_updated` methods in `EventPublisher`, plus optional `macro.updated` emission in `MacroEconomyAgent.analyze()`.
- **FUTURE**: Asynchronous Kafka consumer workers for market tick feeds and FRED macro triggers.

---

## 13. Phase 6D — Risk, Portfolio & Analysis Lifecycle Integration

Phase 6D integrates the Risk Agent, Portfolio Agent, and Analysis Lifecycle (`analysis.requested`, `analysis.completed`) with the Kafka event layer via `EventPublisher`.

### Integration Architecture
```text
FinosGraphEngine / LangGraph Execution DAG
        ↓ (Step 1: Workflow Started / Triggered)
  EventPublisher.publish_analysis_requested() ──[FINOS_KAFKA_EVENTS_ENABLED=true]──> [finos.analysis.requested]
        ↓ (Step 2: Risk Agent Analysis & Specialist Debate)
  EventPublisher.publish_risk_updated() ───────[FINOS_KAFKA_EVENTS_ENABLED=true]──> [finos.risk.updated]
        ↓ (Step 3: Portfolio Agent Allocation & Sizing)
  EventPublisher.publish_portfolio_updated() ──[FINOS_KAFKA_EVENTS_ENABLED=true]──> [finos.portfolio.updated]
        ↓ (Step 4: Final Synthesized Executive Report)
  EventPublisher.publish_analysis_completed() ──[FINOS_KAFKA_EVENTS_ENABLED=true]──> [finos.analysis.completed]
```

### Topics & Event Types
- **`finos.risk.updated`**: Carries `risk.updated` events containing `RiskAssessment` findings (risk level, key risks, debator views, risk mitigations, volatility/drawdown/liquidity/concentration risk metrics).
- **`finos.portfolio.updated`**: Carries `portfolio.updated` events containing `PortfolioAssessment` findings (recommended rating, max position size cap, target allocation, cash context, holdings impact, concentration warnings).
- **`finos.analysis.requested`**: Carries `analysis.requested` events emitted at the start of workflow execution containing target entity ID, point-in-time date, request objective, and market context.
- **`finos.analysis.completed`**: Carries `analysis.completed` events emitted at successful completion of workflow execution containing executive summary report findings and data quality metrics.

### Key Strategies & Correlation
- **Partition Keying**: Keyed deterministically by ticker / entity ID (`entity_id`, e.g. `'NVDA'`, `'MSFT'`).
- **Unified Correlation ID**: Every event emitted during a single workflow run shares the exact same `correlation_id` across `analysis.requested`, agent update events (`news`, `macro`, `risk`, `portfolio`), and `analysis.completed`.

### Configuration & Failure Isolation
- **Configuration**: Controlled by `FINOS_KAFKA_EVENTS_ENABLED=true` (defaults to `false`). Zero Kafka network calls occur when disabled.
- **Failure Isolation**: Kafka errors are caught and logged as warnings; core business logic inside `RiskAgent`, `PortfolioAgent`, and `FinosGraphEngine` completes successfully without exception.

### Status
- **IMPLEMENTED**: `publish_risk_updated`, `publish_portfolio_updated`, `publish_analysis_requested`, and `publish_analysis_completed` methods in `EventPublisher`, integrated with `RiskAgent`, `PortfolioAgent`, and `FinosGraphEngine`.
- **FUTURE**: Downstream Kafka event consumers for automated risk alerts and rebalancing triggers.

---

## 14. Phase 6E — Decision Engine Kafka Event Integration

Phase 6E integrates the existing FinOS Decision Engine (`TradingAgent`) with the Kafka event transport layer via `EventPublisher`.

### Integration Architecture
```text
Existing Domain Agents (News, Market, Macro, Risk, Portfolio, Investment)
        ↓ (Upstream State Propagation)
FinosState / Relevant Previous Outputs
        ↓ (Step 1: Decision Requested Boundary)
EventPublisher.publish_decision_requested() ──[FINOS_KAFKA_EVENTS_ENABLED=true]──> [finos.decision.requested]
        ↓
Decision Engine (TradingAgent.analyze() / TradingProposal Synthesis)
        ↓ (Step 2: Decision Completed Result)
EventPublisher.publish_decision_completed() ──[FINOS_KAFKA_EVENTS_ENABLED=true]──> [finos.decision.completed]
        ↓
Synchronous FinOSGraphEngine Stance & Executive Summary
```

### Topics & Event Types
- **`finos.decision.requested`**: Carries `decision.requested` events emitted when the Decision Engine (`TradingAgent`) begins trade proposal synthesis for an entity.
  - **Payload Structure**: `as_of_date`, `context` (request objective, market), `status: "requested"`.
- **`finos.decision.completed`**: Carries `decision.completed` events emitted after successful trade proposal synthesis.
  - **Payload Structure**: Complete `FinOSAgentOutput` serialization containing `TradingProposal` findings (`action`, `reasoning`, `entry_price`, `stop_loss`, `position_sizing`, `risk_limit_notes`, `assumptions`, `confidence`), `evidence`, `summary`, and execution metadata.

### Key Strategies & Correlation
- **Partition Keying**: Keyed deterministically by ticker / entity ID (`entity_id`, e.g. `'TSLA'`, `'TATAMOTORS.NS'`).
- **Unified Correlation ID**: Shares the exact same `correlation_id` across the complete workflow lifecycle (`analysis.requested` -> `news`/`market`/`macro` -> `risk`/`portfolio` -> `decision.requested` -> `decision.completed` -> `analysis.completed`).

### Execution Boundary & Lifecycle Sequence
1. Workflow start emits `analysis.requested` on `finos.analysis.requested`.
2. Upstream data/analytical agents process state sequentially.
3. `TradingAgent` receives context/state, emits `decision.requested` on `finos.decision.requested`.
4. `TradingAgent` synthesizes `TradingProposal` findings.
5. `TradingAgent` emits `decision.completed` on `finos.decision.completed`.
6. `FinosGraphEngine` synthesizes final report and emits `analysis.completed` on `finos.analysis.completed`.

### Configuration & Failure Isolation
- **Configuration**: Controlled by `FINOS_KAFKA_EVENTS_ENABLED=true` (defaults to `false`). Zero Kafka network I/O or client initialization occurs when disabled.
- **Failure Isolation**: Kafka publication errors are caught and logged as warnings. `TradingAgent` trade proposal synthesis and `FinosGraphEngine` execution succeed regardless of Kafka availability.

### Status
- **IMPLEMENTED**: `publish_decision_requested` and `publish_decision_completed` methods in `EventPublisher`, integrated into `TradingAgent.analyze()`.
- **FUTURE**: Kafka event consumers for real-time trade proposal auditing and external order routing integration.

---

## 15. Phase 6F — Application / API / Real-Time Integration

Phase 6F connects the backend Kafka event layer to FastAPI REST and WebSocket endpoints, providing real-time event streaming to frontend (Next.js / React) applications.

### Conceptual Real-Time Architecture
```text
Existing FinOS Agents
        ↓
  EventPublisher
        ↓
  Kafka Cluster (or In-Memory Dispatch Fallback)
        ↓
  KafkaEventBridge (Consumer Group: finos-web-event-bridge-group)
        ↓
  WebSocketManager (Connection Pool & Scoped Broadcasting)
        ↓
  FastAPI Endpoints (POST /api/v1/analysis, GET /api/v1/health, WebSocket /ws/events, /ws/analysis/{correlation_id})
        ↓
  Next.js / Frontend Client (`FinOSClient`, `useFinOSEvents` React hook)
```

### Security & Isolation Boundaries
- **Security Boundary**: The browser connects **ONLY** to FastAPI REST & WebSocket endpoints. Kafka broker addresses, SASL/SSL credentials, and internal consumer group details are strictly backend-only and never exposed to the frontend.
- **REST Pipeline Preservation**: Existing REST endpoints (`POST /api/v1/analysis`, `GET /api/v1/analysis/{correlation_id}`) remain fully functional. Real-time WebSockets operate as an additive update stream.
- **Failure Isolation**: If WebSockets disconnect or Kafka is disabled/offline (`FINOS_KAFKA_EVENTS_ENABLED=false`), FastAPI starts cleanly, REST analysis endpoints execute normally, and `KafkaEventBridge` falls back to direct in-memory listener dispatch.

### Real-Time Event Envelope Schema
WebSocket clients receive safe, structured JSON representations of `FinOSEvent`:
```json
{
  "event_id": "b1a2c3d4-...",
  "event_type": "decision.completed",
  "event_version": "1.0",
  "timestamp": "2026-09-26T01:52:33Z",
  "source": "Trading Agent",
  "entity_id": "NVDA",
  "entity_type": "equity",
  "correlation_id": "corr-uuid-12345",
  "payload": {
    "summary": "Trade Proposal for NVDA on 2026-03-31: Action - Buy.",
    "findings": {
      "action": "Buy",
      "confidence": 0.85
    }
  }
}
```

### Application Components Introduced
1. **`finos/core/messaging/event_bridge.py`**:
   - `WebSocketManager`: Manages active WebSocket connections and handles thread-safe correlation-scoped or global event broadcasting.
   - `KafkaEventBridge`: Application event bridge consuming all FinOS topics using consumer group `finos-web-event-bridge-group`, deserializing envelopes, and routing to `WebSocketManager`.
2. **`finos/api/app.py`**:
   - FastAPI application instance with lifespan manager.
   - `GET /api/v1/health`: Returns API health, Kafka event status, and active WebSocket connection count.
   - `POST /api/v1/analysis`: Triggers synchronous `FinosGraphEngine.execute()` with live real-time event listener attached.
   - `GET /api/v1/analysis/{correlation_id}`: Retrieves stored analysis output state.
   - `WebSocket /ws/events`: Real-time global event stream.
   - `WebSocket /ws/analysis/{correlation_id}`: Scoped real-time event stream for a specific workflow execution.
3. **`finos/frontend/client.js` & `finos/frontend/useFinOSEvents.ts`**:
   - `FinOSClient`: JavaScript SDK providing REST trigger methods and WebSocket subscription management with auto-reconnect support.
   - `useFinOSEvents`: TypeScript React hook managing WebSocket connection state, event lists, latest event state, and graceful cleanup.

### Status
- **IMPLEMENTED**: `WebSocketManager`, `KafkaEventBridge`, FastAPI REST/WebSocket application in `finos/api/app.py`, frontend SDK/Hook in `finos/frontend/`, and full test coverage in `tests/test_finos_event_bridge_api.py`.





