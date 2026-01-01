import { QueryClient } from '@tanstack/react-query'

/**
 * TanStack Query Client Configuration
 *
 * Optimized for blockchain/Web3 applications with:
 * - Moderate stale time (30s) to balance freshness vs RPC calls
 * - 5-minute garbage collection for better UX during same-session navigation
 * - Automatic retries with exponential backoff
 * - Window focus refetching for data synchronization
 * - Network reconnection refetching
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 30 seconds
      // This reduces unnecessary RPC calls while keeping data reasonably up-to-date
      staleTime: 30_000,

      // Cache data for 5 minutes after it becomes unused
      // Improves UX when navigating back to previous pages
      gcTime: 5 * 60 * 1000,

      // Retry failed requests up to 3 times
      retry: 3,

      // Exponential backoff with max 10 second delay
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),

      // Refetch on window focus to sync data when user returns to tab
      refetchOnWindowFocus: true,

      // Refetch when network reconnects
      refetchOnReconnect: true,

      // Don't refetch on mount if data is still fresh
      refetchOnMount: 'always',
    },
    mutations: {
      // Don't retry failed mutations (especially important for blockchain transactions)
      // User should explicitly retry failed transactions
      retry: false,
    },
  },
})
