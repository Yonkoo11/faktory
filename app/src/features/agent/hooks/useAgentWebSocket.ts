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
const BASE_DELAY = 1000;
const MAX_DELAY = 30000;

export function useAgentWebSocket() {
  const [thoughts, setThoughts] = useState<AgentThought[]>([]);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [maxRetriesReached, setMaxRetriesReached] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    setConnecting(true);
    setMaxRetriesReached(false);

    try {
      const ws = new WebSocket(AGENT_WS_URL);

      ws.onopen = () => {
        console.log('Connected to InvoiceAgent');
        setConnected(true);
        setConnecting(false);
        setRetryCount(0);
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
        console.log('Disconnected from InvoiceAgent');
        setConnected(false);
        setConnecting(false);

        setRetryCount((prev) => {
          const newCount = prev + 1;
          if (newCount >= MAX_RETRIES) {
            setMaxRetriesReached(true);
            console.log('Max reconnection attempts reached');
            return prev;
          }

          const delay = Math.min(BASE_DELAY * Math.pow(2, newCount), MAX_DELAY);
          console.log(`Reconnecting in ${delay}ms (attempt ${newCount + 1}/${MAX_RETRIES})`);
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
    }
  };

  const manualReconnect = () => {
    setRetryCount(0);
    setMaxRetriesReached(false);
    connect();
  };

  const triggerDemo = (scenario: 'market_crash' | 'market_rally' | 'reset') => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'triggerDemo', scenario }));
    }
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
    maxRetriesReached,
    manualReconnect,
    triggerDemo,
  };
}
