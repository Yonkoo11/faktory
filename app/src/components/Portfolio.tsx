'use client';

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatEther, parseEther } from 'viem';
import { CONTRACTS } from '@/lib/wagmi';
import { InvoiceNFTABI, YieldVaultABI, StrategyNames, InvoiceStatusNames } from '@/lib/abi';
import { useState, useEffect } from 'react';

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

function InvoiceCard({ tokenId }: { tokenId: string }) {
  const [showDeposit, setShowDeposit] = useState(false);
  const [principal, setPrincipal] = useState('10000');

  const { data: invoice, isLoading: isLoadingInvoice } = useReadContract({
    address: CONTRACTS.invoiceNFT as `0x${string}`,
    abi: InvoiceNFTABI,
    functionName: 'getInvoice',
    args: [BigInt(tokenId)],
  }) as { data: InvoiceData | undefined; isLoading: boolean };

  const { data: deposit } = useReadContract({
    address: CONTRACTS.yieldVault as `0x${string}`,
    abi: YieldVaultABI,
    functionName: 'getDeposit',
    args: [BigInt(tokenId)],
  }) as { data: DepositData | undefined };

  const { data: accruedYield } = useReadContract({
    address: CONTRACTS.yieldVault as `0x${string}`,
    abi: YieldVaultABI,
    functionName: 'getAccruedYield',
    args: [BigInt(tokenId)],
  });

  const { writeContract: approve, data: approveHash, isPending: isApproving } = useWriteContract();
  const { writeContract: depositToVault, data: depositHash, isPending: isDepositing } = useWriteContract();
  const { writeContract: withdraw, data: withdrawHash, isPending: isWithdrawing } = useWriteContract();

  const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({ hash: approveHash });
  const { isLoading: isDepositConfirming } = useWaitForTransactionReceipt({ hash: depositHash });
  const { isLoading: isWithdrawConfirming } = useWaitForTransactionReceipt({ hash: withdrawHash });

  // Auto-deposit after approval success
  useEffect(() => {
    if (isApproveSuccess && !isDepositing && !isDepositConfirming) {
      depositToVault({
        address: CONTRACTS.yieldVault as `0x${string}`,
        abi: YieldVaultABI,
        functionName: 'deposit',
        args: [BigInt(tokenId), 1, parseEther(principal)],
      });
    }
  }, [isApproveSuccess, isDepositing, isDepositConfirming, tokenId, principal, depositToVault]);

  if (isLoadingInvoice) {
    return (
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 animate-pulse">
        <div className="h-4 bg-gray-700 rounded w-1/3 mb-3"></div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-700 rounded"></div>
          <div className="h-3 bg-gray-700 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (!invoice) return null;

  const dueDate = new Date(Number(invoice.dueDate) * 1000);
  const daysUntilDue = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const isInYield = deposit?.active;
  const statusName = InvoiceStatusNames[invoice.status] || 'Unknown';

  const handleDeposit = async () => {
    approve({
      address: CONTRACTS.invoiceNFT as `0x${string}`,
      abi: InvoiceNFTABI,
      functionName: 'approve',
      args: [CONTRACTS.yieldVault as `0x${string}`, BigInt(tokenId)],
    });
  };

  const handleWithdraw = () => {
    withdraw({
      address: CONTRACTS.yieldVault as `0x${string}`,
      abi: YieldVaultABI,
      functionName: 'withdraw',
      args: [BigInt(tokenId)],
    });
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">📄</span>
          <span className="font-mono text-sm">#{tokenId}</span>
        </div>
        <span
          className={`px-2 py-1 text-xs rounded ${
            isInYield
              ? 'bg-green-900/50 text-green-400'
              : invoice.status === 0
              ? 'bg-blue-900/50 text-blue-400'
              : 'bg-gray-700 text-gray-400'
          }`}
        >
          {isInYield ? 'Earning Yield' : statusName}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">Due Date</span>
          <span className={daysUntilDue < 0 ? 'text-red-400' : daysUntilDue < 7 ? 'text-yellow-400' : ''}>
            {dueDate.toLocaleDateString()} ({daysUntilDue}d)
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400">Risk Score</span>
          <span
            className={
              invoice.riskScore >= 70
                ? 'text-green-400'
                : invoice.riskScore >= 50
                ? 'text-yellow-400'
                : 'text-red-400'
            }
          >
            {invoice.riskScore}/100
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400">Payment Probability</span>
          <span>{invoice.paymentProbability}%</span>
        </div>

        {isInYield && deposit && (
          <>
            <div className="border-t border-gray-700 my-2 pt-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Strategy</span>
                <span className="text-blue-400">{StrategyNames[deposit.strategy]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Principal</span>
                <span>${Number(formatEther(deposit.principal)).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Accrued Yield</span>
                <span className="text-green-400">
                  +${accruedYield ? Number(formatEther(accruedYield)).toFixed(4) : '0.0000'}
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="mt-4">
        {!isInYield && invoice.status === 0 ? (
          <>
            {!showDeposit ? (
              <button
                onClick={() => setShowDeposit(true)}
                className="w-full bg-blue-600 hover:bg-blue-500 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Start Earning Yield
              </button>
            ) : (
              <div className="space-y-2">
                <input
                  type="number"
                  value={principal}
                  onChange={(e) => setPrincipal(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm"
                  placeholder="Principal amount (USD)"
                />
                <button
                  onClick={handleDeposit}
                  disabled={isApproving || isDepositing || isApproveConfirming || isDepositConfirming}
                  className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-700 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  {isApproving || isApproveConfirming
                    ? 'Approving...'
                    : isDepositing || isDepositConfirming
                    ? 'Depositing...'
                    : 'Confirm Deposit'}
                </button>
              </div>
            )}
          </>
        ) : isInYield ? (
          <button
            onClick={handleWithdraw}
            disabled={isWithdrawing || isWithdrawConfirming}
            className="w-full bg-gray-700 hover:bg-gray-600 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {isWithdrawing || isWithdrawConfirming ? 'Withdrawing...' : 'Withdraw & Claim Yield'}
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function Portfolio() {
  const { address, isConnected } = useAccount();
  const [tokenIds, setTokenIds] = useState<string[]>([]);

  // Fetch total invoices to know how many exist
  const { data: totalInvoices } = useReadContract({
    address: CONTRACTS.invoiceNFT as `0x${string}`,
    abi: InvoiceNFTABI,
    functionName: 'totalInvoices',
  });

  // For each potential token, check if user owns it
  // In production, use a subgraph or indexer. For demo, check first 10 tokens
  useEffect(() => {
    const fetchUserTokens = async () => {
      if (!address || !totalInvoices) return;

      const maxToCheck = Math.min(Number(totalInvoices), 20);
      const userTokens: string[] = [];

      // We'd ideally use multicall here, but for simplicity check sequentially
      for (let i = 1; i <= maxToCheck; i++) {
        try {
          const response = await fetch(`/api/check-owner?tokenId=${i}&address=${address}`);
          if (response.ok) {
            const { isOwner } = await response.json();
            if (isOwner) userTokens.push(String(i));
          }
        } catch {
          // Token might not exist or other error, skip
        }
      }

      setTokenIds(userTokens);
    };

    // For demo, just show tokens 1-3 if any exist
    if (totalInvoices && Number(totalInvoices) > 0) {
      const demoTokens = [];
      for (let i = 1; i <= Math.min(Number(totalInvoices), 3); i++) {
        demoTokens.push(String(i));
      }
      setTokenIds(demoTokens);
    } else {
      setTokenIds([]);
    }
  }, [address, totalInvoices]);

  if (!isConnected) {
    return (
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 text-center">
        <p className="text-gray-400">Connect your wallet to view your portfolio</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <span>💼</span> Your Invoices
        </h2>
        {totalInvoices !== undefined && (
          <span className="text-sm text-gray-400">
            {Number(totalInvoices)} total minted
          </span>
        )}
      </div>

      <div className="grid gap-4">
        {tokenIds.length > 0 ? (
          tokenIds.map((tokenId) => (
            <InvoiceCard key={tokenId} tokenId={tokenId} />
          ))
        ) : (
          <div className="text-center py-8 text-gray-400">
            <span className="text-4xl mb-2 block">📄</span>
            <p>No invoices yet.</p>
            <p className="text-sm">Tokenize your first invoice to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
}
