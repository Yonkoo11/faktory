'use client';

import { useEffect, useState, useRef } from 'react';
import { AGENT_WS_URL } from '@/lib/wagmi';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bot, Brain, BarChart3, Target, Zap, AlertCircle, TrendingDown, TrendingUp, RotateCcw } from 'lucide-react';

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

interface AgentActivityProps {
  showDemoControls?: boolean;
}

const typeConfig = {
  thinking: {
    icon: Brain,
    label: 'Thinking',
    bgClass: 'bg-gradient-to-r from-muted/50 to-muted/30',
    borderClass: 'border-muted/50',
    iconBgClass: 'bg-muted/30',
    iconClass: 'text-muted-foreground',
  },
  analysis: {
    icon: BarChart3,
    label: 'Analysis',
    bgClass: 'bg-gradient-to-r from-primary/15 to-primary/5',
    borderClass: 'border-primary/40',
    iconBgClass: 'bg-primary/20',
    iconClass: 'text-primary',
  },
  decision: {
    icon: Target,
    label: 'Decision',
    bgClass: 'bg-gradient-to-r from-success/15 to-success/5',
    borderClass: 'border-success/40',
    iconBgClass: 'bg-success/20',
    iconClass: 'text-success',
  },
  execution: {
    icon: Zap,
    label: 'Execution',
    bgClass: 'bg-gradient-to-r from-warning/15 to-warning/5',
    borderClass: 'border-warning/40',
    iconBgClass: 'bg-warning/20',
    iconClass: 'text-warning',
  },
  error: {
    icon: AlertCircle,
    label: 'Error',
    bgClass: 'bg-gradient-to-r from-destructive/15 to-destructive/5',
    borderClass: 'border-destructive/40',
    iconBgClass: 'bg-destructive/20',
    iconClass: 'text-destructive',
  },
};

export function AgentActivity({ showDemoControls = false }: AgentActivityProps) {
  const [thoughts, setThoughts] = useState<AgentThought[]>([]);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [maxRetriesReached, setMaxRetriesReached] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const MAX_RETRIES = 5;
  const BASE_DELAY = 1000;
  const MAX_DELAY = 30000;

  const connect = () => {
    // Clear any pending reconnect
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
        setRetryCount(0); // Reset retry count on successful connection
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

        // Exponential backoff reconnection
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
        // onclose will be called after onerror, so we don't need to handle reconnection here
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

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [thoughts]);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  // Demo scenario triggers
  const triggerDemo = (scenario: 'market_crash' | 'market_rally' | 'reset') => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'triggerDemo', scenario }));
    }
  };

  return (
    <Card className="glass border-glass-border overflow-hidden">
      <div className="px-4 py-3 border-b border-glass-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <Bot className="w-4 h-4 text-primary" />
          </div>
          <h2 className="font-semibold">Agent Activity</h2>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              connected ? 'bg-success animate-pulse' : connecting ? 'bg-warning' : 'bg-destructive'
            }`}
          />
          <span className="text-sm text-muted-foreground">
            {connected ? 'Live' : connecting ? 'Connecting...' : maxRetriesReached ? 'Failed' : 'Reconnecting...'}
          </span>
          {maxRetriesReached && (
            <Button
              size="sm"
              variant="outline"
              onClick={manualReconnect}
              className="h-6 px-2 text-xs"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Retry
            </Button>
          )}
        </div>
      </div>

      {/* Demo Controls - Only shown when explicitly enabled */}
      {showDemoControls && connected && (
        <div className="px-4 py-2 border-b border-glass-border bg-muted/30">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Demo:</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => triggerDemo('market_crash')}
              className="h-7 px-2 text-xs border-destructive/30 hover:bg-destructive/10"
            >
              <TrendingDown className="w-3 h-3 mr-1" />
              Crash
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => triggerDemo('market_rally')}
              className="h-7 px-2 text-xs border-success/30 hover:bg-success/10"
            >
              <TrendingUp className="w-3 h-3 mr-1" />
              Rally
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => triggerDemo('reset')}
              className="h-7 px-2 text-xs"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Reset
            </Button>
          </div>
        </div>
      )}

      <div ref={scrollRef} className="h-96 overflow-y-auto p-4 space-y-3">
        {thoughts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <Bot className="w-8 h-8" />
            </div>
            <p className="font-medium">Waiting for agent activity...</p>
            <p className="text-sm">The agent analyzes invoices automatically</p>
          </div>
        ) : (
          thoughts.map((thought, index) => {
            const config = typeConfig[thought.type];
            const Icon = config.icon;
            const isNew = index === thoughts.length - 1;

            // Calculate risk color for visual indicator
            const riskScore = thought.data?.riskScore as number | undefined;
            const getRiskColor = (score: number) => {
              if (score <= 30) return 'text-success';
              if (score <= 60) return 'text-warning';
              return 'text-destructive';
            };

            return (
              <div
                key={`${thought.timestamp}-${index}`}
                className={`p-4 rounded-xl border ${config.bgClass} ${config.borderClass} transition-all duration-300 hover:scale-[1.01] ${isNew ? 'animate-in fade-in slide-in-from-bottom-3 duration-500 ring-2 ring-primary/20' : ''}`}
              >
                <div className="flex items-start gap-4">
                  {/* Larger icon with background */}
                  <div className={`w-10 h-10 rounded-xl ${config.iconBgClass} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${config.iconClass}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Header row */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Badge variant="outline" className={`text-xs ${config.borderClass} ${config.iconClass} font-medium`}>
                        {config.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{formatTime(thought.timestamp)}</span>
                      {thought.tokenId === 'market' && (
                        <Badge variant="outline" className="text-xs border-primary/30 bg-primary/10 text-primary">
                          Market
                        </Badge>
                      )}
                      {thought.tokenId === 'demo' && (
                        <Badge variant="outline" className="text-xs border-accent/30 bg-accent/10 text-accent animate-pulse">
                          Demo
                        </Badge>
                      )}
                      {thought.tokenId !== 'system' && thought.tokenId !== 'market' && thought.tokenId !== 'demo' && (
                        <Badge variant="secondary" className="text-xs font-mono">
                          #{thought.tokenId.slice(0, 8)}
                        </Badge>
                      )}
                      {Boolean(thought.data?.marketOverride) && (
                        <Badge variant="destructive" className="text-xs animate-pulse font-medium">
                          Emergency
                        </Badge>
                      )}
                    </div>

                    {/* Message */}
                    <p className="text-sm text-foreground leading-relaxed">{thought.message}</p>

                    {/* AI Scoring Breakdown - Enhanced visual display */}
                    {thought.data && thought.type === 'analysis' && (
                      <div className="mt-3 p-3 rounded-lg bg-background/50 border border-glass-border">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {riskScore !== undefined && (
                            <div className="text-center">
                              <div className={`text-lg font-bold ${getRiskColor(riskScore)}`}>
                                {riskScore}
                              </div>
                              <div className="text-xs text-muted-foreground">Risk Score</div>
                            </div>
                          )}
                          {thought.data.paymentProbability !== undefined && (
                            <div className="text-center">
                              <div className="text-lg font-bold text-success">
                                {String(thought.data.paymentProbability)}%
                              </div>
                              <div className="text-xs text-muted-foreground">Payment Prob</div>
                            </div>
                          )}
                          {thought.data.confidence !== undefined && (
                            <div className="text-center">
                              <div className="text-lg font-bold text-primary">
                                {String(thought.data.confidence)}%
                              </div>
                              <div className="text-xs text-muted-foreground">Confidence</div>
                            </div>
                          )}
                          {thought.data.priceChange !== undefined && (
                            <div className="text-center">
                              <div className={`text-lg font-bold ${Number(thought.data.priceChange) < 0 ? 'text-destructive' : 'text-success'}`}>
                                {Number(thought.data.priceChange) > 0 ? '+' : ''}{Number(thought.data.priceChange).toFixed(1)}%
                              </div>
                              <div className="text-xs text-muted-foreground">ETH Price</div>
                            </div>
                          )}
                        </div>
                        {Boolean(thought.data.volatility) && (
                          <div className="mt-2 pt-2 border-t border-glass-border flex items-center justify-center gap-2">
                            <span className="text-xs text-muted-foreground">Market Volatility:</span>
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                String(thought.data.volatility) === 'extreme' ? 'border-destructive text-destructive animate-pulse' :
                                String(thought.data.volatility) === 'high' ? 'border-warning text-warning' :
                                String(thought.data.volatility) === 'medium' ? 'border-warning/70 text-warning' : 'border-success text-success'
                              }`}
                            >
                              {String(thought.data.volatility).toUpperCase()}
                            </Badge>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Mantle cost benefit */}
                    {Boolean(thought.data?.txCostUsd) && (
                      <div className="mt-2 inline-flex items-center gap-2 text-xs bg-success/10 text-success px-2 py-1 rounded-md">
                        <Zap className="w-3 h-3" />
                        Mantle tx: {String(thought.data?.txCostUsd)} (99% cheaper than L1)
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}
