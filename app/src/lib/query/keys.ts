/**
 * Query Key Factory
 *
 * Centralized, type-safe query keys for TanStack Query.
 * Hierarchical structure enables precise cache invalidation.
 *
 * Example usage:
 * - queryKeys.invoices.all - Matches ALL invoice queries
 * - queryKeys.invoices.lists() - Matches all invoice list queries
 * - queryKeys.invoices.list({ status: 'active' }) - Matches specific filtered list
 * - queryKeys.invoices.detail('123') - Matches invoice #123 query
 *
 * Cache invalidation examples:
 * - queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all }) // Invalidates ALL invoice data
 * - queryClient.invalidateQueries({ queryKey: queryKeys.invoices.lists() }) // Invalidates all lists only
 * - queryClient.invalidateQueries({ queryKey: queryKeys.invoices.detail('123') }) // Invalidates one invoice
 */

export const queryKeys = {
  /**
   * Invoice NFT queries
   */
  invoices: {
    all: ['invoices'] as const,
    lists: () => [...queryKeys.invoices.all, 'list'] as const,
    list: (filters?: { status?: string; owner?: string }) =>
      [...queryKeys.invoices.lists(), filters] as const,
    details: () => [...queryKeys.invoices.all, 'detail'] as const,
    detail: (tokenId: string | number) =>
      [...queryKeys.invoices.details(), tokenId] as const,
    balance: (address: string) =>
      [...queryKeys.invoices.all, 'balance', address] as const,
    totalSupply: () => [...queryKeys.invoices.all, 'totalSupply'] as const,
  },

  /**
   * Yield Vault queries
   */
  vault: {
    all: ['vault'] as const,
    tvl: () => [...queryKeys.vault.all, 'tvl'] as const,
    totalYield: () => [...queryKeys.vault.all, 'totalYield'] as const,
    deposits: () => [...queryKeys.vault.all, 'deposits'] as const,
    deposit: (tokenId: string | number) =>
      [...queryKeys.vault.deposits(), tokenId] as const,
    yield: (tokenId: string | number) =>
      [...queryKeys.vault.all, 'yield', tokenId] as const,
    activeCount: () => [...queryKeys.vault.all, 'activeCount'] as const,
    strategies: () => [...queryKeys.vault.all, 'strategies'] as const,
    apy: (strategy: string) => [...queryKeys.vault.all, 'apy', strategy] as const,
  },

  /**
   * Agent Router queries
   */
  agent: {
    all: ['agent'] as const,
    config: () => [...queryKeys.agent.all, 'config'] as const,
    decisions: () => [...queryKeys.agent.all, 'decisions'] as const,
    decision: (tokenId: string | number) =>
      [...queryKeys.agent.decisions(), tokenId] as const,
    status: () => [...queryKeys.agent.all, 'status'] as const,
  },

  /**
   * Portfolio aggregation queries
   */
  portfolio: {
    all: ['portfolio'] as const,
    overview: (address: string) =>
      [...queryKeys.portfolio.all, 'overview', address] as const,
    stats: (address: string) =>
      [...queryKeys.portfolio.all, 'stats', address] as const,
    performance: (address: string, period: string) =>
      [...queryKeys.portfolio.all, 'performance', address, period] as const,
  },

  /**
   * Analytics queries
   */
  analytics: {
    all: ['analytics'] as const,
    yieldHistory: (address: string, period: string) =>
      [...queryKeys.analytics.all, 'yield', address, period] as const,
    riskDistribution: (address: string) =>
      [...queryKeys.analytics.all, 'risk', address] as const,
    allocation: (address: string) =>
      [...queryKeys.analytics.all, 'allocation', address] as const,
  },
} as const

/**
 * Helper type to infer query key type
 * Usage: type InvoiceListKey = QueryKey<typeof queryKeys.invoices.list>
 */
export type QueryKey<T extends (...args: any[]) => readonly any[]> = ReturnType<T>
