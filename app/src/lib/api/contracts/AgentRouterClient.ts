/**
 * AgentRouterClient - Contract interaction abstraction
 *
 * Centralizes all AgentRouter contract calls for AI agent decisions.
 */

import type { PublicClient, WalletClient, Address, Hash } from 'viem'
import { AgentRouterABI } from '@/lib/contracts/abis'
import { getAgentRouterAddress } from '@/lib/contracts/addresses'
import { parseContractError } from '../errors'
import { Strategy } from './YieldVaultClient'

/**
 * Agent configuration
 */
export interface AgentConfig {
  minConfidence: bigint
  enabled: boolean
}

/**
 * Agent decision data
 */
export interface AgentDecision {
  tokenId: bigint
  recommendedStrategy: Strategy
  confidence: bigint
  reason: string
  timestamp: bigint
}

/**
 * AgentRouter Contract Client
 *
 * Provides clean abstraction over AgentRouter contract interactions.
 *
 * Example usage:
 * ```tsx
 * const client = new AgentRouterClient(chainId, publicClient, walletClient)
 *
 * // Read operations
 * const config = await client.getConfig()
 * const decision = await client.getLatestDecision(tokenId)
 *
 * // Write operations
 * const hash = await client.executeDecision(tokenId)
 * ```
 */
export class AgentRouterClient {
  private address: Address
  private publicClient: PublicClient
  private walletClient?: WalletClient

  constructor(
    chainId: number,
    publicClient: PublicClient,
    walletClient?: WalletClient
  ) {
    this.address = getAgentRouterAddress(chainId)
    this.publicClient = publicClient
    this.walletClient = walletClient
  }

  // ==================== Read Methods ====================

  /**
   * Get agent configuration
   */
  async getConfig(): Promise<AgentConfig> {
    try {
      const result = await this.publicClient.readContract({
        address: this.address,
        abi: AgentRouterABI,
        functionName: 'config',
      })

      const config = result as unknown as [bigint, boolean]

      return {
        minConfidence: config[0],
        enabled: config[1],
      }
    } catch (error) {
      throw parseContractError(error)
    }
  }

  /**
   * Get total number of decisions made by the agent
   */
  async getTotalDecisions(): Promise<bigint> {
    try {
      const result = await this.publicClient.readContract({
        address: this.address,
        abi: AgentRouterABI,
        functionName: 'totalDecisions',
      })
      return result as bigint
    } catch (error) {
      throw parseContractError(error)
    }
  }

  /**
   * Get latest decision for a specific token
   */
  async getLatestDecision(tokenId: bigint): Promise<AgentDecision | null> {
    try {
      const result = await this.publicClient.readContract({
        address: this.address,
        abi: AgentRouterABI,
        functionName: 'getDecision',
        args: [tokenId],
      })

      const decision = result as [bigint, number, bigint, string, bigint]

      // Check if decision exists (timestamp > 0)
      if (decision[4] === 0n) {
        return null
      }

      return {
        tokenId: decision[0],
        recommendedStrategy: decision[1] as Strategy,
        confidence: decision[2],
        reason: decision[3],
        timestamp: decision[4],
      }
    } catch (error) {
      throw parseContractError(error)
    }
  }

  /**
   * Check if analysis is needed for a token
   * (based on time since last decision)
   */
  async needsAnalysis(tokenId: bigint): Promise<boolean> {
    try {
      const result = await this.publicClient.readContract({
        address: this.address,
        abi: AgentRouterABI,
        functionName: 'needsAnalysis',
        args: [tokenId],
      })
      return result as boolean
    } catch (error) {
      throw parseContractError(error)
    }
  }

  /**
   * Get all decision IDs
   */
  async getAllDecisionIds(): Promise<bigint[]> {
    try {
      const total = await this.getTotalDecisions()
      const ids: bigint[] = []

      for (let i = 0n; i < total; i++) {
        ids.push(i)
      }

      return ids
    } catch (error) {
      throw parseContractError(error)
    }
  }

  // ==================== Write Methods ====================

  /**
   * Execute agent's recommended strategy
   * Requires wallet connection
   */
  async executeDecision(tokenId: bigint): Promise<Hash> {
    if (!this.walletClient) {
      throw new Error('Wallet client required for write operations')
    }

    try {
      const { request } = await this.publicClient.simulateContract({
        address: this.address,
        abi: AgentRouterABI,
        functionName: 'executeDecision',
        args: [tokenId],
        account: this.walletClient.account,
      })

      const hash = await this.walletClient.writeContract(request)
      return hash
    } catch (error) {
      throw parseContractError(error)
    }
  }

  /**
   * Update agent configuration
   * Requires wallet connection and ownership
   */
  async updateConfig(minConfidence: bigint, enabled: boolean): Promise<Hash> {
    if (!this.walletClient) {
      throw new Error('Wallet client required for write operations')
    }

    try {
      const { request } = await this.publicClient.simulateContract({
        address: this.address,
        abi: AgentRouterABI,
        functionName: 'updateConfig',
        args: [minConfidence, enabled],
        account: this.walletClient.account,
      })

      const hash = await this.walletClient.writeContract(request)
      return hash
    } catch (error) {
      throw parseContractError(error)
    }
  }

  // ==================== Utility Methods ====================

  /**
   * Get contract address
   */
  getAddress(): Address {
    return this.address
  }

  /**
   * Format confidence score to percentage
   */
  static formatConfidence(confidence: bigint): number {
    return Number(confidence) / 100
  }

  /**
   * Check if confidence meets minimum threshold
   */
  static meetsConfidenceThreshold(
    confidence: bigint,
    minConfidence: bigint
  ): boolean {
    return confidence >= minConfidence
  }

  /**
   * Get confidence level category
   */
  static getConfidenceLevel(
    confidence: bigint
  ): 'low' | 'medium' | 'high' | 'very-high' {
    const pct = Number(confidence) / 100

    if (pct >= 90) return 'very-high'
    if (pct >= 75) return 'high'
    if (pct >= 60) return 'medium'
    return 'low'
  }

  /**
   * Format decision age (time since decision)
   */
  static getDecisionAge(timestamp: bigint): string {
    const now = Math.floor(Date.now() / 1000)
    const age = now - Number(timestamp)

    if (age < 60) return `${age}s ago`
    if (age < 3600) return `${Math.floor(age / 60)}m ago`
    if (age < 86400) return `${Math.floor(age / 3600)}h ago`
    return `${Math.floor(age / 86400)}d ago`
  }
}
