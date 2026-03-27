'use client';

import { useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bot, RotateCcw, AlertCircle, WifiOff } from 'lucide-react';
import { useAgentWebSocket } from '../../hooks/useAgentWebSocket';
import { ConnectionStatus } from '../ConnectionStatus';
import { ActivityCard } from '../ActivityCard';

export function AgentActivity() {
  const { thoughts, connected, connecting, offline, manualReconnect } = useAgentWebSocket();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [thoughts]);

  return (
    <Card className="glass border-glass-border overflow-hidden">
      <div className="px-4 py-3 border-b border-glass-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <Bot className="w-4 h-4 text-primary" />
          </div>
          <h2 className="font-semibold">Agent Activity</h2>
        </div>
        <ConnectionStatus
          connected={connected}
          connecting={connecting}
          offline={offline}
          onReconnect={manualReconnect}
        />
      </div>

      {offline && (
        <div className="px-4 py-3 bg-destructive/10 border-b border-destructive/30 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-destructive">
            <WifiOff className="w-4 h-4" />
            <span>Agent service is offline. Start the agent or check your connection.</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={manualReconnect}
            className="h-7 px-3 text-xs border-destructive/30 hover:bg-destructive/10"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Retry
          </Button>
        </div>
      )}

      {!connected && !connecting && !offline && (
        <div className="px-4 py-3 bg-yellow-900/20 border-b border-yellow-800/30 flex items-center gap-2 text-sm text-yellow-400">
          <AlertCircle className="w-4 h-4" />
          <span>Reconnecting to agent...</span>
        </div>
      )}

      <div ref={scrollRef} className="h-96 overflow-y-auto p-4 space-y-3">
        {thoughts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <Bot className="w-8 h-8" />
            </div>
            <p className="font-medium">
              {offline ? 'Agent offline' : 'Waiting for agent activity...'}
            </p>
            <p className="text-sm">
              {offline
                ? 'Start the agent service to see real-time analysis'
                : 'The agent analyzes invoices automatically'}
            </p>
          </div>
        ) : (
          thoughts.map((thought, index) => (
            <ActivityCard key={`${thought.timestamp}-${index}`} thought={thought} isNew={index === thoughts.length - 1} />
          ))
        )}
      </div>
    </Card>
  );
}
