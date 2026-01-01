import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';

interface ConnectionStatusProps {
  connected: boolean;
  connecting: boolean;
  maxRetriesReached: boolean;
  onReconnect: () => void;
}

export function ConnectionStatus({
  connected,
  connecting,
  maxRetriesReached,
  onReconnect,
}: ConnectionStatusProps) {
  return (
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
        <Button size="sm" variant="outline" onClick={onReconnect} className="h-6 px-2 text-xs">
          <RotateCcw className="w-3 h-3 mr-1" />
          Retry
        </Button>
      )}
    </div>
  );
}
