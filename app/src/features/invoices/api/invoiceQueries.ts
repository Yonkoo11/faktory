import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usePublicClient, useWalletClient, useChainId } from 'wagmi';
import { getContractAddresses } from '@/lib/wagmi';
import { InvoiceNFTABI } from '@/lib/abi';
import type { Address, Hash } from 'viem';
import { queryKeys } from '@/lib/query/keys';

// Types
interface Invoice {
  dataCommitment: Address;
  amountCommitment: Address;
  dueDate: bigint;
  createdAt: bigint;
  issuer: Address;
  status: number;
  riskScore: number;
  paymentProbability: number;
}

// Read Queries

export function useTotalInvoices() {
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const contracts = getContractAddresses(chainId);

  return useQuery({
    queryKey: queryKeys.invoices.totalSupply(),
    queryFn: async () => {
      if (!publicClient) throw new Error('Public client not available');

      const result = await publicClient.readContract({
        address: contracts.invoiceNFT,
        abi: InvoiceNFTABI,
        functionName: 'totalInvoices',
      });

      return result as bigint;
    },
    enabled: !!publicClient,
    staleTime: 30_000, // 30 seconds
  });
}

export function useInvoice(tokenId?: bigint) {
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const contracts = getContractAddresses(chainId);

  return useQuery({
    queryKey: queryKeys.invoices.detail(tokenId?.toString() || '0'),
    queryFn: async () => {
      if (!publicClient || tokenId === undefined) {
        throw new Error('Missing required params');
      }

      const result = await publicClient.readContract({
        address: contracts.invoiceNFT,
        abi: InvoiceNFTABI,
        functionName: 'getInvoice',
        args: [tokenId],
      });

      return result as Invoice;
    },
    enabled: !!publicClient && tokenId !== undefined,
    staleTime: 60_000, // 1 minute - invoice data changes rarely
  });
}

export function useActiveInvoices() {
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const contracts = getContractAddresses(chainId);

  return useQuery({
    queryKey: queryKeys.invoices.list({ status: 'active' }),
    queryFn: async () => {
      if (!publicClient) throw new Error('Public client not available');

      const result = await publicClient.readContract({
        address: contracts.invoiceNFT,
        abi: InvoiceNFTABI,
        functionName: 'getActiveInvoices',
      });

      return result as bigint[];
    },
    enabled: !!publicClient,
    staleTime: 30_000, // 30 seconds
  });
}

export function useUserInvoiceBalance(address?: Address) {
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const contracts = getContractAddresses(chainId);

  return useQuery({
    queryKey: queryKeys.invoices.balance(address || ''),
    queryFn: async () => {
      if (!publicClient || !address) throw new Error('Missing required params');

      const result = await publicClient.readContract({
        address: contracts.invoiceNFT,
        abi: InvoiceNFTABI,
        functionName: 'balanceOf',
        args: [address],
      });

      return result as bigint;
    },
    enabled: !!publicClient && !!address,
    staleTime: 30_000,
  });
}

// Write Mutations

export function useMintInvoiceMutation() {
  const chainId = useChainId();
  const queryClient = useQueryClient();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const contracts = getContractAddresses(chainId);

  return useMutation({
    mutationFn: async (params: {
      dataCommitment: Address;
      amountCommitment: Address;
      dueDate: bigint;
    }) => {
      if (!publicClient || !walletClient) {
        throw new Error('Clients not available');
      }

      const { request } = await publicClient.simulateContract({
        address: contracts.invoiceNFT,
        abi: InvoiceNFTABI,
        functionName: 'mint',
        args: [
          params.dataCommitment,
          params.amountCommitment,
          params.dueDate,
        ],
        account: walletClient.account,
      });

      const hash = await walletClient.writeContract(request);
      await publicClient.waitForTransactionReceipt({ hash });

      return hash;
    },
    onSuccess: () => {
      // Invalidate invoice list and total count
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.totalSupply() });
    },
  });
}

export function useApproveInvoiceMutation() {
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const contracts = getContractAddresses(chainId);

  return useMutation({
    mutationFn: async ({ tokenId, spender }: { tokenId: bigint; spender: Address }) => {
      if (!publicClient || !walletClient) {
        throw new Error('Clients not available');
      }

      const { request } = await publicClient.simulateContract({
        address: contracts.invoiceNFT,
        abi: InvoiceNFTABI,
        functionName: 'approve',
        args: [spender, tokenId],
        account: walletClient.account,
      });

      const hash = await walletClient.writeContract(request);
      await publicClient.waitForTransactionReceipt({ hash });

      return hash;
    },
  });
}
