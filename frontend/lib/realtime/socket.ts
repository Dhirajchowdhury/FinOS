/**
 * FinOS Real-time Telemetry Client
 * Designed for native WebSocket connectivity with FastAPI backend.
 */

type RealtimeEventHandler = (event: { type: string; payload: any }) => void;

class FinOSRealtimeClient {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Set<RealtimeEventHandler>> = new Map();
  private reconnectTimer: any = null;
  private isConnecting: boolean = false;
  private url: string;

  constructor() {
    const rawUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://127.0.0.1:8000/ws/telemetry";
    this.url = rawUrl.replace("://localhost:", "://127.0.0.1:");
  }

  public connect(): void {
    if (typeof window === "undefined" || this.ws || this.isConnecting) return;

    this.isConnecting = true;
    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.isConnecting = false;
        this.emit("status", { state: "connected" });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && data.type) {
            this.emit(data.type, data.payload || data);
          }
        } catch {
          // ignore non-json
        }
      };

      this.ws.onclose = () => {
        this.ws = null;
        this.isConnecting = false;
        this.emit("status", { state: "disconnected" });
        // Attempt reconnect after 5s
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        if (this.ws) {
          this.ws.close();
        }
      };
    } catch {
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, 5000);
  }

  public subscribe(eventType: string, handler: RealtimeEventHandler): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(handler);

    // Auto-connect if subscribing
    this.connect();

    return () => {
      const set = this.listeners.get(eventType);
      if (set) {
        set.delete(handler);
        if (set.size === 0) {
          this.listeners.delete(eventType);
        }
      }
    };
  }

  public emit(eventType: string, payload: any): void {
    const handlers = this.listeners.get(eventType);
    if (handlers) {
      handlers.forEach((h) => {
        try {
          h({ type: eventType, payload });
        } catch (e) {
          console.error("Error in realtime event handler:", e);
        }
      });
    }
  }

  public disconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const realtimeClient = new FinOSRealtimeClient();
