// Blockchain integration for reading/writing to contracts

import { ethers } from 'ethers';
import { Invoice, Deposit, Strategy, InvoiceStatus } from './types.js';

// Contract ABIs (minimal interfaces)
const INVOICE_NFT_ABI = [
  'function totalInvoices() view returns (uint256)',
  'function getActiveInvoices() view returns (uint256[])',
  'function getInvoice(uint256 tokenId) view returns (tuple(bytes32 dataCommitment, bytes32 amountCommitment, uint256 dueDate, uint256 createdAt, address issuer, uint8 status, uint8 riskScore, uint8 paymentProbability))',
  'function getDaysUntilDue(uint256 tokenId) view returns (int256)',
  'function ownerOf(uint256 tokenId) view returns (address)',
];

const YIELD_VAULT_ABI = [
  'function getActiveDeposits() view returns (uint256[])',
  'function getDeposit(uint256 tokenId) view returns (tuple(uint256 tokenId, address owner, uint8 strategy, uint256 depositTime, uint256 principal, uint256 accruedYield, uint256 lastYieldUpdate, bool active))',
  'function getAccruedYield(uint256 tokenId) view returns (uint256)',
];

const AGENT_ROUTER_ABI = [
  'function recordDecision(uint256 tokenId, uint8 strategy, uint256 confidence, string reasoning) returns (uint256)',
  'function getLatestDecision(uint256 tokenId) view returns (tuple(uint256 tokenId, uint8 recommendedStrategy, string reasoning, uint256 confidence, uint256 timestamp, bool executed))',
  'function needsAnalysis(uint256 tokenId, uint256 maxAge) view returns (bool)',
  'function isAgentAuthorized(address agent) view returns (bool)',
  'event DecisionRecorded(uint256 indexed tokenId, uint8 strategy, uint256 confidence, string reasoning)',
  'event DecisionExecuted(uint256 indexed tokenId, uint8 strategy, address indexed executor)',
];

const MOCK_ORACLE_ABI = [
  'function getRiskScore(uint256 tokenId) view returns (uint8)',
  'function getPaymentProbability(uint256 tokenId) view returns (uint8)',
  'function simulateRiskAssessment(uint256 tokenId)',
];

export interface ContractAddresses {
  invoiceNFT: string;
  yieldVault: string;
  agentRouter: string;
  mockOracle: string;
}

export class BlockchainService {
  private provider: ethers.Provider;
  private signer: ethers.Signer | null = null;

  private invoiceNFT: ethers.Contract;
  private yieldVault: ethers.Contract;
  private agentRouter: ethers.Contract;
  private mockOracle: ethers.Contract;

  constructor(rpcUrl: string, addresses: ContractAddresses, privateKey?: string) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);

    if (privateKey) {
      this.signer = new ethers.Wallet(privateKey, this.provider);
    }

    const signerOrProvider = this.signer || this.provider;

    this.invoiceNFT = new ethers.Contract(addresses.invoiceNFT, INVOICE_NFT_ABI, signerOrProvider);
    this.yieldVault = new ethers.Contract(addresses.yieldVault, YIELD_VAULT_ABI, signerOrProvider);
    this.agentRouter = new ethers.Contract(addresses.agentRouter, AGENT_ROUTER_ABI, signerOrProvider);
    this.mockOracle = new ethers.Contract(addresses.mockOracle, MOCK_ORACLE_ABI, signerOrProvider);
  }

  async getActiveInvoices(): Promise<string[]> {
    try {
      const ids: bigint[] = await this.invoiceNFT.getActiveInvoices();
      return ids.map((id) => id.toString());
    } catch (error) {
      console.error('Error fetching active invoices:', error);
      return [];
    }
  }

  async getInvoice(tokenId: string): Promise<Invoice | null> {
    try {
      const invoice = await this.invoiceNFT.getInvoice(tokenId);

      return {
        tokenId,
        dataCommitment: invoice.dataCommitment,
        amountCommitment: invoice.amountCommitment,
        dueDate: Number(invoice.dueDate),
        createdAt: Number(invoice.createdAt),
        issuer: invoice.issuer,
        status: Number(invoice.status) as InvoiceStatus,
        riskScore: Number(invoice.riskScore),
        paymentProbability: Number(invoice.paymentProbability),
      };
    } catch (error) {
      console.error(`Error fetching invoice ${tokenId}:`, error);
      return null;
    }
  }

  async getDeposit(tokenId: string): Promise<Deposit | null> {
    try {
      const deposit = await this.yieldVault.getDeposit(tokenId);

      if (!deposit.active) return null;

      return {
        tokenId: deposit.tokenId.toString(),
        owner: deposit.owner,
        strategy: Number(deposit.strategy) as Strategy,
        depositTime: Number(deposit.depositTime),
        principal: deposit.principal,
        accruedYield: deposit.accruedYield,
        lastYieldUpdate: Number(deposit.lastYieldUpdate),
        active: deposit.active,
      };
    } catch (error) {
      console.error(`Error fetching deposit ${tokenId}:`, error);
      return null;
    }
  }

  async getActiveDeposits(): Promise<string[]> {
    try {
      const ids: bigint[] = await this.yieldVault.getActiveDeposits();
      return ids.map((id) => id.toString());
    } catch (error) {
      console.error('Error fetching active deposits:', error);
      return [];
    }
  }

  async getRiskData(tokenId: string): Promise<{ riskScore: number; paymentProbability: number }> {
    try {
      const [riskScore, paymentProbability] = await Promise.all([
        this.mockOracle.getRiskScore(tokenId),
        this.mockOracle.getPaymentProbability(tokenId),
      ]);

      return {
        riskScore: Number(riskScore),
        paymentProbability: Number(paymentProbability),
      };
    } catch (error) {
      console.error(`Error fetching risk data for ${tokenId}:`, error);
      return { riskScore: 50, paymentProbability: 50 };
    }
  }

  async simulateRiskAssessment(tokenId: string): Promise<boolean> {
    if (!this.signer) {
      console.warn('No signer available for risk simulation');
      return false;
    }

    try {
      const tx = await this.mockOracle.simulateRiskAssessment(tokenId);
      await tx.wait();
      return true;
    } catch (error) {
      console.error(`Error simulating risk for ${tokenId}:`, error);
      return false;
    }
  }

  async recordDecision(
    tokenId: string,
    strategy: Strategy,
    confidence: number,
    reasoning: string
  ): Promise<{ success: boolean; txHash?: string }> {
    if (!this.signer) {
      console.warn('No signer available for recording decision');
      return { success: false };
    }

    try {
      const tx = await this.agentRouter.recordDecision(tokenId, strategy, confidence, reasoning);
      const receipt = await tx.wait();
      return { success: true, txHash: receipt.hash };
    } catch (error) {
      console.error(`Error recording decision for ${tokenId}:`, error);
      return { success: false };
    }
  }

  async needsAnalysis(tokenId: string, maxAgeSeconds: number = 3600): Promise<boolean> {
    try {
      return await this.agentRouter.needsAnalysis(tokenId, maxAgeSeconds);
    } catch (error) {
      console.error(`Error checking analysis need for ${tokenId}:`, error);
      return true; // Default to needing analysis on error
    }
  }

  async isAgentAuthorized(address: string): Promise<boolean> {
    try {
      return await this.agentRouter.isAgentAuthorized(address);
    } catch (error) {
      console.error('Error checking agent authorization:', error);
      return false;
    }
  }

  getAgentAddress(): string | null {
    if (!this.signer) return null;
    return (this.signer as ethers.Wallet).address;
  }

  onDecisionRecorded(callback: (tokenId: string, strategy: Strategy, confidence: number) => void): void {
    this.agentRouter.on('DecisionRecorded', (tokenId, strategy, confidence) => {
      callback(tokenId.toString(), Number(strategy) as Strategy, Number(confidence));
    });
  }

  onDecisionExecuted(callback: (tokenId: string, strategy: Strategy) => void): void {
    this.agentRouter.on('DecisionExecuted', (tokenId, strategy) => {
      callback(tokenId.toString(), Number(strategy) as Strategy);
    });
  }
}
