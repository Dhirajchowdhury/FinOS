# FinOS Frontend ↔ Backend API Integration Contract

This document provides the definitive specification for the FastAPI backend team to wire production AI agent pipelines, LangGraph graphs, and financial microservices to the FinOS Next.js frontend.

---

## 1. Architecture & Base Configuration

- **Environment Variable**: `NEXT_PUBLIC_API_URL`
- **Default Development URL**: `http://127.0.0.1:8000` (FastAPI)
- **Session Transport**: HttpOnly, SameSite=Lax cookie (`finos_session`) containing signed JWT.
- **WebSocket URL**: `NEXT_PUBLIC_WS_URL` (defaults to `ws://127.0.0.1:8000/ws/telemetry`)

All frontend requests use `credentials: "include"`.

---

## 2. Authentication Endpoints (ACTIVE & PRESERVED)

These endpoints are currently active in `backend/app/api/auth.py`:

### `POST /auth/email/request-code`
- **Request**:
  ```json
  { "email": "investor@finos.io" }
  ```
- **Response (200 OK)**:
  ```json
  {
    "message": "Verification code sent successfully.",
    "cooldown_seconds": 60
  }
  ```

### `POST /auth/email/verify-code`
- **Request**:
  ```json
  { "email": "investor@finos.io", "code": "849201" }
  ```
- **Response (200 OK)**:
  - Sets `finos_session` HttpOnly cookie.
  ```json
  {
    "message": "Verification successful. Welcome to FinOS.",
    "user": {
      "id": 1,
      "email": "investor@finos.io",
      "name": "Alex Mercer",
      "google_id": null,
      "is_verified": true
    }
  }
  ```

### `GET /auth/google/login`
- **Response (200 OK)**:
  ```json
  { "auth_url": "https://accounts.google.com/o/oauth2/v2/auth?..." }
  ```

### `GET /auth/me`
- **Response (200 OK)**:
  ```json
  {
    "id": 1,
    "email": "investor@finos.io",
    "name": "Alex Mercer",
    "google_id": null,
    "is_verified": true
  }
  ```

### `POST /auth/logout`
- **Response (200 OK)**: Clears `finos_session` cookie.

---

## 3. Specialized AI Agents Contract (`/api/agents`)

Frontend consumes `frontend/lib/api/agents.ts`. The backend team can connect LangGraph / CrewAI microservices by implementing these endpoints:

### `GET /api/agents`
- **Returns**: Array of all 10 specialized agents.
- **Schema**:
  ```json
  [
    {
      "id": "investment",
      "slug": "investment",
      "name": "Investment Agent",
      "category": "Investment",
      "status": "online",
      "shortDescription": "...",
      "tags": ["Portfolio", "Stock Analysis", "Alpha Factor"],
      "capabilities": ["DCF Valuation", "Factor Beta", "Sector Rotation"],
      "dataSources": ["Bloomberg", "SEC EDGAR", "NSE/BSE"],
      "modelSpecs": {
        "engine": "FinOS GNN + Claude 3.5",
        "latency": "180ms",
        "contextWindow": "128k tokens",
        "confidenceThreshold": "91.4%"
      }
    }
  ]
  ```

### `POST /api/agents/{agent_id}/query`
- **Request**:
  ```json
  {
    "message": "Analyze tech allocation risk.",
    "portfolio_id": "optional-id",
    "context": {}
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "id": "msg-1234",
    "agentId": "investment",
    "sender": "agent",
    "content": "Markdown text with explanation...",
    "timestamp": "14:32",
    "status": "completed",
    "analysisDetails": {
      "toolsUsed": ["Fama-French Model", "GraphRAG Traversal"],
      "dataSources": ["NSE Feeds", "SEC 10-K"],
      "reasoningSteps": ["Step 1...", "Step 2..."],
      "confidenceScore": 94.2
    },
    "result": {
      "title": "Investment Analysis",
      "summary": "...",
      "keyFindings": ["..."],
      "recommendations": ["..."],
      "riskLevel": "Low",
      "confidenceScore": 94.2,
      "metrics": [{ "label": "VaR", "value": "1.6%" }],
      "sources": ["NSE"],
      "explainabilityTrace": {
        "decisionPath": "...",
        "contributingFactors": [{ "factor": "Factor Beta", "weight": 0.35 }],
        "guardrailsPassed": ["Max Exposure < 35%"]
      }
    }
  }
  ```

---

## 4. Multi-Agent Collaborative Analysis (`/api/analysis`)

### `POST /api/analysis/multi-agent`
- **Request**:
  ```json
  {
    "query": "Analyze the impact of an RBI rate hike on my portfolio.",
    "scenario_id": "scenario-rbi-rate"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "id": "analysis-9981",
    "title": "RBI Monetary Stance Shift & Portfolio Sensitivity",
    "consensusVerdict": "Constructive & Insulated — Maintain Equity Overweight",
    "consensusScore": 93,
    "riskLevel": "Low",
    "signals": [
      {
        "agentId": "macro",
        "agentName": "Macro Economy Agent",
        "verdict": "Optimized",
        "confidence": 91,
        "finding": "Repo rate likely to hold at 6.50%...",
        "rationale": "...",
        "dataPoint": "Core CPI: 3.8%"
      }
    ],
    "unifiedInsights": ["Insight 1", "Insight 2"],
    "actionPlan": {
      "immediate": ["Reinvest coupon proceeds..."],
      "mediumTerm": ["Monitor MPC voting split..."]
    },
    "explainability": {
      "graphRAGContext": "Traversal of 42 nodes...",
      "decisionEngineWeighting": [{ "agent": "Macro Agent", "weight": 0.28 }],
      "auditId": "FINOS-AUDIT-2026-A8F4"
    }
  }
  ```

---

## 5. Real-Time Telemetry WebSocket (`ws://127.0.0.1:8000/ws/telemetry`)

The frontend `realtimeClient` automatically listens for structured event payloads:

```json
{
  "type": "market_tick",
  "payload": {
    "symbol": "NIFTY 50",
    "value": 25380.25,
    "change": 184.6
  }
}
```

```json
{
  "type": "agent_signal",
  "payload": {
    "agentId": "risk",
    "signal": "High Volatility Warning"
  }
}
```
