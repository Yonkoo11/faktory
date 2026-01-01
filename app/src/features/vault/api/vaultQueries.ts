import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usePublicClient, useWalletClient, useChainId } from 'wagmi';
import { getContractAddresses } from '@/lib/wagmi';
import { YieldVaultABI } from '@/lib/abi';
import { parseUnits } from 'viem';
import type { Address, Hash } from 'viem';
import { queryKeys } from '@/lib/query/keys';

// Types
interface DepositParams {
  tokenId: bigint;
  strategy: number;
  principal: bigint;
}

interface Deposit {
  tokenId: bigint;
  owner: Address;
  strategy: number;
  depositTime: bigint;
  principal: bigint;
  accruedYield: bigint;
  lastYieldUpdate: bigint;
  active: boolean;
}

// Read Queries

export function useVaultTVL() {
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const contracts = getContractAddresses(chainId);

  return useQuery({
    queryKey: queryKeys.vault.tvl(),
    queryFn: async () => {
      if (!publicClient) throw new Error('Public client not available');

      const result = await publicClient.readContract({
        address: contracts.yieldVault,
        abi: YieldVaultABI,
        functionName: 'totalValueLocked',
      });

      return result as bigint;
    },
    enabled: !!publicClient,
    staleTime: 30_000, // 30 seconds
  });
}

export function useVaultDeposit(tokenId?: bigint) {
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const contracts = getContractAddresses(chainId);

  return useQuery({
    queryKey: queryKeys.vault.deposit(tokenId?.toString() || '0'),
    queryFn: async () => {
      if (!publicClient || !tokenId) throw new Error('Missing required params');

      const result = await publicClient.readContract({
        address: contracts.yieldVault,
        abi: YieldVaultABI,
        functionName: 'getDeposit',
        args: [tokenId],
      });

      return result as Deposit;
    },
    enabled: !!publicClient && tokenId !== undefined,
    staleTime: 10_000, // 10 seconds
  });
}

export function useAccruedYield(tokenId?: bigint) {
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const contracts = getContractAddresses(chainId);

  return useQuery({
    queryKey: queryKeys.vault.yield(tokenId?.toString() || '0'),
    queryFn: async () => {
      if (!publicClient || !tokenId) throw new Error('Missing required params');

      const result = await publicClient.readContract({
        address: contracts.yieldVault,
        abi: YieldVaultABI,
        functionName: 'getAccruedYield',
        args: [tokenId],
      });

      return result as bigint;
    },
    enabled: !!publicClient && tokenId !== undefined,
    staleTime: 5_000, // 5 seconds - more frequent for yield updates
    refetchInterval: 10_000, // Auto-refetch every 10 seconds
  });
}

export function useActiveDepositsCount() {
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const contracts = getContractAddresses(chainId);

  return useQuery({
    queryKey: queryKeys.vault.activeCount(),
    queryFn: async () => {
      if (!publicClient) throw new Error('Public client not available');

      const result = await publicClient.readContract({
        address: contracts.yieldVault,
        abi: YieldVaultABI,
        functionName: 'getActiveDepositsCount',
      });

      return result as bigint;
    },
    enabled: !!publicClient,
    staleTime: 30_000,
  });
}

export function useConservativeAPY() {
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const contracts = getContractAddresses(chainId);

  return useQuery({
    queryKey: queryKeys.vault.apy('conservative'),
    queryFn: async () => {
      if (!publicClient) throw new Error('Public client not available');

      const result = await publicClient.readContract({
        address: contracts.yieldVault,
        abi: YieldVaultABI,
        functionName: 'CONSERVATIVE_APY',
      });

      return Number(result) / 100; // Convert basis points to percentage
    },
    enabled: !!publicClient,
    staleTime: 5 * 60 * 1000, // 5 minutes - APY changes slowly
  });
}

export function useAggressiveAPY() {
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const contracts = getContractAddresses(chainId);

  return useQuery({
    queryKey: queryKeys.vault.apy('aggressive'),
    queryFn: async () => {
      if (!publicClient) throw new Error('Public client not available');

      const result = await publicClient.readContract({
        address: contracts.yieldVault,
        abi: YieldVaultABI,
        functionName: 'AGGRESSIVE_APY',
      });

      return Number(result) / 100; // Convert basis points to percentage
    },
    enabled: !!publicClient,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Write Mutations

export function useDepositMutation() {
  const chainId = useChainId();
  const queryClient = useQueryClient();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const contracts = getContractAddresses(chainId);

  return useMutation({
    mutationFn: async (params: DepositParams) => {
      if (!publicClient || !walletClient) {
        throw new Error('Clients not available');
      }

      // Simulate the transaction first
      const { request } = await publicClient.simulateContract({
        address: contracts.yieldVault,
        abi: YieldVaultABI,
        functionName: 'deposit',
        args: [params.tokenId, params.strategy, params.principal],
        account: walletClient.account,
      });

      // Execute the transaction
      const hash = await walletClient.writeContract(request);

      // Wait for confirmation
      await publicClient.waitForTransactionReceipt({ hash });

      return hash;
    },
    onSuccess: (hash, variables) => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.vault.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.vault.deposit(variables.tokenId.toString()) });
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all });
    },
  });
}

export function useWithdrawMutation() {
  const chainId = useChainId();
  const queryClient = useQueryClient();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const contracts = getContractAddresses(chainId);

  return useMutation({
    mutationFn: async (tokenId: bigint) => {
      if (!publicClient || !walletClient) {
        throw new Error('Clients not available');
      }

      const { request } = await publicClient.simulateContract({
        address: contracts.yieldVault,
        abi: YieldVaultABI,
        functionName: 'withdraw',
        args: [tokenId],
        account: walletClient.account,
      });

      const hash = await walletClient.writeContract(request);
      await publicClient.waitForTransactionReceipt({ hash });

      return hash;
    },
    onSuccess: (hash, tokenId) => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.vault.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.vault.deposit(tokenId.toString()) });
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all });
    },
  });
}

export function useChangeStrategyMutation() {
  const chainId = useChainId();
  const queryClient = useQueryClient();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const contracts = getContractAddresses(chainId);

  return useMutation({
    mutationFn: async ({ tokenId, strategy }: { tokenId: bigint; strategy: number }) => {
      if (!publicClient || !walletClient) {
        throw new Error('Clients not available');
      }

      const { request } = await publicClient.simulateContract({
        address: contracts.yieldVault,
        abi: YieldVaultABI,
        functionName: 'changeStrategy',
        args: [tokenId, strategy],
        account: walletClient.account,
      });

      const hash = await walletClient.writeContract(request);
      await publicClient.waitForTransactionReceipt({ hash });

      return hash;
    },
    onSuccess: (hash, variables) => {
      // Invalidate deposit and yield queries for this token
      queryClient.invalidateQueries({ queryKey: queryKeys.vault.deposit(variables.tokenId.toString()) });
      queryClient.invalidateQueries({ queryKey: queryKeys.vault.yield(variables.tokenId.toString()) });
    },
  });
}
