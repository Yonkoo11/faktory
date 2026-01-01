"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useDepositFlow } from '../../hooks/useDepositFlow';
import { useStrategyConfig } from '../../hooks/useStrategyConfig';
import { StrategySelector } from './StrategySelector';
import { AmountInput } from './AmountInput';
import { RiskDisclaimer } from './RiskDisclaimer';
import { DepositSummary } from './DepositSummary';
import { ProcessingState } from './ProcessingState';
import { ResultState } from './ResultState';

interface DepositModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId?: string;
  invoiceAmount?: string;
  tokenId?: bigint;
  onSuccess?: () => void;
}

export function DepositModal({
  open,
  onOpenChange,
  invoiceId,
  invoiceAmount,
  tokenId,
  onSuccess,
}: DepositModalProps) {
  const {
    selectedStrategy,
    setSelectedStrategy,
    depositAmount,
    setDepositAmount,
    acceptRisk,
    setAcceptRisk,
    step,
    errorMessage,
    displayConservativeAPY,
    displayAggressiveAPY,
    hasLendleData,
    approveHash,
    depositHash,
    isProcessing,
    currentStep,
    isConfirming,
    handleDeposit,
    handleReset,
    handleRetry,
  } = useDepositFlow({ tokenId, invoiceAmount, onSuccess });

  const strategies = useStrategyConfig({
    conservativeAPY: displayConservativeAPY,
    aggressiveAPY: displayAggressiveAPY,
    hasLendleData,
  });

  const selectedStrategyConfig = strategies.find((s) => s.id === selectedStrategy);

  const handleClose = () => {
    handleReset();
    onOpenChange(false);
  };

  // Show success or error state
  if (step === 'success' || step === 'error') {
    return (
      <ResultState
        open={open}
        isSuccess={step === 'success'}
        selectedStrategy={selectedStrategy}
        depositHash={depositHash}
        errorMessage={errorMessage}
        onClose={handleClose}
        onRetry={step === 'error' ? handleRetry : undefined}
      />
    );
  }

  // Show processing state
  if (isProcessing) {
    return (
      <ProcessingState
        open={open}
        currentStep={currentStep}
        isConfirming={isConfirming}
        approveHash={approveHash}
        depositHash={depositHash}
      />
    );
  }

  // Main input form
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass border-glass-border max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Deposit & Earn Yield</DialogTitle>
          {invoiceId && (
            <p className="text-sm text-muted-foreground mt-1">Invoice {invoiceId}</p>
          )}
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Strategy Selection */}
          <StrategySelector
            strategies={strategies}
            selectedStrategy={selectedStrategy}
            onSelectStrategy={setSelectedStrategy}
          />

          {/* Deposit Amount + Projected Earnings */}
          <AmountInput
            depositAmount={depositAmount}
            onAmountChange={setDepositAmount}
            invoiceAmount={invoiceAmount}
            selectedStrategyAPY={selectedStrategyConfig?.apyValue || 0}
          />

          {/* Risk Disclaimer */}
          <RiskDisclaimer acceptRisk={acceptRisk} onAcceptChange={setAcceptRisk} />

          {/* Confirmation Summary */}
          {depositAmount && selectedStrategy && (
            <DepositSummary
              depositAmount={depositAmount}
              selectedStrategy={selectedStrategy}
              strategyAPY={selectedStrategyConfig?.apy || '0%'}
            />
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 border-glass-border"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeposit}
              disabled={!acceptRisk || !depositAmount || !tokenId || isProcessing}
              className="flex-1 bg-gradient-to-r from-primary to-accent hover:opacity-90"
            >
              Confirm Deposit
            </Button>
          </div>

          {!tokenId && (
            <p className="text-xs text-warning text-center">
              Token ID is required. Please select an invoice from your portfolio.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
