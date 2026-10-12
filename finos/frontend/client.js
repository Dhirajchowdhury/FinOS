/**
 * FinOS Real-Time Event Client SDK for Next.js / Frontend Applications.
 *
 * Provides REST API triggers and WebSocket subscription helpers for FinOS real-time events.
 * Exposes NO Kafka credentials or internal broker details to the browser.
 */

export class FinOSClient {
  /**
   * @param {Object} options
   * @param {string} [options.baseUrl] - Base API URL (e.g., 'http://localhost:8000')
   * @param {string} [options.wsUrl] - Base WebSocket URL (e.g., 'ws://localhost:8000')
   */
  constructor(options = {}) {
    const defaultOrigin = typeof window !== 'undefined' ? window.location.host : 'localhost:8000';
    const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'https' : 'http';
    const wsProtocol = protocol === 'https' ? 'wss' : 'ws';

    this.baseUrl = options.baseUrl || `${protocol}://${defaultOrigin}`;
    this.wsUrl = options.wsUrl || `${wsProtocol}://${defaultOrigin}`;
  }

  /**
   * Health check request.
   */
  async getHealth() {
    const res = await fetch(`${this.baseUrl}/api/v1/health`);
    if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
    return res.json();
  }

  /**
   * Initiate a FinOS analysis workflow.
   *
   * @param {Object} payload
   * @param {string} payload.entity_id - Ticker symbol (e.g., 'NVDA', 'AAPL')
   * @param {string} [payload.as_of_date] - Date string YYYY-MM-DD
   * @param {string} [payload.request] - Objective text
   * @param {Object} [payload.context] - Execution context
   */
  async startAnalysis(payload) {
    const res = await fetch(`${this.baseUrl}/api/v1/analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Analysis request failed: ${res.statusText}`);
    }
    return res.json();
  }

  /**
   * Fetch analysis state by correlation ID.
   * @param {string} correlationId
   */
  async getAnalysis(correlationId) {
    const res = await fetch(`${this.baseUrl}/api/v1/analysis/${correlationId}`);
    if (!res.ok) throw new Error(`Analysis fetch failed: ${res.statusText}`);
    return res.json();
  }

  /**
   * Connect to real-time WebSocket event stream.
   *
   * @param {Object} callbacks
   * @param {Function} [callbacks.onEvent] - Called for every incoming FinOSEvent
   * @param {Function} [callbacks.onOpen] - Called when WebSocket connects
   * @param {Function} [callbacks.onClose] - Called when WebSocket disconnects
   * @param {Function} [callbacks.onError] - Called on WebSocket error
   * @param {string} [correlationId] - Optional correlation ID filter
   * @returns {WebSocket}
   */
  subscribeEvents(callbacks = {}, correlationId = null) {
    const endpoint = correlationId
      ? `${this.wsUrl}/ws/analysis/${correlationId}`
      : `${this.wsUrl}/ws/events`;

    const ws = new WebSocket(endpoint);

    ws.onopen = (event) => {
      if (callbacks.onOpen) callbacks.onOpen(event);
    };

    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (callbacks.onEvent) callbacks.onEvent(parsed);
      } catch (err) {
        console.warn('FinOSClient: Error parsing event JSON:', err);
      }
    };

    ws.onclose = (event) => {
      if (callbacks.onClose) callbacks.onClose(event);
    };

    ws.onerror = (event) => {
      if (callbacks.onError) callbacks.onError(event);
    };

    return ws;
  }
}
