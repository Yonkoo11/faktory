// Blockchain integration for reading/writing to contracts

import { ethers } from 'ethers';
import { Invoice, Deposit, Strategy, InvoiceStatus, MarketConditions, MarketAlert, AlertLevel } from './types.js';

// Retry configuration
interface RetryConfig {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
};

// Helper for exponential backoff retry
async function withRetry<T>(
  operation: () => Promise<T>,
  operationName: string,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      const isRetryable = isRetryableError(error);

      if (attempt === config.maxAttempts || !isRetryable) {
        console.error(`${operationName} failed after ${attempt} attempts:`, error);
        throw error;
      }

      const delay = Math.min(
        config.baseDelayMs * Math.pow(2, attempt - 1),
        config.maxDelayMs
      );
      console.warn(`${operationName} attempt ${attempt} failed, retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }

  throw lastError;
}

function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    // Retry on network/RPC errors, not on contract reverts
    return (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('econnrefused') ||
      message.includes('enotfound') ||
      message.includes('rate limit') ||
      message.includes('503') ||
      message.includes('502') ||
      message.includes('504')
    );
  }
  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

// Pyth Oracle ABI (for production)
const PYTH_ORACLE_ABI = [
  'function getRiskScore(uint256 tokenId) view returns (uint8)',
  'function getPaymentProbability(uint256 tokenId) view returns (uint8)',
  'function getRiskAssessment(uint256 tokenId) view returns (uint8 riskScore, uint8 paymentProbability, uint256 lastUpdated, int64 collateralPrice)',
  'function assessRisk(uint256 tokenId, uint256 dueDate, uint256 invoiceValue, uint256 collateralValue, bytes[] calldata priceUpdateData) payable',
  'function getEthUsdPrice() view returns (int64)',
  'function getMntUsdPrice() view returns (int64)',
];

// Lendle Yield Source ABI (for production)
const LENDLE_YIELD_ABI = [
  'function getCurrentAPY(address asset) view returns (uint256)',
  'function getPosition(uint256 tokenId) view returns (address asset, uint256 principal, uint256 currentValue, uint256 depositTime)',
  'function deposit(uint256 tokenId, address asset, uint256 amount)',
  'function withdraw(uint256 tokenId, address to) returns (uint256 totalAmount, uint256 yieldAmount)',
];

export interface ContractAddresses {
  invoiceNFT: string;
  yieldVault: string;
  agentRouter: string;
  mockOracle: string;
  // Optional production addresses
  pythOracle?: string;
  lendleYieldSource?: string;
}

export class BlockchainService {
  private provider: ethers.Provider;
  private signer: ethers.Signer | null = null;

  private invoiceNFT: ethers.Contract;
  private yieldVault: ethers.Contract;
  private agentRouter: ethers.Contract;
  private mockOracle: ethers.Contract;
  private pythOracle: ethers.Contract | null = null;
  private lendleYieldSource: ethers.Contract | null = null;

  // Real APY cache (fetched from Lendle)
  private cachedAPY: { [strategy: number]: number } = {};
  private apyCacheTime = 0;
  private APY_CACHE_DURATION = 60000; // 1 minute

  // Market monitoring
  private priceHistory: { timestamp: number; ethPrice: number; mntPrice: number }[] = [];
  private lastMarketConditions: MarketConditions | null = null;
  private PRICE_HISTORY_DURATION = 4 * 60 * 60 * 1000; // 4 hours

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

    // Initialize production contracts if addresses provided
    if (addresses.pythOracle) {
      this.pythOracle = new ethers.Contract(addresses.pythOracle, PYTH_ORACLE_ABI, signerOrProvider);
      console.log('Using Pyth Oracle for real price data');
    }
    if (addresses.lendleYieldSource) {
      this.lendleYieldSource = new ethers.Contract(addresses.lendleYieldSource, LENDLE_YIELD_ABI, signerOrProvider);
      console.log('Using Lendle for real yield data');
    }
  }

  /// Check if using production oracles
  isUsingRealOracle(): boolean {
    return this.pythOracle !== null;
  }

  isUsingRealYield(): boolean {
    return this.lendleYieldSource !== null;
  }

  async getActiveInvoices(): Promise<{ ids: string[]; error?: string }> {
    try {
      const ids: bigint[] = await this.invoiceNFT.getActiveInvoices();
      return { ids: ids.map((id) => id.toString()) };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error fetching active invoices:', errorMsg);
      // Return error info so callers can distinguish between "no invoices" and "call failed"
      return { ids: [], error: errorMsg };
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

  async getActiveDeposits(): Promise<{ ids: string[]; error?: string }> {
    try {
      const ids: bigint[] = await this.yieldVault.getActiveDeposits();
      return { ids: ids.map((id) => id.toString()) };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error fetching active deposits:', errorMsg);
      // Return error info so callers can distinguish between "no deposits" and "call failed"
      return { ids: [], error: errorMsg };
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
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    if (!this.signer) {
      console.warn('No signer available for recording decision');
      return { success: false, error: 'No signer available' };
    }

    try {
      const result = await withRetry(
        async () => {
          const tx = await this.agentRouter.recordDecision(tokenId, strategy, confidence, reasoning);
          const receipt = await tx.wait();
          return { success: true, txHash: receipt.hash };
        },
        `recordDecision(${tokenId})`,
        { maxAttempts: 3, baseDelayMs: 2000, maxDelayMs: 15000 }
      );
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error recording decision for ${tokenId}:`, errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  async needsAnalysis(tokenId: string, maxAgeSeconds: number = 3600): Promise<boolean> {
    try {
      return await this.agentRouter.needsAnalysis(tokenId, maxAgeSeconds);
    } catch (error) {
      console.error(`Error checking analysis need for ${tokenId}:`, error);
      // Return false on error to avoid triggering unnecessary analysis when we can't verify
      // This prevents infinite retry loops when contract is unavailable
      return false;
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

  /// Get real APY for a strategy (from Lendle if available, otherwise hardcoded)
  async getRealAPY(strategy: Strategy): Promise<number> {
    // Return cached if fresh
    if (Date.now() - this.apyCacheTime < this.APY_CACHE_DURATION && this.cachedAPY[strategy] !== undefined) {
      return this.cachedAPY[strategy];
    }

    // Hardcoded fallback APYs (basis points, 100 = 1%)
    const fallbackAPY: { [key: number]: number } = {
      0: 0,    // Hold: 0%
      1: 350,  // Conservative: 3.5%
      2: 700,  // Aggressive: 7%
    };

    if (!this.lendleYieldSource) {
      return fallbackAPY[strategy] || 0;
    }

    try {
      // Fetch real APY from Lendle for USDC/USDT (common stablecoins)
      // In production, this would use actual asset addresses
      const USDC_ADDRESS = '0x09Bc4E0D864854c6aFB6eB9A9cdF58aC190D0dF9'; // USDC on Mantle
      const apy = await this.lendleYieldSource.getCurrentAPY(USDC_ADDRESS);

      // Scale based on strategy (Conservative = base APY, Aggressive = 2x)
      const baseAPY = Number(apy);

      if (strategy === 0) {
        this.cachedAPY[0] = 0;
      } else if (strategy === 1) {
        this.cachedAPY[1] = baseAPY;
      } else {
        this.cachedAPY[2] = Math.floor(baseAPY * 2); // Aggressive gets 2x (with more risk)
      }

      this.apyCacheTime = Date.now();
      console.log(`Real APY fetched from Lendle: ${baseAPY} basis points`);

      return this.cachedAPY[strategy] || fallbackAPY[strategy];
    } catch (error) {
      console.error('Error fetching real APY, using fallback:', error);
      return fallbackAPY[strategy] || 0;
    }
  }

  /// Get real price from Pyth Oracle
  async getRealPrice(feed: 'ETH' | 'MNT'): Promise<number | null> {
    if (!this.pythOracle) {
      return null;
    }

    try {
      const price = feed === 'ETH'
        ? await this.pythOracle.getEthUsdPrice()
        : await this.pythOracle.getMntUsdPrice();

      // Price has 8 decimals
      return Number(price) / 1e8;
    } catch (error) {
      console.error(`Error fetching ${feed} price:`, error);
      return null;
    }
  }

  /// Get data source info for transparency
  getDataSourceInfo(): { oracle: string; yield: string } {
    return {
      oracle: this.pythOracle ? 'Pyth Network (Real-time)' : 'Mock Oracle (Simulated)',
      yield: this.lendleYieldSource ? 'Lendle Protocol (Real DeFi)' : 'Simulated Yield',
    };
  }

  /// Monitor market conditions and detect volatility
  async getMarketConditions(): Promise<MarketConditions> {
    const now = Date.now();

    // Get current prices
    const ethPrice = await this.getRealPrice('ETH');
    const mntPrice = await this.getRealPrice('MNT');

    // Store price in history
    if (ethPrice !== null) {
      this.priceHistory.push({
        timestamp: now,
        ethPrice: ethPrice,
        mntPrice: mntPrice || 0,
      });

      // Clean old entries
      this.priceHistory = this.priceHistory.filter(
        (p) => now - p.timestamp < this.PRICE_HISTORY_DURATION
      );
    }

    // Calculate price change
    const priceChange = this.calculatePriceChange();
    const volatilityLevel = this.calculateVolatilityLevel(priceChange);

    this.lastMarketConditions = {
      ethPrice,
      mntPrice,
      ethPriceChange24h: priceChange,
      volatilityLevel,
      lastUpdated: now,
    };

    return this.lastMarketConditions;
  }

  private calculatePriceChange(): number {
    if (this.priceHistory.length < 2) return 0;

    const recent = this.priceHistory[this.priceHistory.length - 1];
    const oldest = this.priceHistory[0];

    if (oldest.ethPrice === 0) return 0;

    return ((recent.ethPrice - oldest.ethPrice) / oldest.ethPrice) * 100;
  }

  private calculateVolatilityLevel(priceChange: number): 'low' | 'medium' | 'high' | 'extreme' {
    const absChange = Math.abs(priceChange);
    if (absChange < 2) return 'low';
    if (absChange < 5) return 'medium';
    if (absChange < 10) return 'high';
    return 'extreme';
  }

  /// Check for market alerts that should trigger strategy changes
  checkMarketAlert(conditions: MarketConditions): MarketAlert | null {
    const priceChange = conditions.ethPriceChange24h;
    const absChange = Math.abs(priceChange);

    if (absChange < 3) return null; // No significant movement

    if (priceChange <= -8) {
      return {
        level: 'critical',
        message: `CRITICAL: ETH crashed ${absChange.toFixed(1)}% in 4 hours`,
        priceChange,
        recommendation: 'Immediately move all positions to HOLD to protect capital',
      };
    }

    if (priceChange <= -5) {
      return {
        level: 'warning',
        message: `WARNING: ETH dropped ${absChange.toFixed(1)}% - market stress detected`,
        priceChange,
        recommendation: 'Move aggressive positions to Conservative to reduce exposure',
      };
    }

    if (priceChange <= -3) {
      return {
        level: 'info',
        message: `Market volatility: ETH down ${absChange.toFixed(1)}% - monitoring closely`,
        priceChange,
        recommendation: 'Consider reducing risk on high-value invoices',
      };
    }

    if (priceChange >= 5) {
      return {
        level: 'info',
        message: `Market rally: ETH up ${absChange.toFixed(1)}% - favorable conditions`,
        priceChange,
        recommendation: 'Conditions favorable for aggressive yield strategies',
      };
    }

    return null;
  }

  /// Get estimated transaction cost on Mantle
  async getEstimatedTxCost(): Promise<{ costWei: bigint; costUsd: string }> {
    try {
      const feeData = await this.provider.getFeeData();
      const gasPrice = feeData.gasPrice || 50000000n; // 0.05 gwei default for Mantle
      const estimatedGas = 150000n; // Typical gas for recordDecision

      const costWei = gasPrice * estimatedGas;

      // Convert to USD using MNT price or default
      const mntPrice = await this.getRealPrice('MNT');
      const costMnt = Number(costWei) / 1e18;
      const costUsd = mntPrice ? (costMnt * mntPrice).toFixed(4) : '0.002';

      return {
        costWei,
        costUsd: `$${costUsd}`,
      };
    } catch {
      return {
        costWei: 7500000000000n, // ~0.0000075 MNT
        costUsd: '$0.002',
      };
    }
  }

  /// Simulate market conditions for demo (when Pyth not available)
  simulateMarketDrop(percentage: number): void {
    const now = Date.now();
    const basePrice = 3500; // Simulated ETH base price

    // Clear history and add simulated drop
    this.priceHistory = [
      { timestamp: now - 4 * 60 * 60 * 1000, ethPrice: basePrice, mntPrice: 0.5 },
      { timestamp: now - 3 * 60 * 60 * 1000, ethPrice: basePrice * 0.98, mntPrice: 0.49 },
      { timestamp: now - 2 * 60 * 60 * 1000, ethPrice: basePrice * 0.95, mntPrice: 0.48 },
      { timestamp: now - 1 * 60 * 60 * 1000, ethPrice: basePrice * (1 - percentage / 200), mntPrice: 0.46 },
      { timestamp: now, ethPrice: basePrice * (1 - percentage / 100), mntPrice: 0.45 },
    ];

    console.log(`📉 Simulated ${percentage}% market drop for demo`);
  }

  getLastMarketConditions(): MarketConditions | null {
    return this.lastMarketConditions;
  }
}
