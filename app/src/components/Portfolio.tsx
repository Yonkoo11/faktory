'use client';

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi';
import { formatEther } from 'viem';
import { getContractAddresses, areContractsDeployed } from '@/lib/wagmi';
import { InvoiceNFTABI, YieldVaultABI, StrategyNames, InvoiceStatusNames } from '@/lib/abi';
import { useState, useEffect, useCallback } from 'react';
import { FileText, Briefcase, RefreshCw, Lock, AlertTriangle, Check, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

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

function InvoiceCard({ tokenId, onRefresh }: { tokenId: string; onRefresh?: () => void }) {
  const chainId = useChainId();
  const contracts = getContractAddresses(chainId);

  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);
  const [principal, setPrincipal] = useState('10000');
  const [selectedStrategy, setSelectedStrategy] = useState(1); // Default: Conservative
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

  // Handle deposit after approval
  const handleDepositAfterApproval = useCallback(() => {
    if (isApproveSuccess && !depositTriggered) {
      setDepositTriggered(true);
      // Convert USD to simulated wei (1 USD = 1e18 wei for simulation)
      const principalWei = BigInt(principal) * BigInt(10 ** 18);
      depositToVault({
        address: contracts.yieldVault,
        abi: YieldVaultABI,
        functionName: 'deposit',
        args: [BigInt(tokenId), selectedStrategy, principalWei],
      });
    }
  }, [isApproveSuccess, depositTriggered, principal, selectedStrategy, tokenId, depositToVault, contracts.yieldVault]);

  useEffect(() => {
    handleDepositAfterApproval();
  }, [handleDepositAfterApproval]);

  // Reset and refresh on successful deposit
  useEffect(() => {
    if (isDepositSuccess) {
      setShowDeposit(false);
      setDepositTriggered(false);
      resetApprove();
      refetchDeposit();
      onRefresh?.();
    }
  }, [isDepositSuccess, resetApprove, refetchDeposit, onRefresh]);

  // Refresh on successful withdraw
  useEffect(() => {
    if (isWithdrawSuccess) {
      refetchDeposit();
      onRefresh?.();
    }
  }, [isWithdrawSuccess, refetchDeposit, onRefresh]);

  if (isLoadingInvoice) {
    return (
      <div className="glass border-glass-border rounded-xl p-4" aria-busy="true" aria-label="Loading invoice data">
        <div className="flex items-center gap-3 mb-4">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <div className="flex-1">
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      </div>
    );
  }

  if (invoiceError) {
    return (
      <div className="glass border-destructive/30 rounded-xl p-4" role="alert">
        <div className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm">Failed to load invoice #{tokenId}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">Please check your network connection and try again.</p>
      </div>
    );
  }

  if (!invoice) return null;

  const dueDate = new Date(Number(invoice.dueDate) * 1000);
  const daysUntilDue = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const isInYield = deposit?.active;
  const statusName = InvoiceStatusNames[invoice.status] || 'Unknown';

  const handleDeposit = () => {
    setDepositTriggered(false);
    approve({
      address: contracts.invoiceNFT,
      abi: InvoiceNFTABI,
      functionName: 'approve',
      args: [contracts.yieldVault, BigInt(tokenId)],
    });
  };

  const handleWithdraw = () => {
    withdraw({
      address: contracts.yieldVault,
      abi: YieldVaultABI,
      functionName: 'withdraw',
      args: [BigInt(tokenId)],
    });
  };

  return (
    <div className="glass border-glass-border rounded-xl p-4 hover:border-primary/30 transition-all duration-200 group">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
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
            {dueDate.toLocaleDateString()} ({daysUntilDue > 0 ? `${daysUntilDue}d left` : 'overdue'})
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
          <div className="border-t border-gray-700 my-2 pt-2 space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-400">Strategy</span>
              <span className="text-blue-400">{StrategyNames[deposit.strategy]} ({STRATEGY_INFO[deposit.strategy].apy} APY)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Principal</span>
              <span>${Number(formatEther(deposit.principal)).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Accrued Yield</span>
              <span className="text-green-400">
                +${accruedYield ? Number(formatEther(accruedYield)).toFixed(2) : '0.00'}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4">
        {!isInYield && invoice.status === 0 ? (
          <>
            {!showDeposit ? (
              <button
                onClick={() => setShowDeposit(true)}
                aria-label={`Start earning yield on invoice ${tokenId}`}
                className="w-full bg-blue-600 hover:bg-blue-500 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Start Earning Yield
              </button>
            ) : (
              <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); handleDeposit(); }} aria-label="Deposit to yield vault">
                <div>
                  <label htmlFor={`principal-${tokenId}`} className="block text-xs text-gray-400 mb-1">Principal Amount (USD)</label>
                  <input
                    id={`principal-${tokenId}`}
                    type="number"
                    value={principal}
                    onChange={(e) => setPrincipal(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    placeholder="10000"
                    min="100"
                    aria-describedby={`principal-help-${tokenId}`}
                  />
                  <span id={`principal-help-${tokenId}`} className="sr-only">Enter the amount in USD you want to deposit</span>
                </div>
                <fieldset>
                  <legend className="block text-xs text-gray-400 mb-1">Yield Strategy</legend>
                  <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Select yield strategy">
                    {STRATEGY_INFO.map((strategy, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedStrategy(idx)}
                        role="radio"
                        aria-checked={selectedStrategy === idx}
                        aria-label={`${strategy.name} strategy with ${strategy.apy} APY: ${strategy.description}`}
                        className={`p-2 rounded border text-xs transition-colors ${
                          selectedStrategy === idx
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500'
                        }`}
                      >
                        <div className="font-medium">{strategy.name}</div>
                        <div className="text-[10px] opacity-75">{strategy.apy}</div>
                      </button>
                    ))}
                  </div>
                </fieldset>
                {/* 2-Step Progress Indicator */}
                {(isApproving || isApproveConfirming || isDepositing || isDepositConfirming) && (
                  <div className="flex items-center gap-2 mb-2" aria-label="Deposit progress">
                    <div className={`flex items-center gap-1 ${isApproving || isApproveConfirming ? 'text-blue-400' : isDepositing || isDepositConfirming ? 'text-green-400' : 'text-gray-500'}`}>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${isApproving || isApproveConfirming ? 'bg-blue-600 animate-pulse' : 'bg-green-600'}`}>
                        {isDepositing || isDepositConfirming ? '✓' : '1'}
                      </div>
                      <span className="text-xs">Approve</span>
                    </div>
                    <div className={`flex-1 h-0.5 ${isDepositing || isDepositConfirming ? 'bg-green-600' : 'bg-gray-700'}`}></div>
                    <div className={`flex items-center gap-1 ${isDepositing || isDepositConfirming ? 'text-blue-400' : 'text-gray-500'}`}>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${isDepositing || isDepositConfirming ? 'bg-blue-600 animate-pulse' : 'bg-gray-700'}`}>
                        2
                      </div>
                      <span className="text-xs">Deposit</span>
                    </div>
                  </div>
                )}
                <button
                  type="submit"
                  disabled={isApproving || isDepositing || isApproveConfirming || isDepositConfirming || !principal}
                  aria-busy={isApproving || isDepositing || isApproveConfirming || isDepositConfirming}
                  className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:cursor-not-allowed py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  {isApproving || isApproveConfirming
                    ? 'Step 1: Approving NFT...'
                    : isDepositing || isDepositConfirming
                    ? 'Step 2: Depositing to Vault...'
                    : `Deposit $${Number(principal).toLocaleString()} → ${STRATEGY_INFO[selectedStrategy].name}`}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeposit(false)}
                  className="w-full text-gray-400 hover:text-gray-300 py-1 text-xs"
                >
                  Cancel
                </button>
              </form>
            )}
          </>
        ) : isInYield ? (
          <>
            {!showWithdrawConfirm ? (
              <button
                onClick={() => setShowWithdrawConfirm(true)}
                aria-label={`Open withdrawal confirmation for invoice ${tokenId}`}
                className="w-full bg-gray-700 hover:bg-gray-600 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Withdraw & Claim Yield
              </button>
            ) : (
              <div className="space-y-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700" role="dialog" aria-labelledby={`withdraw-title-${tokenId}`}>
                <div className="text-sm">
                  <h4 id={`withdraw-title-${tokenId}`} className="font-medium text-yellow-400 mb-1">Confirm Withdrawal</h4>
                  <p className="text-gray-400 text-xs">
                    You will receive your principal plus ${accruedYield ? Number(formatEther(accruedYield)).toFixed(2) : '0.00'} in accrued yield.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowWithdrawConfirm(false)}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 py-2 rounded text-xs font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => { handleWithdraw(); setShowWithdrawConfirm(false); }}
                    disabled={isWithdrawing || isWithdrawConfirming}
                    aria-busy={isWithdrawing || isWithdrawConfirming}
                    className="flex-1 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 py-2 rounded text-xs font-medium transition-colors"
                  >
                    {isWithdrawing || isWithdrawConfirming ? 'Withdrawing...' : 'Confirm Withdraw'}
                  </button>
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}

export function Portfolio() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const contracts = getContractAddresses(chainId);
  const contractsDeployed = areContractsDeployed(chainId);

  const [tokenIds, setTokenIds] = useState<string[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch total invoices
  const { data: totalInvoices, refetch: refetchTotal } = useReadContract({
    address: contracts.invoiceNFT,
    abi: InvoiceNFTABI,
    functionName: 'totalInvoices',
    query: { enabled: contractsDeployed },
  });

  // Fetch active invoices list
  const { data: activeInvoices, refetch: refetchActive } = useReadContract({
    address: contracts.invoiceNFT,
    abi: InvoiceNFTABI,
    functionName: 'getActiveInvoices',
    query: { enabled: contractsDeployed },
  }) as { data: bigint[] | undefined; refetch: () => void };

  // Update token IDs when data changes
  useEffect(() => {
    if (activeInvoices && activeInvoices.length > 0) {
      setTokenIds(activeInvoices.map((id) => id.toString()));
    } else if (totalInvoices && Number(totalInvoices) > 0) {
      // Fallback: show all tokens if getActiveInvoices returns empty
      const ids = [];
      for (let i = 1; i <= Math.min(Number(totalInvoices), 10); i++) {
        ids.push(String(i));
      }
      setTokenIds(ids);
    } else {
      setTokenIds([]);
    }
  }, [activeInvoices, totalInvoices, refreshKey]);

  const handleRefresh = useCallback(() => {
    refetchTotal();
    refetchActive();
    setRefreshKey((k) => k + 1);
  }, [refetchTotal, refetchActive]);

  if (!isConnected) {
    return (
      <div className="glass border-glass-border rounded-xl p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
          <Briefcase className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground">Connect your wallet to view your portfolio</p>
      </div>
    );
  }

  return (
    <div className="glass border-glass-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Your Invoices</h2>
            {totalInvoices !== undefined && (
              <span className="text-sm text-muted-foreground">
                {Number(totalInvoices)} minted
              </span>
            )}
          </div>
        </div>
        <button
          onClick={handleRefresh}
          className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          title="Refresh"
          aria-label="Refresh portfolio"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid gap-4">
        {tokenIds.length > 0 ? (
          tokenIds.map((tokenId) => (
            <InvoiceCard key={`${tokenId}-${refreshKey}`} tokenId={tokenId} onRefresh={handleRefresh} />
          ))
        ) : (
          <div className="text-center py-12">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-lg font-medium mb-1">No invoices yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Tokenize your first invoice to start earning yield!</p>
            <a
              href="/dashboard/mint"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-accent text-white font-medium hover:opacity-90 transition-opacity focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Mint Your First Invoice
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
