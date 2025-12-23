'use client';

import { useEffect, useState, useRef } from 'react';
import { AGENT_WS_URL } from '@/lib/wagmi';

interface AgentThought {
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

const typeStyles = {
  thinking: {
    icon: '💭',
    bg: 'bg-gray-800',
    border: 'border-gray-700',
  },
  analysis: {
    icon: '📊',
    bg: 'bg-blue-900/30',
    border: 'border-blue-800',
  },
  decision: {
    icon: '🎯',
    bg: 'bg-green-900/30',
    border: 'border-green-800',
  },
  execution: {
    icon: '⚡',
    bg: 'bg-yellow-900/30',
    border: 'border-yellow-800',
  },
  error: {
    icon: '❌',
    bg: 'bg-red-900/30',
    border: 'border-red-800',
  },
};

export function AgentActivity() {
  const [thoughts, setThoughts] = useState<AgentThought[]>([]);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const connect = () => {
      setConnecting(true);
      const ws = new WebSocket(AGENT_WS_URL);

      ws.onopen = () => {
        console.log('Connected to InvoiceAgent');
        setConnected(true);
        setConnecting(false);
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);

          if (message.type === 'thought' || message.type === 'decision' || message.type === 'execution' || message.type === 'error') {
            const thought = message.payload as AgentThought;
            setThoughts((prev) => [...prev.slice(-49), thought]); // Keep last 50
          }
        } catch (e) {
          console.error('Failed to parse message:', e);
        }
      };

      ws.onclose = () => {
        console.log('Disconnected from InvoiceAgent');
        setConnected(false);
        setConnecting(false);
        // Reconnect after 3 seconds
        setTimeout(connect, 3000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnecting(false);
      };

      wsRef.current = ws;
    };

    connect();

    return () => {
      wsRef.current?.close();
    };
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [thoughts]);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🤖</span>
          <h2 className="font-semibold">Agent Activity</h2>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              connected ? 'bg-green-500 animate-pulse' : connecting ? 'bg-yellow-500' : 'bg-red-500'
            }`}
          />
          <span className="text-sm text-gray-400">
            {connected ? 'Live' : connecting ? 'Connecting...' : 'Disconnected'}
          </span>
        </div>
      </div>

      <div ref={scrollRef} className="h-96 overflow-y-auto p-4 space-y-3">
        {thoughts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <span className="text-4xl mb-2">🤖</span>
            <p>Waiting for agent activity...</p>
            <p className="text-sm">The agent analyzes invoices automatically</p>
          </div>
        ) : (
          thoughts.map((thought, index) => {
            const style = typeStyles[thought.type];
            return (
              <div
                key={`${thought.timestamp}-${index}`}
                className={`p-3 rounded-lg border ${style.bg} ${style.border} animate-fadeIn`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-lg">{style.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-gray-500">{formatTime(thought.timestamp)}</span>
                      {thought.tokenId !== 'system' && (
                        <span className="text-xs bg-gray-700 px-2 py-0.5 rounded">
                          Invoice #{thought.tokenId.slice(0, 8)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-200">{thought.message}</p>
                    {thought.data && thought.type === 'analysis' && (
                      <div className="mt-2 flex gap-4 text-xs text-gray-400">
                        {thought.data.riskScore !== undefined && (
                          <span>Risk: {String(thought.data.riskScore)}/100</span>
                        )}
                        {thought.data.paymentProbability !== undefined && (
                          <span>Payment Prob: {String(thought.data.paymentProbability)}%</span>
                        )}
                        {thought.data.confidence !== undefined && (
                          <span>Confidence: {String(thought.data.confidence)}%</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
