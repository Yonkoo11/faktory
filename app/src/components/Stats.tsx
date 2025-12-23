'use client';

import { useReadContract } from 'wagmi';
import { formatEther } from 'viem';
import { CONTRACTS } from '@/lib/wagmi';
import { YieldVaultABI, InvoiceNFTABI, AgentRouterABI } from '@/lib/abi';

export function Stats() {
  const { data: totalInvoices } = useReadContract({
    address: CONTRACTS.invoiceNFT as `0x${string}`,
    abi: InvoiceNFTABI,
    functionName: 'totalInvoices',
  });

  const { data: tvl } = useReadContract({
    address: CONTRACTS.yieldVault as `0x${string}`,
    abi: YieldVaultABI,
    functionName: 'totalValueLocked',
  });

  const { data: totalYield } = useReadContract({
    address: CONTRACTS.yieldVault as `0x${string}`,
    abi: YieldVaultABI,
    functionName: 'totalYieldGenerated',
  });

  const { data: totalDecisions } = useReadContract({
    address: CONTRACTS.agentRouter as `0x${string}`,
    abi: AgentRouterABI,
    functionName: 'totalDecisions',
  });

  const stats = [
    {
      label: 'Total Invoices',
      value: totalInvoices ? totalInvoices.toString() : '0',
      icon: '📄',
    },
    {
      label: 'Total Value Locked',
      value: tvl ? `$${Number(formatEther(tvl)).toLocaleString()}` : '$0',
      icon: '🔒',
    },
    {
      label: 'Yield Generated',
      value: totalYield ? `$${Number(formatEther(totalYield)).toFixed(2)}` : '$0.00',
      icon: '💰',
    },
    {
      label: 'Agent Decisions',
      value: totalDecisions ? totalDecisions.toString() : '0',
      icon: '🤖',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-gray-900 rounded-xl border border-gray-800 p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">{stat.icon}</span>
            <span className="text-sm text-gray-400">{stat.label}</span>
          </div>
          <div className="text-2xl font-bold">{stat.value}</div>
        </div>
      ))}
    </div>
  );
}
