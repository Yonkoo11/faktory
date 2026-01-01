'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount, useChainId, useReadContract } from 'wagmi';
import { getContractAddresses, areContractsDeployed } from '@/lib/wagmi';
import { InvoiceNFTABI } from '@/lib/abi';
import { Briefcase, RefreshCw } from 'lucide-react';
import { InvoiceCard } from '../InvoiceCard';
import { EmptyPortfolio } from '../EmptyPortfolio';

export function Portfolio() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const contracts = getContractAddresses(chainId);
  const contractsDeployed = areContractsDeployed(chainId);
  const [tokenIds, setTokenIds] = useState<string[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: totalInvoices, refetch: refetchTotal } = useReadContract({
    address: contracts.invoiceNFT,
    abi: InvoiceNFTABI,
    functionName: 'totalInvoices',
    query: { enabled: contractsDeployed },
  });

  const { data: activeInvoices, refetch: refetchActive } = useReadContract({
    address: contracts.invoiceNFT,
    abi: InvoiceNFTABI,
    functionName: 'getActiveInvoices',
    query: { enabled: contractsDeployed },
  }) as { data: bigint[] | undefined; refetch: () => void };

  useEffect(() => {
    if (activeInvoices && activeInvoices.length > 0) {
      setTokenIds(activeInvoices.map((id) => id.toString()));
    } else if (totalInvoices && Number(totalInvoices) > 0) {
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
              <span className="text-sm text-muted-foreground">{Number(totalInvoices)} minted</span>
            )}
          </div>
        </div>
        <button
          onClick={handleRefresh}
          className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
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
          <EmptyPortfolio />
        )}
      </div>
    </div>
  );
}
