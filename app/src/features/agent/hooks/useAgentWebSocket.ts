import { useState, useEffect, useRef, useCallback } from 'react';
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

const MAX_RETRIES = 3; // Reduced for faster demo mode activation
const BASE_DELAY = 1000;
const MAX_DELAY = 5000; // Reduced max delay

// Demo thoughts to show when agent service is unavailable
const DEMO_THOUGHTS: Omit<AgentThought, 'timestamp'>[] = [
  { type: 'thinking', tokenId: 'system', message: 'Initializing market analysis...' },
  { type: 'analysis', tokenId: 'system', message: 'Connected to Lendle protocol. USDC supply APY: 4.2%, USDT: 3.8%' },
  { type: 'thinking', tokenId: 'INV-0001', message: 'Scanning invoice portfolio for optimization opportunities...' },
  { type: 'analysis', tokenId: 'INV-0001', message: 'Invoice INV-0001: $25,000 principal, 28 days until due, risk score 82/100' },
  { type: 'analysis', tokenId: 'INV-0001', message: 'Current strategy: Conservative (3.5% APY). Checking if rebalance needed...' },
  { type: 'decision', tokenId: 'INV-0001', message: 'Strategy recommendation: HOLD Conservative. Confidence: 87%. Low volatility favors stable yield.' },
  { type: 'execution', tokenId: 'INV-0001', message: 'No action required. Estimated daily yield: $2.40. Monitoring continues.' },
  { type: 'thinking', tokenId: 'system', message: 'Checking Pyth oracle for MNT price updates...' },
  { type: 'analysis', tokenId: 'system', message: 'MNT/USD: $0.42 (+1.2% 24h). Market conditions stable.' },
  { type: 'thinking', tokenId: 'INV-0002', message: 'Analyzing new deposit opportunity...' },
  { type: 'analysis', tokenId: 'INV-0002', message: 'Invoice INV-0002: $10,000 principal, 45 days until due, risk score 91/100' },
  { type: 'decision', tokenId: 'INV-0002', message: 'Recommending Aggressive strategy (7% APY). High confidence invoice with long runway.' },
  { type: 'execution', tokenId: 'INV-0002', message: 'Strategy change queued. Awaiting user confirmation for amounts > $5,000.' },
  { type: 'thinking', tokenId: 'system', message: 'Running yield optimization scan across all positions...' },
  { type: 'analysis', tokenId: 'system', message: 'Portfolio summary: 2 active deposits, $35,000 TVL, $4.80 daily yield' },
];

export function useAgentWebSocket() {
  const [thoughts, setThoughts] = useState<AgentThought[]>([]);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [maxRetriesReached, setMaxRetriesReached] = useState(false);
  const [demoMode, setDemoMode] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const demoIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const demoIndexRef = useRef(0);

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
        setConnected(false);
        setConnecting(false);

        setRetryCount((prev) => {
          const newCount = prev + 1;
          if (newCount >= MAX_RETRIES) {
            setMaxRetriesReached(true);
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

  // Start demo mode when connection fails
  const startDemoMode = useCallback(() => {
    if (demoIntervalRef.current) return; // Already running

    setDemoMode(true);
    demoIndexRef.current = 0;

    // Add initial thought immediately
    const addDemoThought = () => {
      const thought = DEMO_THOUGHTS[demoIndexRef.current % DEMO_THOUGHTS.length];
      setThoughts((prev) => [...prev.slice(-49), { ...thought, timestamp: Date.now() }]);
      demoIndexRef.current++;
    };

    addDemoThought();

    // Continue adding thoughts at intervals
    demoIntervalRef.current = setInterval(addDemoThought, 3000);
  }, []);

  // Stop demo mode
  const stopDemoMode = useCallback(() => {
    if (demoIntervalRef.current) {
      clearInterval(demoIntervalRef.current);
      demoIntervalRef.current = null;
    }
    setDemoMode(false);
  }, []);

  // Auto-start demo mode when max retries reached
  useEffect(() => {
    if (maxRetriesReached && !demoMode) {
      startDemoMode();
    }
  }, [maxRetriesReached, demoMode, startDemoMode]);

  // When connected, stop demo mode
  useEffect(() => {
    if (connected && demoMode) {
      stopDemoMode();
      setThoughts([]); // Clear demo thoughts
    }
  }, [connected, demoMode, stopDemoMode]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (demoIntervalRef.current) {
        clearInterval(demoIntervalRef.current);
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
    demoMode,
    manualReconnect,
    triggerDemo,
  };
}
