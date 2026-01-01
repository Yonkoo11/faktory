import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Loader2, CheckCircle2, ExternalLink } from 'lucide-react';

interface ProcessingStateProps {
  open: boolean;
  currentStep: number;
  isConfirming: boolean;
  approveHash?: string;
  depositHash?: string;
}

export function ProcessingState({
  open,
  currentStep,
  isConfirming,
  approveHash,
  depositHash,
}: ProcessingStateProps) {
  const stepLabel =
    currentStep === 1
      ? isConfirming
        ? 'Confirming approval...'
        : 'Approve NFT transfer...'
      : isConfirming
        ? 'Confirming deposit...'
        : 'Depositing to vault...';

  const currentHash = currentStep === 1 ? approveHash : depositHash;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="glass border-glass-border max-w-md">
        <div className="text-center py-8">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-6">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
          </div>
          <h2 className="text-2xl font-bold mb-3">Processing</h2>
          <p className="text-muted-foreground mb-2">{stepLabel}</p>

          {/* Time estimate */}
          <p className="text-sm text-muted-foreground mb-6">
            {isConfirming ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                ~15-30 seconds remaining
              </span>
            ) : (
              'Waiting for wallet confirmation...'
            )}
          </p>

          {/* Progress steps */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= 1
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {currentStep > 1 ? <CheckCircle2 className="w-4 h-4" /> : '1'}
              </div>
              <span className="text-sm">Approve</span>
            </div>
            <div className={`w-8 h-0.5 ${currentStep > 1 ? 'bg-primary' : 'bg-muted'}`} />
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= 2
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                2
              </div>
              <span className="text-sm">Deposit</span>
            </div>
          </div>

          {/* Explorer link */}
          {currentHash && (
            <a
              href={`https://explorer.sepolia.mantle.xyz/tx/${currentHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline mb-4"
            >
              View on Explorer
              <ExternalLink className="w-3 h-3" />
            </a>
          )}

          <p className="text-xs text-muted-foreground mt-4">
            {isConfirming
              ? 'Transaction submitted. Waiting for block confirmation...'
              : 'Please confirm the transaction in your wallet'}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
