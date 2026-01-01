import { Badge } from '@/components/ui/badge';
import { Brain, BarChart3, Target, Zap, AlertCircle } from 'lucide-react';
import type { AgentThought } from '../hooks/useAgentWebSocket';

const typeConfig = {
  thinking: { icon: Brain, label: 'Thinking', bgClass: 'bg-gradient-to-r from-muted/50 to-muted/30', borderClass: 'border-muted/50', iconBgClass: 'bg-muted/30', iconClass: 'text-muted-foreground' },
  analysis: { icon: BarChart3, label: 'Analysis', bgClass: 'bg-gradient-to-r from-primary/15 to-primary/5', borderClass: 'border-primary/40', iconBgClass: 'bg-primary/20', iconClass: 'text-primary' },
  decision: { icon: Target, label: 'Decision', bgClass: 'bg-gradient-to-r from-success/15 to-success/5', borderClass: 'border-success/40', iconBgClass: 'bg-success/20', iconClass: 'text-success' },
  execution: { icon: Zap, label: 'Execution', bgClass: 'bg-gradient-to-r from-warning/15 to-warning/5', borderClass: 'border-warning/40', iconBgClass: 'bg-warning/20', iconClass: 'text-warning' },
  error: { icon: AlertCircle, label: 'Error', bgClass: 'bg-gradient-to-r from-destructive/15 to-destructive/5', borderClass: 'border-destructive/40', iconBgClass: 'bg-destructive/20', iconClass: 'text-destructive' },
};

interface ActivityCardProps {
  thought: AgentThought;
  isNew?: boolean;
}

export function ActivityCard({ thought, isNew }: ActivityCardProps) {
  const config = typeConfig[thought.type];
  const Icon = config.icon;
  const formatTime = (timestamp: number) => new Date(timestamp).toLocaleTimeString();

  const riskScore = thought.data?.riskScore as number | undefined;
  const getRiskColor = (score: number) => {
    if (score <= 30) return 'text-success';
    if (score <= 60) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <div
      className={`p-4 rounded-xl border ${config.bgClass} ${config.borderClass} transition-all hover:scale-[1.01] ${
        isNew ? 'animate-in fade-in slide-in-from-bottom-3 duration-500 ring-2 ring-primary/20' : ''
      }`}
    >
      <div className="flex items-start gap-4">
        <div className={`w-10 h-10 rounded-xl ${config.iconBgClass} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-5 h-5 ${config.iconClass}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Badge variant="outline" className={`text-xs ${config.borderClass} ${config.iconClass} font-medium`}>
              {config.label}
            </Badge>
            <span className="text-xs text-muted-foreground">{formatTime(thought.timestamp)}</span>
            {thought.tokenId !== 'system' && thought.tokenId !== 'market' && thought.tokenId !== 'demo' && (
              <Badge variant="secondary" className="text-xs font-mono">
                #{thought.tokenId.slice(0, 8)}
              </Badge>
            )}
          </div>

          <p className="text-sm text-foreground leading-relaxed">{thought.message}</p>

          {thought.data && thought.type === 'analysis' && (
            <div className="mt-3 p-3 rounded-lg bg-background/50 border border-glass-border">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {riskScore !== undefined && (
                  <div className="text-center">
                    <div className={`text-lg font-bold ${getRiskColor(riskScore)}`}>{riskScore}</div>
                    <div className="text-xs text-muted-foreground">Risk Score</div>
                  </div>
                )}
                {thought.data.confidence !== undefined && (
                  <div className="text-center">
                    <div className="text-lg font-bold text-primary">{String(thought.data.confidence)}%</div>
                    <div className="text-xs text-muted-foreground">Confidence</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
