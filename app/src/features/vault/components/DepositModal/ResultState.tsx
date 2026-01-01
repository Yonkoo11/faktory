import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import type { StrategyType } from '../../hooks/useDepositFlow';

interface ResultStateProps {
  open: boolean;
  isSuccess: boolean;
  selectedStrategy?: StrategyType;
  depositHash?: string;
  errorMessage?: string | null;
  onClose: () => void;
  onRetry?: () => void;
}

export function ResultState({
  open,
  isSuccess,
  selectedStrategy,
  depositHash,
  errorMessage,
  onClose,
  onRetry,
}: ResultStateProps) {
  if (isSuccess) {
    const strategyName = selectedStrategy
      ? selectedStrategy.charAt(0).toUpperCase() + selectedStrategy.slice(1)
      : '';

    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="glass border-glass-border max-w-md">
          <div className="text-center py-8">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-success/20 to-primary/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-success" />
            </div>
            <h2 className="text-2xl font-bold mb-3">Deposit Successful!</h2>
            <p className="text-muted-foreground mb-2">
              Your invoice is now earning yield
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Strategy:{' '}
              <span className="font-medium text-foreground">{strategyName}</span>
            </p>
            {depositHash && (
              <a
                href={`https://explorer.sepolia.mantle.xyz/tx/${depositHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline mb-6"
              >
                View on Explorer
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            <div className="mt-4">
              <Button
                onClick={onClose}
                className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
              >
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Error state
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass border-glass-border max-w-md">
        <div className="text-center py-8">
          <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold mb-3">Transaction Failed</h2>
          <p className="text-muted-foreground mb-6">
            {errorMessage || 'Something went wrong'}
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-glass-border"
            >
              Cancel
            </Button>
            {onRetry && (
              <Button
                onClick={onRetry}
                className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
              >
                Try Again
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
