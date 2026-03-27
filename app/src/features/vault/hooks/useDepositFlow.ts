import { useState, useEffect, useRef } from 'react';
import { useDepositToVault, useYieldVault } from '@/hooks/use-yield-vault';
import { useYieldAPY } from '@/hooks/use-yield';
import { Strategy } from '@/lib/contracts/abis';
import { parseUnits } from 'viem';

export type StrategyType = 'hold' | 'conservative' | 'aggressive';
export type DepositStep = 'input' | 'approving' | 'depositing' | 'success' | 'error';

// Timeout configuration
const CONFIRMATION_TIMEOUT_MS = 60_000; // 60 seconds
const WARNING_THRESHOLD_MS = 45_000; // Show warning at 45 seconds

const strategyMap: Record<StrategyType, Strategy> = {
  hold: Strategy.Hold,
  conservative: Strategy.Conservative,
  aggressive: Strategy.Aggressive,
};

interface UseDepositFlowParams {
  tokenId?: bigint;
  invoiceAmount?: string;
  onSuccess?: () => void;
}

export function useDepositFlow({ tokenId, invoiceAmount, onSuccess }: UseDepositFlowParams) {
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyType>('conservative');
  const [depositAmount, setDepositAmount] = useState(invoiceAmount || '');
  const [acceptRisk, setAcceptRisk] = useState(false);
  const [step, setStep] = useState<DepositStep>('input');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Timeout tracking state
  const [confirmationStartTime, setConfirmationStartTime] = useState<number | null>(null);
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
  const timeoutTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { conservativeAPY, aggressiveAPY } = useYieldVault();
  const { supplyAPY: aaveAPY, isLive: hasAaveData } = useYieldAPY('USDC');

  // Use real Aave V3 APY if available, otherwise fall back to contract values
  const displayConservativeAPY = hasAaveData && aaveAPY ? parseFloat(aaveAPY) : conservativeAPY;
  const displayAggressiveAPY = hasAaveData && aaveAPY ? parseFloat(aaveAPY) * 1.8 : aggressiveAPY;

  const {
    approve,
    deposit,
    approveHash,
    depositHash,
    isApproving,
    isApproveConfirming,
    isApproveSuccess,
    approveError,
    approveConfirmError,
    isDepositing,
    isDepositConfirming,
    isDepositSuccess,
    depositError,
    depositConfirmError,
  } = useDepositToVault();

  // Handle approval success - move to deposit step
  useEffect(() => {
    if (isApproveSuccess && step === 'approving' && tokenId) {
      setStep('depositing');
      deposit({
        tokenId,
        strategy: strategyMap[selectedStrategy],
        principal: parseUnits(depositAmount || '0', 18),
      });
    }
  }, [isApproveSuccess, step, tokenId, selectedStrategy, depositAmount, deposit]);

  // Handle deposit success
  useEffect(() => {
    if (isDepositSuccess && step === 'depositing') {
      setStep('success');
      onSuccess?.();
    }
  }, [isDepositSuccess, step, onSuccess]);

  // Map error messages to user-friendly versions
  const getUserFriendlyError = (error: Error | null): string => {
    if (!error) return 'Something went wrong';
    const msg = error.message.toLowerCase();

    if (msg.includes('user rejected') || msg.includes('user denied')) {
      return 'Transaction cancelled. You can try again when ready.';
    }
    if (msg.includes('insufficient funds') || msg.includes('insufficient balance')) {
      return 'Insufficient funds. Check your USDC balance and try again.';
    }
    if (msg.includes('nonce')) {
      return 'Transaction conflict. Please refresh and try again.';
    }
    if (msg.includes('gas')) {
      return 'Gas estimation failed. The network may be congested.';
    }
    if (msg.includes('allowance') || msg.includes('approve')) {
      return 'Approval required. Please approve USDC spending first.';
    }
    if (msg.includes('paused')) {
      return 'Protocol temporarily paused. Your funds are safe.';
    }

    // Fallback: truncate long technical messages
    if (error.message.length > 100) {
      return 'Transaction failed. Please try again.';
    }
    return error.message;
  };

  // Handle transaction submission errors
  useEffect(() => {
    if (approveError) {
      console.error('❌ Approve error:', approveError);
      setStep('error');
      setErrorMessage(getUserFriendlyError(approveError));
    }
  }, [approveError]);

  useEffect(() => {
    if (depositError) {
      setStep('error');
      setErrorMessage(getUserFriendlyError(depositError));
    }
  }, [depositError]);

  // Handle confirmation errors
  useEffect(() => {
    if (approveConfirmError) {
      setStep('error');
      setErrorMessage(getUserFriendlyError(approveConfirmError));
    }
  }, [approveConfirmError]);

  useEffect(() => {
    if (depositConfirmError) {
      setStep('error');
      setErrorMessage(getUserFriendlyError(depositConfirmError));
    }
  }, [depositConfirmError]);

  // Timeout tracking for confirmations
  useEffect(() => {
    if (isApproveConfirming || isDepositConfirming) {
      if (!confirmationStartTime) {
        setConfirmationStartTime(Date.now());
        setShowTimeoutWarning(false);

        // Set warning timer (45s)
        warningTimerRef.current = setTimeout(() => {
          setShowTimeoutWarning(true);
        }, WARNING_THRESHOLD_MS);

        // Set timeout timer (60s)
        timeoutTimerRef.current = setTimeout(() => {
          setStep('error');
          setErrorMessage(
            'Transaction confirmation timed out. Your transaction may still be processing. ' +
            'Click "Check Status" to verify manually, or try again.'
          );
        }, CONFIRMATION_TIMEOUT_MS);
      }
    } else {
      // Clear timers when confirmation completes
      if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      timeoutTimerRef.current = null;
      warningTimerRef.current = null;
      setConfirmationStartTime(null);
      setShowTimeoutWarning(false);
    }

    return () => {
      if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    };
  }, [isApproveConfirming, isDepositConfirming, confirmationStartTime]);

  const handleDeposit = () => {
    if (tokenId === undefined) {
      setErrorMessage('No token ID provided');
      setStep('error');
      return;
    }

    setStep('approving');
    setErrorMessage(null);
    approve(tokenId);
  };

  const handleReset = () => {
    setStep('input');
    setAcceptRisk(false);
    setErrorMessage(null);
  };

  const handleRetry = () => {
    setStep('input');
    setErrorMessage(null);
  };

  const isProcessing =
    step === 'approving' ||
    step === 'depositing' ||
    isApproving ||
    isApproveConfirming ||
    isDepositing ||
    isDepositConfirming;

  return {
    // State
    selectedStrategy,
    setSelectedStrategy,
    depositAmount,
    setDepositAmount,
    acceptRisk,
    setAcceptRisk,
    step,
    errorMessage,

    // APY data
    displayConservativeAPY,
    displayAggressiveAPY,
    hasAaveData,

    // Transaction data
    approveHash,
    depositHash,
    isApproving,
    isApproveConfirming,
    isDepositing,
    isDepositConfirming,

    // Timeout tracking
    showTimeoutWarning,
    confirmationStartTime,

    // Computed
    isProcessing,
    currentStep: step === 'approving' || isApproving || isApproveConfirming ? 1 : 2,
    isConfirming: isApproveConfirming || isDepositConfirming,

    // Actions
    handleDeposit,
    handleReset,
    handleRetry,
  };
}
