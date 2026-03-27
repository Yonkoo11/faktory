import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, ExternalLink, AlertTriangle } from 'lucide-react';
import { usePublicClient, useChainId } from 'wagmi';
import { getChainMeta } from '@/lib/contracts/addresses';

interface ProcessingStateProps {
  open: boolean;
  currentStep: number;
  isConfirming: boolean;
  approveHash?: string;
  depositHash?: string;
  showTimeoutWarning?: boolean;
  confirmationStartTime?: number | null;
}

export function ProcessingState({
  open,
  currentStep,
  isConfirming,
  approveHash,
  depositHash,
  showTimeoutWarning = false,
  confirmationStartTime = null,
}: ProcessingStateProps) {
  const publicClient = usePublicClient();
  const chainId = useChainId();
  const explorerUrl = getChainMeta(chainId)?.explorerUrl || 'https://etherscan.io';
  const [manualCheckLoading, setManualCheckLoading] = useState(false);
  const [manualCheckResult, setManualCheckResult] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  const stepLabel =
    currentStep === 1
      ? isConfirming
        ? 'Confirming approval...'
        : 'Approve NFT transfer...'
      : isConfirming
        ? 'Confirming deposit...'
        : 'Depositing to vault...';

  const currentHash = currentStep === 1 ? approveHash : depositHash;

  // Track elapsed time
  useEffect(() => {
    if (!confirmationStartTime || !isConfirming) {
      setElapsedTime(0);
      return;
    }
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - confirmationStartTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [confirmationStartTime, isConfirming]);

  // Manual transaction check handler
  const handleManualCheck = async () => {
    if (!currentHash || !publicClient) return;
    setManualCheckLoading(true);
    setManualCheckResult(null);

    try {
      const receipt = await publicClient.getTransactionReceipt({
        hash: currentHash as `0x${string}`,
      });

      if (receipt) {
        if (receipt.status === 'success') {
          setManualCheckResult('✓ Transaction confirmed! Refresh the page to see updates.');
        } else {
          setManualCheckResult('✗ Transaction failed. Please check the block explorer.');
        }
      } else {
        setManualCheckResult('Transaction still pending. Please wait...');
      }
    } catch (error) {
      setManualCheckResult('Could not fetch transaction status. Check the block explorer.');
    } finally {
      setManualCheckLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="glass border-glass-border max-w-md">
        <DialogTitle className="sr-only">Transaction Processing</DialogTitle>
        <div className="text-center py-8">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-6">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
          </div>
          <h2 className="text-2xl font-bold mb-3">Processing</h2>
          <p className="text-muted-foreground mb-2">{stepLabel}</p>

          {/* Time estimate with timeout warning */}
          <div className="mb-6">
            {isConfirming ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground inline-flex items-center gap-1.5">
                  {showTimeoutWarning ? (
                    <>
                      <AlertTriangle className="w-4 h-4 text-warning" />
                      <span className="text-warning">Confirmation taking longer than expected</span>
                    </>
                  ) : (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                      <span>~15-30 seconds remaining</span>
                    </>
                  )}
                </p>
                {elapsedTime > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Elapsed: {elapsedTime}s
                  </p>
                )}
                {showTimeoutWarning && (
                  <p className="text-xs text-warning">
                    This may indicate network congestion. You can check status manually or wait.
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Waiting for wallet confirmation...
              </p>
            )}
          </div>

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
              href={`${explorerUrl}/tx/${currentHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline mb-4"
            >
              View on Explorer
              <ExternalLink className="w-3 h-3" />
            </a>
          )}

          {/* Manual check button - shown when warning appears */}
          {showTimeoutWarning && currentHash && (
            <div className="mt-4 mb-4 space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualCheck}
                disabled={manualCheckLoading}
                className="w-full"
              >
                {manualCheckLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  'Check Transaction Status'
                )}
              </Button>
              {manualCheckResult && (
                <p className="text-sm text-center p-2 rounded-md bg-muted/50">
                  {manualCheckResult}
                </p>
              )}
            </div>
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
