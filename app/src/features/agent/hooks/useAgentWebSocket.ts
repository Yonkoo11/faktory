import { useState, useEffect, useRef } from 'react';
import { AGENT_WS_URL } from '@/lib/wagmi';

export interface AgentThought {
  type: 'thinking' | 'analysis' | 'decision' | 'execution' | 'error';
  tokenId: string;
  message: string;
  timestamp: number;
  data?: Record<string, unknown>;
}

interface WebSocketMessage {
  type: 'thought' | 'decision' | 'execution' | 'status' | 'error';
  payload: AgentThought | { status: string };
}

const MAX_RETRIES = 5;
const BASE_DELAY = 2000;
const MAX_DELAY = 30000;

export function useAgentWebSocket() {
  const [thoughts, setThoughts] = useState<AgentThought[]>([]);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [offline, setOffline] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    setConnecting(true);
    setOffline(false);

    try {
      const ws = new WebSocket(AGENT_WS_URL);

      ws.onopen = () => {
        setConnected(true);
        setConnecting(false);
        setRetryCount(0);
        setOffline(false);
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          if (
            message.type === 'thought' ||
            message.type === 'decision' ||
            message.type === 'execution' ||
            message.type === 'error'
          ) {
            const thought = message.payload as AgentThought;
            setThoughts((prev) => [...prev.slice(-49), thought]);
          }
        } catch (e) {
          console.error('Failed to parse message:', e);
        }
      };

      ws.onclose = () => {
        setConnected(false);
        setConnecting(false);

        setRetryCount((prev) => {
          const newCount = prev + 1;
          if (newCount >= MAX_RETRIES) {
            setOffline(true);
            return prev;
          }

          const delay = Math.min(BASE_DELAY * Math.pow(2, newCount), MAX_DELAY);
          reconnectTimeoutRef.current = setTimeout(connect, delay);
          return newCount;
        });
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      setConnecting(false);
      setOffline(true);
    }
  };

  const manualReconnect = () => {
    setRetryCount(0);
    setOffline(false);
    connect();
  };

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      wsRef.current?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    thoughts,
    connected,
    connecting,
    offline,
    manualReconnect,
  };
}
