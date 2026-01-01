'use client';

import { useState, useEffect, useCallback } from 'react';
import { useChainId, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatEther } from 'viem';
import { getContractAddresses } from '@/lib/wagmi';
import { InvoiceNFTABI, YieldVaultABI, StrategyNames, InvoiceStatusNames } from '@/lib/abi';
import { FileText, Lock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { InvoiceDepositForm } from './InvoiceDepositForm';
import { InvoiceWithdrawConfirm } from './InvoiceWithdrawConfirm';

interface InvoiceData {
  dataCommitment: `0x${string}`;
  amountCommitment: `0x${string}`;
  dueDate: bigint;
  createdAt: bigint;
  issuer: `0x${string}`;
  status: number;
  riskScore: number;
  paymentProbability: number;
}

interface DepositData {
  tokenId: bigint;
  owner: `0x${string}`;
  strategy: number;
  depositTime: bigint;
  principal: bigint;
  accruedYield: bigint;
  lastYieldUpdate: bigint;
  active: boolean;
}

const STRATEGY_INFO = [
  { name: 'Hold', apy: '0%', description: 'No yield, waiting for conditions' },
  { name: 'Conservative', apy: '3-4%', description: 'Stable, low-risk yield' },
  { name: 'Aggressive', apy: '6-8%', description: 'Higher yield, more risk' },
];

interface InvoiceCardProps {
  tokenId: string;
  onRefresh?: () => void;
}

export function InvoiceCard({ tokenId, onRefresh }: InvoiceCardProps) {
  const chainId = useChainId();
  const contracts = getContractAddresses(chainId);
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);
  const [depositTriggered, setDepositTriggered] = useState(false);

  const { data: invoice, isLoading: isLoadingInvoice, error: invoiceError } = useReadContract({
    address: contracts.invoiceNFT,
    abi: InvoiceNFTABI,
    functionName: 'getInvoice',
    args: [BigInt(tokenId)],
  }) as { data: InvoiceData | undefined; isLoading: boolean; error: Error | null };

  const { data: deposit, refetch: refetchDeposit } = useReadContract({
    address: contracts.yieldVault,
    abi: YieldVaultABI,
    functionName: 'getDeposit',
    args: [BigInt(tokenId)],
  }) as { data: DepositData | undefined; refetch: () => void };

  const { data: accruedYield } = useReadContract({
    address: contracts.yieldVault,
    abi: YieldVaultABI,
    functionName: 'getAccruedYield',
    args: [BigInt(tokenId)],
  });

  const { writeContract: approve, data: approveHash, isPending: isApproving, reset: resetApprove } = useWriteContract();
  const { writeContract: depositToVault, data: depositHash, isPending: isDepositing } = useWriteContract();
  const { writeContract: withdraw, data: withdrawHash, isPending: isWithdrawing } = useWriteContract();

  const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({ hash: approveHash });
  const { isLoading: isDepositConfirming, isSuccess: isDepositSuccess } = useWaitForTransactionReceipt({ hash: depositHash });
  const { isLoading: isWithdrawConfirming, isSuccess: isWithdrawSuccess } = useWaitForTransactionReceipt({ hash: withdrawHash });

  const handleDepositAfterApproval = useCallback(() => {
    if (isApproveSuccess && !depositTriggered && showDeposit) {
      setDepositTriggered(true);
    }
  }, [isApproveSuccess, depositTriggered, showDeposit]);

  useEffect(() => {
    handleDepositAfterApproval();
  }, [handleDepositAfterApproval]);

  useEffect(() => {
    if (isDepositSuccess && depositHash) {
      toast.success('Deposit successful!', {
        description: 'Your invoice is now earning yield.',
      });
      setShowDeposit(false);
      setDepositTriggered(false);
      resetApprove();
      refetchDeposit();
      onRefresh?.();
    }
  }, [isDepositSuccess, depositHash, resetApprove, refetchDeposit, onRefresh]);

  useEffect(() => {
    if (isWithdrawSuccess && withdrawHash) {
      toast.success('Withdrawal successful!', {
        description: 'Your funds have been returned to your wallet.',
      });
      refetchDeposit();
      onRefresh?.();
    }
  }, [isWithdrawSuccess, withdrawHash, refetchDeposit, onRefresh]);

  const handleDeposit = (principal: string, selectedStrategy: number) => {
    setDepositTriggered(false);
    approve({
      address: contracts.invoiceNFT,
      abi: InvoiceNFTABI,
      functionName: 'approve',
      args: [contracts.yieldVault, BigInt(tokenId)],
    });

    // Auto-trigger deposit after approval
    if (isApproveSuccess) {
      const principalWei = BigInt(principal) * BigInt(10 ** 18);
      depositToVault({
        address: contracts.yieldVault,
        abi: YieldVaultABI,
        functionName: 'deposit',
        args: [BigInt(tokenId), selectedStrategy, principalWei],
      });
    }
  };

  const handleWithdraw = () => {
    withdraw({
      address: contracts.yieldVault,
      abi: YieldVaultABI,
      functionName: 'withdraw',
      args: [BigInt(tokenId)],
    });
    setShowWithdrawConfirm(false);
  };

  if (isLoadingInvoice) {
    return (
      <div className="glass border-glass-border rounded-xl p-4">
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (invoiceError) {
    return (
      <div className="glass border-destructive/30 rounded-xl p-4">
        <div className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm">Failed to load invoice #{tokenId}</span>
        </div>
      </div>
    );
  }

  if (!invoice) return null;

  const dueDate = new Date(Number(invoice.dueDate) * 1000);
  const daysUntilDue = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const isInYield = deposit?.active;
  const statusName = InvoiceStatusNames[invoice.status] || 'Unknown';

  return (
    <div className="glass border-glass-border rounded-xl p-4 hover:border-primary/30 transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div>
            <span className="font-mono text-sm font-medium">Invoice #{tokenId}</span>
            <div className="flex items-center gap-1 mt-0.5">
              <Lock className="w-3 h-3 text-accent" />
              <span className="text-[10px] text-accent">Private</span>
            </div>
          </div>
        </div>
        <span
          className={`px-2 py-1 text-xs rounded ${
            isInYield ? 'bg-green-900/50 text-green-400' : 'bg-blue-900/50 text-blue-400'
          }`}
        >
          {isInYield ? 'Earning Yield' : statusName}
        </span>
      </div>

      <div className="space-y-2 text-sm mb-4">
        <div className="flex justify-between">
          <span className="text-gray-400">Due Date</span>
          <span>{dueDate.toLocaleDateString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Risk Score</span>
          <span>{invoice.riskScore}/100</span>
        </div>
        {isInYield && deposit && (
          <>
            <div className="flex justify-between border-t border-gray-700 pt-2">
              <span className="text-gray-400">Strategy</span>
              <span>{StrategyNames[deposit.strategy]} ({STRATEGY_INFO[deposit.strategy].apy})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Accrued Yield</span>
              <span className="text-green-400">
                +${accruedYield ? Number(formatEther(accruedYield)).toFixed(2) : '0.00'}
              </span>
            </div>
          </>
        )}
      </div>

      {!isInYield && invoice.status === 0 ? (
        showDeposit ? (
          <InvoiceDepositForm
            tokenId={tokenId}
            isApproving={isApproving}
            isApproveConfirming={isApproveConfirming}
            isDepositing={isDepositing}
            isDepositConfirming={isDepositConfirming}
            onDeposit={handleDeposit}
            onCancel={() => setShowDeposit(false)}
          />
        ) : (
          <button
            onClick={() => setShowDeposit(true)}
            className="w-full bg-blue-600 hover:bg-blue-500 py-2 rounded-lg text-sm font-medium"
          >
            Start Earning Yield
          </button>
        )
      ) : isInYield ? (
        showWithdrawConfirm ? (
          <InvoiceWithdrawConfirm
            tokenId={tokenId}
            accruedYield={accruedYield ? Number(formatEther(accruedYield)).toFixed(2) : '0.00'}
            isWithdrawing={isWithdrawing}
            isWithdrawConfirming={isWithdrawConfirming}
            onConfirm={handleWithdraw}
            onCancel={() => setShowWithdrawConfirm(false)}
          />
        ) : (
          <button
            onClick={() => setShowWithdrawConfirm(true)}
            className="w-full bg-gray-700 hover:bg-gray-600 py-2 rounded-lg text-sm font-medium"
          >
            Withdraw & Claim Yield
          </button>
        )
      ) : null}
    </div>
  );
}
