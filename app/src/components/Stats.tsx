'use client';

import { useReadContract, useChainId } from 'wagmi';
import { formatEther } from 'viem';
import { getContractAddresses, areContractsDeployed } from '@/lib/wagmi';
import { YieldVaultABI, InvoiceNFTABI, AgentRouterABI } from '@/lib/abi';
import { FileText, Lock, Coins, Bot, Link2, AlertTriangle } from 'lucide-react';
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

  // Determine if we're on a Mantle network
  const isMantle = chainId === 5000 || chainId === 5003;
  const networkName = chainId === 5000 ? 'Mantle' : chainId === 5003 ? 'Mantle Sepolia' : 'Local';

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
      {/* Mantle Network Banner */}
      <div className="bg-gradient-to-r from-gray-900 via-blue-900/20 to-gray-900 rounded-xl border border-blue-800/50 p-4 hover:border-blue-700/60 transition-colors">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
              <Link2 className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">Powered by Mantle</span>
                <span className="text-xs px-2 py-0.5 bg-blue-600/30 border border-blue-600 rounded-full text-blue-300">
                  {networkName}
                </span>
              </div>
              <p className="text-xs text-gray-400">Sub-cent transactions enable real-time AI optimization</p>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div className="text-center">
              <div className="text-blue-400 font-semibold">~$0.002</div>
              <div className="text-xs text-gray-500">Per TX</div>
            </div>
            <div className="text-center">
              <div className="text-green-400 font-semibold">3-7%</div>
              <div className="text-xs text-gray-500">Yield APY</div>
            </div>
            <div className="text-center">
              <div className="text-purple-400 font-semibold">mETH</div>
              <div className="text-xs text-gray-500">Staking</div>
            </div>
          </div>
        </div>
      </div>

      {/* Contracts Not Deployed Banner */}
      {notDeployed && (
        <div className="bg-yellow-900/20 border border-yellow-800 rounded-xl p-3" role="alert">
          <div className="flex items-center gap-2 text-yellow-400 text-sm">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>Contracts not deployed on this network. Start Anvil locally or switch to Mantle Sepolia.</span>
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
