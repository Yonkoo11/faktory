/**
 * Analytics Hook
 *
 * Aggregates data from multiple sources for analytics dashboards
 */

import { useMemo } from 'react';
import { useAccount } from 'wagmi';
import { formatUnits } from 'viem';
import { useYieldVault } from '@/hooks/use-yield-vault-v2';
import { useActiveInvoices, useTotalInvoices, useInvoice } from '@/features/invoices';
import { useVaultDeposit, useAccruedYield } from '@/features/vault';

export interface PortfolioAllocationData {
  strategy: string;
  value: number;
  percentage: number;
  apy: number;
  color: string;
  [key: string]: any;
}

export interface RiskDistributionData {
  range: string;
  count: number;
  color: string;
}

export interface YieldDataPoint {
  date: string;
  timestamp: number;
  yield: number;
  cumulative: number;
}

export interface PerformanceMetrics {
  totalYield: string;
  averageAPY: number;
  totalDeposited: string;
  activeInvoices: number;
}

export function useAnalytics() {
  const { address } = useAccount();
  const { tvl, conservativeAPY, aggressiveAPY, activeDepositsCount, isLoading: isLoadingVault } = useYieldVault();
  const { data: activeInvoiceIds, isLoading: isLoadingActive } = useActiveInvoices();
  const { data: totalInvoices, isLoading: isLoadingTotal } = useTotalInvoices();

  // Portfolio Allocation Data
  const allocationData = useMemo((): PortfolioAllocationData[] => {
    // For now, return mock data structure
    // In production, this would aggregate actual deposit data
    const total = Number(tvl);

    return [
      {
        strategy: 'Hold',
        value: total * 0.2,
        percentage: 20,
        apy: 0,
        color: 'hsl(var(--chart-1))',
      },
      {
        strategy: 'Conservative',
        value: total * 0.5,
        percentage: 50,
        apy: conservativeAPY,
        color: 'hsl(var(--chart-2))',
      },
      {
        strategy: 'Aggressive',
        value: total * 0.3,
        percentage: 30,
        apy: aggressiveAPY,
        color: 'hsl(var(--chart-3))',
      },
    ].filter(item => item.value > 0);
  }, [tvl, conservativeAPY, aggressiveAPY]);

  // Risk Distribution Data
  const riskDistribution = useMemo((): RiskDistributionData[] => {
    // For now, return mock data
    // In production, this would analyze actual invoice risk scores
    return [
      { range: '0-20', count: 2, color: 'hsl(0 84.2% 60.2%)' }, // Red
      { range: '21-40', count: 5, color: 'hsl(25 95% 53%)' }, // Orange
      { range: '41-60', count: 8, color: 'hsl(48 96% 53%)' }, // Yellow
      { range: '61-80', count: 12, color: 'hsl(142.1 76.2% 36.3%)' }, // Green
      { range: '81-100', count: 18, color: 'hsl(142.1 70.6% 45.3%)' }, // Bright green
    ];
  }, []);

  // Yield History Data (simulated time series)
  const yieldHistory = useMemo((): YieldDataPoint[] => {
    const now = Date.now();
    const points: YieldDataPoint[] = [];
    let cumulative = 0;

    // Generate 30 days of simulated yield data
    for (let i = 30; i >= 0; i--) {
      const date = new Date(now - i * 24 * 60 * 60 * 1000);
      const dailyYield = Math.random() * 100 + 50; // 50-150 per day
      cumulative += dailyYield;

      points.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        timestamp: date.getTime(),
        yield: dailyYield,
        cumulative,
      });
    }

    return points;
  }, []);

  // Performance Metrics
  const performanceMetrics = useMemo((): PerformanceMetrics => {
    const avgAPY = (conservativeAPY + aggressiveAPY) / 2;

    return {
      totalYield: '0', // TODO: Aggregate from all deposits
      averageAPY: avgAPY,
      totalDeposited: tvl,
      activeInvoices: activeInvoiceIds?.length || 0,
    };
  }, [tvl, conservativeAPY, aggressiveAPY, activeInvoiceIds]);

  return {
    allocationData,
    riskDistribution,
    yieldHistory,
    performanceMetrics,
    isLoading: isLoadingVault || isLoadingActive || isLoadingTotal,
  };
}

export function useInvoiceAnalytics(tokenId?: bigint) {
  const { data: invoice } = useInvoice(tokenId);
  const { data: deposit } = useVaultDeposit(tokenId);
  const { data: accruedYield } = useAccruedYield(tokenId);

  return useMemo(() => {
    if (!invoice || !deposit) return null;

    const principal = formatUnits(deposit.principal || BigInt(0), 18);
    const yield_ = formatUnits(accruedYield || BigInt(0), 18);
    const daysActive = deposit.depositTime
      ? Math.floor((Date.now() / 1000 - Number(deposit.depositTime)) / 86400)
      : 0;

    return {
      invoice,
      deposit,
      principal,
      accruedYield: yield_,
      daysActive,
      dailyYield: daysActive > 0 ? Number(yield_) / daysActive : 0,
    };
  }, [invoice, deposit, accruedYield]);
}
