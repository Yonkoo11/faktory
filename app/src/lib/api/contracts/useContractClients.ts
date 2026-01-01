/**
 * Contract Client Hooks
 *
 * Provides easy access to contract clients in React components.
 */

'use client'

import { useMemo } from 'react'
import { usePublicClient, useWalletClient, useChainId } from 'wagmi'
import { InvoiceNFTClient } from './InvoiceNFTClient'
import { YieldVaultClient } from './YieldVaultClient'
import { AgentRouterClient } from './AgentRouterClient'

/**
 * Hook to get InvoiceNFT contract client
 *
 * Example usage:
 * ```tsx
 * const invoiceClient = useInvoiceNFTClient()
 *
 * // Read operations (always available)
 * const totalSupply = await invoiceClient.getTotalSupply()
 *
 * // Write operations (requires connected wallet)
 * const { hash } = await invoiceClient.mint({ ... })
 * ```
 */
export function useInvoiceNFTClient() {
  const chainId = useChainId()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()

  return useMemo(() => {
    if (!publicClient) {
      throw new Error('Public client not available')
    }

    return new InvoiceNFTClient(chainId, publicClient, walletClient ?? undefined)
  }, [chainId, publicClient, walletClient])
}

/**
 * Hook to get YieldVault contract client
 *
 * Example usage:
 * ```tsx
 * const vaultClient = useYieldVaultClient()
 *
 * // Read operations
 * const tvl = await vaultClient.getTotalValueLocked()
 * const deposit = await vaultClient.getDeposit(tokenId)
 *
 * // Write operations (requires connected wallet)
 * const hash = await vaultClient.deposit({ tokenId, principal, strategy })
 * ```
 */
export function useYieldVaultClient() {
  const chainId = useChainId()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()

  return useMemo(() => {
    if (!publicClient) {
      throw new Error('Public client not available')
    }

    return new YieldVaultClient(chainId, publicClient, walletClient ?? undefined)
  }, [chainId, publicClient, walletClient])
}

/**
 * Hook to get AgentRouter contract client
 *
 * Example usage:
 * ```tsx
 * const agentClient = useAgentRouterClient()
 *
 * // Read operations
 * const config = await agentClient.getConfig()
 * const decision = await agentClient.getLatestDecision(tokenId)
 *
 * // Write operations (requires connected wallet)
 * const hash = await agentClient.executeDecision(tokenId)
 * ```
 */
export function useAgentRouterClient() {
  const chainId = useChainId()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()

  return useMemo(() => {
    if (!publicClient) {
      throw new Error('Public client not available')
    }

    return new AgentRouterClient(chainId, publicClient, walletClient ?? undefined)
  }, [chainId, publicClient, walletClient])
}

/**
 * Hook to get all contract clients at once
 *
 * Example usage:
 * ```tsx
 * const { invoiceClient, vaultClient, agentClient } = useContractClients()
 * ```
 */
export function useContractClients() {
  const invoiceClient = useInvoiceNFTClient()
  const vaultClient = useYieldVaultClient()
  const agentClient = useAgentRouterClient()

  return useMemo(
    () => ({
      invoiceClient,
      vaultClient,
      agentClient,
    }),
    [invoiceClient, vaultClient, agentClient]
  )
}
