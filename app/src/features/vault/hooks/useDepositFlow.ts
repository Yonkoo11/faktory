import { useState, useEffect } from 'react';
import { useDepositToVault, useYieldVault } from '@/hooks/use-yield-vault';
import { useLendleAPY } from '@/hooks/use-lendle';
import { Strategy } from '@/lib/contracts/abis';
import { parseUnits } from 'viem';

export type StrategyType = 'hold' | 'conservative' | 'aggressive';
export type DepositStep = 'input' | 'approving' | 'depositing' | 'success' | 'error';

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

  const { conservativeAPY, aggressiveAPY } = useYieldVault();
  const { supplyAPY: lendleAPY, isLive: hasLendleData } = useLendleAPY('USDC');

  // Use real Lendle APY if available, otherwise fall back to contract values
  const displayConservativeAPY = hasLendleData && lendleAPY ? parseFloat(lendleAPY) : conservativeAPY;
  const displayAggressiveAPY = hasLendleData && lendleAPY ? parseFloat(lendleAPY) * 1.8 : aggressiveAPY;

  const {
    approve,
    deposit,
    approveHash,
    depositHash,
    isApproving,
    isApproveConfirming,
    isApproveSuccess,
    isDepositing,
    isDepositConfirming,
    isDepositSuccess,
    depositError,
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

  // Handle errors
  useEffect(() => {
    if (depositError) {
      setStep('error');
      setErrorMessage(getUserFriendlyError(depositError));
    }
  }, [depositError]);

  const handleDeposit = async () => {
    if (!tokenId) {
      setErrorMessage('No token ID provided');
      setStep('error');
      return;
    }

    setStep('approving');
    setErrorMessage(null);

    try {
      await approve(tokenId);
    } catch (err) {
      setStep('error');
      setErrorMessage(err instanceof Error ? err.message : 'Approval failed');
    }
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
    hasLendleData,

    // Transaction data
    approveHash,
    depositHash,
    isApproving,
    isApproveConfirming,
    isDepositing,
    isDepositConfirming,

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
