/**
 * InvoiceNFTClient - Contract interaction abstraction
 *
 * Centralizes all InvoiceNFT contract calls with type-safe methods.
 */

import type { PublicClient, WalletClient, Address, Hash } from 'viem'
import { InvoiceNFTABI } from '@/lib/contracts/abis'
import { getInvoiceNFTAddress } from '@/lib/contracts/addresses'
import { parseContractError } from '../errors'

/**
 * Invoice status enum
 */
export enum InvoiceStatus {
  Active = 0,
  Deposited = 1,
  Paid = 2,
  Defaulted = 3,
}

/**
 * Mint invoice parameters
 */
export interface MintInvoiceParams {
  dataCommitment: `0x${string}`
  amountCommitment: `0x${string}`
  dueDate: bigint
}

/**
 * Invoice data from contract
 */
export interface Invoice {
  owner: Address
  dataCommitment: `0x${string}`
  amountCommitment: `0x${string}`
  dueDate: bigint
  status: InvoiceStatus
  riskScore: number
  paymentProbability: number
}

/**
 * InvoiceNFT Contract Client
 *
 * Provides clean abstraction over InvoiceNFT contract interactions.
 *
 * Example usage:
 * ```tsx
 * const client = new InvoiceNFTClient(chainId, publicClient, walletClient)
 *
 * // Read operations
 * const totalSupply = await client.getTotalSupply()
 * const invoice = await client.getInvoice(tokenId)
 *
 * // Write operations
 * const hash = await client.mint({ dataCommitment, amountCommitment, dueDate })
 * ```
 */
export class InvoiceNFTClient {
  private address: Address
  private publicClient: PublicClient
  private walletClient?: WalletClient

  constructor(
    chainId: number,
    publicClient: PublicClient,
    walletClient?: WalletClient
  ) {
    this.address = getInvoiceNFTAddress(chainId)
    this.publicClient = publicClient
    this.walletClient = walletClient
  }

  // ==================== Read Methods ====================

  /**
   * Get total number of invoices minted
   */
  async getTotalSupply(): Promise<bigint> {
    try {
      const result = await this.publicClient.readContract({
        address: this.address,
        abi: InvoiceNFTABI,
        functionName: 'totalInvoices',
      })
      return result as bigint
    } catch (error) {
      throw parseContractError(error)
    }
  }

  /**
   * Get number of invoices owned by an address
   */
  async getBalance(owner: Address): Promise<bigint> {
    try {
      const result = await this.publicClient.readContract({
        address: this.address,
        abi: InvoiceNFTABI,
        functionName: 'balanceOf',
        args: [owner],
      })
      return result as bigint
    } catch (error) {
      throw parseContractError(error)
    }
  }

  /**
   * Get invoice data for a specific token
   */
  async getInvoice(tokenId: bigint): Promise<Invoice | null> {
    try {
      const result = await this.publicClient.readContract({
        address: this.address,
        abi: InvoiceNFTABI,
        functionName: 'getInvoice',
        args: [tokenId],
      })

      const invoice = result as [Address, `0x${string}`, `0x${string}`, bigint, number, number, number]

      return {
        owner: invoice[0],
        dataCommitment: invoice[1],
        amountCommitment: invoice[2],
        dueDate: invoice[3],
        status: invoice[4] as InvoiceStatus,
        riskScore: invoice[5],
        paymentProbability: invoice[6],
      }
    } catch (error) {
      throw parseContractError(error)
    }
  }

  /**
   * Get owner of a specific token
   */
  async getOwner(tokenId: bigint): Promise<Address> {
    try {
      const result = await this.publicClient.readContract({
        address: this.address,
        abi: InvoiceNFTABI,
        functionName: 'ownerOf',
        args: [tokenId],
      })
      return result as Address
    } catch (error) {
      throw parseContractError(error)
    }
  }

  /**
   * Check if an invoice is active
   */
  async isActive(tokenId: bigint): Promise<boolean> {
    try {
      const result = await this.publicClient.readContract({
        address: this.address,
        abi: InvoiceNFTABI,
        functionName: 'isActive',
        args: [tokenId],
      })
      return result as boolean
    } catch (error) {
      throw parseContractError(error)
    }
  }

  /**
   * Get list of active invoice IDs
   */
  async getActiveInvoices(): Promise<bigint[]> {
    try {
      const result = await this.publicClient.readContract({
        address: this.address,
        abi: InvoiceNFTABI,
        functionName: 'getActiveInvoices',
      })
      return result as bigint[]
    } catch (error) {
      throw parseContractError(error)
    }
  }

  /**
   * Check if address is authorized to reveal invoice data
   */
  async isAuthorizedToReveal(tokenId: bigint, address: Address): Promise<boolean> {
    try {
      const result = await this.publicClient.readContract({
        address: this.address,
        abi: InvoiceNFTABI,
        functionName: 'isAuthorizedToReveal',
        args: [tokenId, address],
      })
      return result as boolean
    } catch (error) {
      throw parseContractError(error)
    }
  }

  // ==================== Write Methods ====================

  /**
   * Mint a new invoice NFT
   * Requires wallet connection
   */
  async mint(params: MintInvoiceParams): Promise<{ hash: Hash; tokenId?: bigint }> {
    if (!this.walletClient) {
      throw new Error('Wallet client required for write operations')
    }

    try {
      const { request } = await this.publicClient.simulateContract({
        address: this.address,
        abi: InvoiceNFTABI,
        functionName: 'mint',
        args: [params.dataCommitment, params.amountCommitment, params.dueDate],
        account: this.walletClient.account,
      })

      const hash = await this.walletClient.writeContract(request)

      // Wait for transaction receipt to extract tokenId from event logs
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash })

      // Extract tokenId from InvoiceMinted event
      // Event signature: InvoiceMinted(uint256 indexed tokenId, address indexed owner)
      const log = receipt.logs.find(
        (log) => log.address.toLowerCase() === this.address.toLowerCase()
      )

      let tokenId: bigint | undefined
      if (log && log.topics[1]) {
        tokenId = BigInt(log.topics[1])
      }

      return { hash, tokenId }
    } catch (error) {
      throw parseContractError(error)
    }
  }

  /**
   * Update invoice status
   * Requires wallet connection and ownership
   */
  async updateStatus(tokenId: bigint, newStatus: InvoiceStatus): Promise<Hash> {
    if (!this.walletClient) {
      throw new Error('Wallet client required for write operations')
    }

    try {
      const { request } = await this.publicClient.simulateContract({
        address: this.address,
        abi: InvoiceNFTABI,
        functionName: 'updateStatus',
        args: [tokenId, newStatus],
        account: this.walletClient.account,
      })

      const hash = await this.walletClient.writeContract(request)
      return hash
    } catch (error) {
      throw parseContractError(error)
    }
  }

  /**
   * Authorize an address to reveal invoice data
   * Requires wallet connection and ownership
   */
  async authorizeReveal(tokenId: bigint, authorized: Address): Promise<Hash> {
    if (!this.walletClient) {
      throw new Error('Wallet client required for write operations')
    }

    try {
      const { request } = await this.publicClient.simulateContract({
        address: this.address,
        abi: InvoiceNFTABI,
        functionName: 'authorizeReveal',
        args: [tokenId, authorized],
        account: this.walletClient.account,
      })

      const hash = await this.walletClient.writeContract(request)
      return hash
    } catch (error) {
      throw parseContractError(error)
    }
  }

  /**
   * Transfer invoice to another address
   * Requires wallet connection and ownership
   */
  async transfer(from: Address, to: Address, tokenId: bigint): Promise<Hash> {
    if (!this.walletClient) {
      throw new Error('Wallet client required for write operations')
    }

    try {
      const { request } = await this.publicClient.simulateContract({
        address: this.address,
        abi: InvoiceNFTABI,
        functionName: 'transferFrom',
        args: [from, to, tokenId],
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
   * Get status name
   */
  static getStatusName(status: InvoiceStatus): string {
    switch (status) {
      case InvoiceStatus.Active:
        return 'Active'
      case InvoiceStatus.Deposited:
        return 'Deposited'
      case InvoiceStatus.Paid:
        return 'Paid'
      case InvoiceStatus.Defaulted:
        return 'Defaulted'
      default:
        return 'Unknown'
    }
  }

  /**
   * Format risk score to percentage
   */
  static formatRiskScore(score: number): string {
    return `${score}%`
  }

  /**
   * Get risk level category
   */
  static getRiskLevel(score: number): 'low' | 'medium' | 'high' {
    if (score >= 80) return 'low'
    if (score >= 60) return 'medium'
    return 'high'
  }
}
