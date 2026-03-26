'use client';

import { useReadContract, useChainId } from 'wagmi';
import { formatEther } from 'viem';
import { getContractAddresses, areContractsDeployed, getChainMeta } from '@/lib/wagmi';
import { YieldVaultABI, InvoiceNFTABI, AgentRouterABI } from '@/lib/abi';
import { FileText, Lock, Coins, Bot, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

function StatSkeleton() {
  return (
    <div className="glass border-glass-border rounded-xl p-4" aria-busy="true">
      <div className="flex items-center gap-3 mb-3">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="h-8 w-20" />
    </div>
  );
}

export function Stats() {
  const chainId = useChainId();
  const contracts = getContractAddresses(chainId);
  const contractsDeployed = areContractsDeployed(chainId);

  const { data: totalInvoices, isLoading: isLoadingInvoices, error: invoicesError } = useReadContract({
    address: contracts.invoiceNFT,
    abi: InvoiceNFTABI,
    functionName: 'totalInvoices',
    query: { enabled: contractsDeployed },
  });

  const { data: tvl, isLoading: isLoadingTvl, error: tvlError } = useReadContract({
    address: contracts.yieldVault,
    abi: YieldVaultABI,
    functionName: 'totalValueLocked',
    query: { enabled: contractsDeployed },
  });

  const { data: totalYield, isLoading: isLoadingYield, error: yieldError } = useReadContract({
    address: contracts.yieldVault,
    abi: YieldVaultABI,
    functionName: 'totalYieldGenerated',
    query: { enabled: contractsDeployed },
  });

  const { data: totalDecisions, isLoading: isLoadingDecisions, error: decisionsError } = useReadContract({
    address: contracts.agentRouter,
    abi: AgentRouterABI,
    functionName: 'totalDecisions',
    query: { enabled: contractsDeployed },
  });

  const isLoading = isLoadingInvoices || isLoadingTvl || isLoadingYield || isLoadingDecisions;
  const hasError = invoicesError || tvlError || yieldError || decisionsError;
  const notDeployed = !contractsDeployed;

  const meta = getChainMeta(chainId);
  const networkName = meta?.name || (chainId === 31337 ? 'Local' : `Chain ${chainId}`);

  const stats = [
    {
      label: 'Total Invoices',
      value: totalInvoices ? totalInvoices.toString() : '0',
      icon: FileText,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Total Value Locked',
      value: tvl ? `$${Number(formatEther(tvl)).toLocaleString()}` : '$0',
      icon: Lock,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      label: 'Yield Generated',
      value: totalYield ? `$${Number(formatEther(totalYield)).toFixed(2)}` : '$0.00',
      icon: Coins,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      label: 'Agent Decisions',
      value: totalDecisions ? totalDecisions.toString() : '0',
      icon: Bot,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Contracts Not Deployed Banner */}
      {notDeployed && (
        <div className="bg-yellow-900/20 border border-yellow-800 rounded-xl p-3" role="alert">
          <div className="flex items-center gap-2 text-yellow-400 text-sm">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>Contracts not deployed on {networkName}. Deploy contracts or switch networks.</span>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {hasError && !notDeployed && (
        <div className="bg-red-900/20 border border-red-800 rounded-xl p-3" role="alert">
          <div className="flex items-center gap-2 text-red-400 text-sm">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>Unable to load some stats. Check your network connection.</span>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" aria-label="Protocol statistics">
        {isLoading ? (
          <>
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
          </>
        ) : (
          stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="glass border-glass-border rounded-xl p-4 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-5 h-5 ${stat.color}`} aria-hidden="true" />
                  </div>
                  <span className="text-sm text-muted-foreground">{stat.label}</span>
                </div>
                <div className="text-2xl font-bold">{stat.value}</div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
