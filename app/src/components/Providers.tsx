'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { WagmiProvider } from 'wagmi';
import { config } from '@/lib/wagmi';
import { queryClient } from '@/lib/query/client';
import { ErrorBoundary } from '@/components/error-boundary';
import { NetworkCheck } from '@/components/network-check';
import { ConfigValidation } from '@/components/config-validation';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <ConfigValidation />
          <NetworkCheck>
            {children}
          </NetworkCheck>

          {/* React Query DevTools - only visible in development */}
          {process.env.NODE_ENV === 'development' && (
            <ReactQueryDevtools
              initialIsOpen={false}
              buttonPosition="bottom-left"
            />
          )}
        </QueryClientProvider>
      </WagmiProvider>
    </ErrorBoundary>
  );
}
