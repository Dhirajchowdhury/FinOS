import { useEffect, useRef, useState, useCallback } from 'react';
import { FinOSClient } from './client.js';

export interface FinOSEventEnvelope {
  event_id: string;
  event_type: string;
  event_version: string;
  timestamp: string;
  source: string;
  entity_id: string;
  entity_type: string;
  correlation_id: string;
  payload: Record<string, any>;
}

export interface UseFinOSEventsOptions {
  baseUrl?: string;
  wsUrl?: string;
  correlationId?: string;
  autoConnect?: boolean;
}

export function useFinOSEvents(options: UseFinOSEventsOptions = {}) {
  const [events, setEvents] = useState<FinOSEventEnvelope[]>([]);
  const [latestEvent, setLatestEvent] = useState<FinOSEventEnvelope | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const clientRef = useRef<FinOSClient | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  if (!clientRef.current) {
    clientRef.current = new FinOSClient({
      baseUrl: options.baseUrl,
      wsUrl: options.wsUrl,
    });
  }

  const connect = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      wsRef.current = clientRef.current!.subscribeEvents(
        {
          onOpen: () => {
            setIsConnected(true);
            setError(null);
          },
          onEvent: (event: FinOSEventEnvelope) => {
            setLatestEvent(event);
            setEvents((prev) => [...prev, event]);
          },
          onClose: () => {
            setIsConnected(false);
          },
          onError: (err: any) => {
            setError(new Error(err?.message || 'WebSocket connection error'));
            setIsConnected(false);
          },
        },
        options.correlationId
      );
    } catch (err: any) {
      setError(err);
      setIsConnected(false);
    }
  }, [options.correlationId]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
      setIsConnected(false);
    }
  }, []);

  useEffect(() => {
    if (options.autoConnect !== false) {
      connect();
    }
    return () => {
      disconnect();
    };
  }, [connect, disconnect, options.autoConnect]);

  return {
    events,
    latestEvent,
    isConnected,
    error,
    connect,
    disconnect,
    client: clientRef.current,
  };
}
