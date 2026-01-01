/**
 * Yield Vault Hook - TanStack Query Version
 *
 * Migrated from direct wagmi hooks to TanStack Query for:
 * - Better caching and automatic refetching
 * - Optimistic updates
 * - Centralized cache invalidation
 * - Reduced RPC calls
 */

import { formatUnits } from 'viem';
import {
  useVaultTVL,
  useActiveDepositsCount,
  useConservativeAPY,
  useAggressiveAPY,
  useVaultDeposit,
  useAccruedYield,
} from '@/features/vault/api/vaultQueries';

export function useYieldVault() {
  const { data: tvlRaw, isLoading: isLoadingTVL } = useVaultTVL();
  const { data: activeCountRaw, isLoading: isLoadingCount } = useActiveDepositsCount();
  const { data: conservativeAPY = 0, isLoading: isLoadingConservative } = useConservativeAPY();
  const { data: aggressiveAPY = 0, isLoading: isLoadingAggressive } = useAggressiveAPY();

  // Format values
  const tvl = tvlRaw ? formatUnits(tvlRaw, 18) : '0';
  const activeDepositsCount = activeCountRaw ? Number(activeCountRaw) : 0;

  // Calculate total yield (sum of all accrued yields)
  // Note: This is a simplified version. In production, you'd query all deposits
  const totalYield = '0'; // TODO: Implement aggregated yield calculation

  return {
    tvl,
    totalYield,
    activeDepositsCount,
    conservativeAPY,
    aggressiveAPY,
    isLoading: isLoadingTVL || isLoadingCount || isLoadingConservative || isLoadingAggressive,
  };
}

/**
 * Hook for a specific deposit's data
 */
export function useDeposit(tokenId?: bigint) {
  const { data: deposit, isLoading: isLoadingDeposit } = useVaultDeposit(tokenId);
  const { data: accruedYieldRaw, isLoading: isLoadingYield } = useAccruedYield(tokenId);

  return {
    deposit,
    accruedYield: accruedYieldRaw ? formatUnits(accruedYieldRaw, 18) : '0',
    isLoading: isLoadingDeposit || isLoadingYield,
  };
}
