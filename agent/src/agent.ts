// Faktory Agent - Autonomous yield optimization agent

import { BlockchainService, ContractAddresses } from './blockchain.js';
import { LLMService } from './llm.js';
import { AgentWebSocket } from './websocket.js';
import { analyzeInvoice, applyMarketAdjustment, updateMarketRegime, applyRegimeAdjustment, getCurrentRegime, getRegimeStats } from './optimizer.js';
import { AgentConfig, AgentThought, Strategy, AnalysisResult, MarketConditions, MarketAlert } from './types.js';
import { STRATEGY_NAMES } from './constants.js';

export class FaktoryAgent {
  private blockchain: BlockchainService;
  private llm: LLMService;
  private ws: AgentWebSocket;
  private config: AgentConfig;
  private isRunning = false;
  private analysisLoop: NodeJS.Timeout | null = null;

  // Rate limiting: track last analysis time per invoice
  private lastAnalysisTime: Map<string, number> = new Map();
  private readonly ANALYSIS_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

  // Circuit breaker for analysis cycles
  private consecutiveFailures = 0;
  private readonly MAX_CONSECUTIVE_FAILURES = 3;
  private circuitBreakerOpen = false;
  private circuitBreakerResetTime = 0;
  private readonly CIRCUIT_BREAKER_TIMEOUT_MS = 60 * 1000; // 1 minute

  constructor(
    rpcUrl: string,
    addresses: ContractAddresses,
    options: {
      privateKey?: string;
      anthropicApiKey?: string;
      wsPort?: number;
      config?: Partial<AgentConfig>;
    } = {}
  ) {
    this.blockchain = new BlockchainService(rpcUrl, addresses, options.privateKey);
    this.llm = new LLMService(options.anthropicApiKey);
    this.ws = new AgentWebSocket(options.wsPort || 8080);

    this.config = {
      minConfidence: 70,
      analysisInterval: 30000, // 30 seconds
      maxConcurrentAnalyses: 5,
      autoExecute: true,
      ...options.config,
    };

    // Handle manual analysis requests from frontend
    this.ws.onAnalysisRequest = (tokenId) => {
      this.analyzeInvoice(tokenId);
    };

    // Handle demo scenario triggers from frontend
    this.ws.onDemoScenario = (scenario) => {
      this.triggerDemoScenario(scenario);
    };
  }

  async start(): Promise<void> {
    if (this.isRunning) return;

    console.log('🤖 Faktory Agent starting...');

    // Start WebSocket server
    this.ws.start();

    // Verify agent authorization
    const agentAddress = this.blockchain.getAgentAddress();
    if (agentAddress) {
      const authorized = await this.blockchain.isAgentAuthorized(agentAddress);
      if (!authorized) {
        console.warn(`⚠️  Agent ${agentAddress} is not authorized on AgentRouter`);
      } else {
        console.log(`✅ Agent ${agentAddress} is authorized`);
      }
    } else {
      console.warn('⚠️  No private key provided - agent will run in read-only mode');
    }

    this.isRunning = true;

    // Set up contract event listeners
    this.setupEventListeners();

    // Broadcast startup
    this.broadcastThought({
      type: 'thinking',
      tokenId: 'system',
      message: '🏭 Faktory Agent is now active and monitoring invoices...',
      timestamp: Date.now(),
    });

    // Start analysis loop
    this.startAnalysisLoop();

    console.log('🤖 Faktory Agent started successfully');
  }

  stop(): void {
    if (!this.isRunning) return;

    if (this.analysisLoop) {
      clearInterval(this.analysisLoop);
      this.analysisLoop = null;
    }

    this.ws.stop();
    this.isRunning = false;

    console.log('🤖 Faktory Agent stopped');
  }

  private setupEventListeners(): void {
    // Listen for on-chain decision events
    this.blockchain.onDecisionRecorded((tokenId, strategy, confidence) => {
      console.log(`📡 Event: DecisionRecorded for #${tokenId}`);
      this.broadcastThought({
        type: 'execution',
        tokenId,
        message: `📡 On-chain: Decision recorded - ${STRATEGY_NAMES[strategy]} (${confidence}% confidence)`,
        timestamp: Date.now(),
        data: { strategy: STRATEGY_NAMES[strategy], confidence },
      });
    });

    this.blockchain.onDecisionExecuted((tokenId, strategy) => {
      console.log(`📡 Event: DecisionExecuted for #${tokenId}`);
      this.broadcastThought({
        type: 'execution',
        tokenId,
        message: `📡 On-chain: Strategy changed to ${STRATEGY_NAMES[strategy]}`,
        timestamp: Date.now(),
        data: { strategy: STRATEGY_NAMES[strategy] },
      });
    });

    console.log('✅ Contract event listeners initialized');
  }

  private isRateLimited(tokenId: string): boolean {
    const lastTime = this.lastAnalysisTime.get(tokenId);
    if (!lastTime) return false;
    return Date.now() - lastTime < this.ANALYSIS_COOLDOWN_MS;
  }

  private recordAnalysisTime(tokenId: string): void {
    this.lastAnalysisTime.set(tokenId, Date.now());
  }

  private checkCircuitBreaker(): boolean {
    if (!this.circuitBreakerOpen) return false;

    // Check if we should reset the circuit breaker
    if (Date.now() > this.circuitBreakerResetTime) {
      this.circuitBreakerOpen = false;
      this.consecutiveFailures = 0;
      console.log('🔄 Circuit breaker reset');
      return false;
    }

    return true;
  }

  private tripCircuitBreaker(): void {
    this.circuitBreakerOpen = true;
    this.circuitBreakerResetTime = Date.now() + this.CIRCUIT_BREAKER_TIMEOUT_MS;
    console.warn(`⚠️ Circuit breaker tripped after ${this.consecutiveFailures} failures. Pausing for ${this.CIRCUIT_BREAKER_TIMEOUT_MS / 1000}s`);
  }

  private startAnalysisLoop(): void {
    // Run initial analysis
    this.runAnalysisCycle();

    // Set up recurring analysis
    this.analysisLoop = setInterval(() => {
      this.runAnalysisCycle();
    }, this.config.analysisInterval);
  }

  private currentMarketConditions: MarketConditions | null = null;
  private currentMarketAlert: MarketAlert | null = null;

  private async runAnalysisCycle(): Promise<void> {
    // Check circuit breaker
    if (this.checkCircuitBreaker()) {
      console.log('⏸️ Circuit breaker is open, skipping cycle');
      return;
    }

    try {
      // Step 1: Check market conditions FIRST (the killer demo moment)
      this.broadcastThought({
        type: 'thinking',
        tokenId: 'system',
        message: '📡 Checking market conditions via Pyth Oracle...',
        timestamp: Date.now(),
      });

      this.currentMarketConditions = await this.blockchain.getMarketConditions();
      this.currentMarketAlert = this.blockchain.checkMarketAlert(this.currentMarketConditions);

      // Update market regime detection
      const regime = updateMarketRegime(this.currentMarketConditions);

      // Broadcast market status with drama
      if (this.currentMarketAlert) {
        const alertEmoji = this.currentMarketAlert.level === 'critical' ? '🚨' :
                          this.currentMarketAlert.level === 'warning' ? '⚠️' : 'ℹ️';

        this.broadcastThought({
          type: this.currentMarketAlert.level === 'critical' ? 'error' : 'analysis',
          tokenId: 'market',
          message: `${alertEmoji} ${this.currentMarketAlert.message}`,
          timestamp: Date.now(),
          data: {
            priceChange: this.currentMarketConditions.ethPriceChange24h,
            volatility: this.currentMarketConditions.volatilityLevel,
            ethPrice: this.currentMarketConditions.ethPrice,
          },
        });

        await this.delay(800);

        this.broadcastThought({
          type: 'decision',
          tokenId: 'market',
          message: `🤖 ${this.currentMarketAlert.recommendation}`,
          timestamp: Date.now(),
        });

        await this.delay(500);
      } else {
        const priceInfo = this.currentMarketConditions.ethPrice
          ? `ETH: $${this.currentMarketConditions.ethPrice.toFixed(2)}`
          : 'Prices: Simulated mode';

        const regimeEmoji = regime === 'bull' ? '📈' : regime === 'bear' ? '📉' : regime === 'volatile' ? '🌊' : '⚖️';
        const regimeLabel = regime.charAt(0).toUpperCase() + regime.slice(1);

        this.broadcastThought({
          type: 'thinking',
          tokenId: 'system',
          message: `✅ Market ${regimeLabel} ${regimeEmoji} (${priceInfo}) - volatility: ${this.currentMarketConditions.volatilityLevel}`,
          timestamp: Date.now(),
          data: {
            regime,
            volatility: this.currentMarketConditions.volatilityLevel,
          },
        });
      }

      await this.delay(300);

      // Step 2: Scan for invoices
      this.broadcastThought({
        type: 'thinking',
        tokenId: 'system',
        message: '🔍 Scanning blockchain for invoices...',
        timestamp: Date.now(),
      });

      // Get ALL active invoices (not just those in yield strategies)
      const [activeInvoices, activeDeposits] = await Promise.all([
        this.blockchain.getActiveInvoices(),
        this.blockchain.getActiveDeposits(),
      ]);

      // Combine and deduplicate - prioritize all invoices
      const allTokenIds = [...new Set([...activeInvoices, ...activeDeposits])];

      if (allTokenIds.length === 0) {
        this.broadcastThought({
          type: 'thinking',
          tokenId: 'system',
          message: '📭 No invoices found. Waiting for new invoices to be minted...',
          timestamp: Date.now(),
        });
        return;
      }

      const depositCount = activeDeposits.length;
      const pendingCount = allTokenIds.length - depositCount;

      this.broadcastThought({
        type: 'thinking',
        tokenId: 'system',
        message: `📊 Found ${allTokenIds.length} invoice(s): ${depositCount} earning yield, ${pendingCount} pending. Analyzing...`,
        timestamp: Date.now(),
      });

      // Analyze each invoice (with market context)
      const analysisPromises = allTokenIds
        .slice(0, this.config.maxConcurrentAnalyses)
        .map((tokenId) => this.analyzeInvoice(tokenId));

      await Promise.allSettled(analysisPromises);

      // Get transaction cost for Mantle value prop
      const txCost = await this.blockchain.getEstimatedTxCost();

      this.broadcastThought({
        type: 'thinking',
        tokenId: 'system',
        message: `✅ Cycle complete. Next scan in ${this.config.analysisInterval / 1000}s | Tx cost on Mantle: ${txCost.costUsd}`,
        timestamp: Date.now(),
        data: { txCostUsd: txCost.costUsd },
      });
      // Reset failure count on success
      this.consecutiveFailures = 0;
    } catch (error) {
      console.error('Error in analysis cycle:', error);
      this.ws.broadcastError('system', `Analysis cycle error: ${error}`);

      // Track consecutive failures for circuit breaker
      this.consecutiveFailures++;
      if (this.consecutiveFailures >= this.MAX_CONSECUTIVE_FAILURES) {
        this.tripCircuitBreaker();
        this.broadcastThought({
          type: 'error',
          tokenId: 'system',
          message: `⚠️ Too many failures (${this.consecutiveFailures}). Pausing analysis for 1 minute...`,
          timestamp: Date.now(),
        });
      }
    }
  }

  async analyzeInvoice(tokenId: string): Promise<AnalysisResult | null> {
    // Check rate limiting
    if (this.isRateLimited(tokenId)) {
      console.log(`⏳ Invoice #${tokenId} is rate-limited, skipping`);
      return null;
    }
    try {
      // Fetch invoice and deposit data
      const [invoice, deposit] = await Promise.all([
        this.blockchain.getInvoice(tokenId),
        this.blockchain.getDeposit(tokenId),
      ]);

      if (!invoice) {
        this.ws.broadcastError(tokenId, `Invoice #${tokenId} not found`);
        return null;
      }

      const isDeposited = deposit !== null;

      // Broadcast thinking start
      this.broadcastThought({
        type: 'thinking',
        tokenId,
        message: `🔍 Analyzing Invoice #${tokenId}${isDeposited ? ' (earning yield)' : ' (awaiting deposit)'}...`,
        timestamp: Date.now(),
        data: { step: 1, total: 4, isDeposited },
      });

      // Analyze using optimizer
      const currentTimestamp = Math.floor(Date.now() / 1000);
      let analysis = analyzeInvoice(invoice, deposit || undefined, currentTimestamp);

      // Apply market adjustments (THE KILLER DEMO FEATURE)
      const originalStrategy = analysis.recommendedStrategy;
      analysis = applyMarketAdjustment(analysis, this.currentMarketConditions, this.currentMarketAlert);

      // Apply regime-based adjustments
      const preRegimeStrategy = analysis.recommendedStrategy;
      analysis = applyRegimeAdjustment(analysis);
      const wasRegimeAdjusted = preRegimeStrategy !== analysis.recommendedStrategy;

      const wasAdjusted = originalStrategy !== analysis.recommendedStrategy;

      // Broadcast risk assessment
      await this.delay(400);
      this.broadcastThought({
        type: 'analysis',
        tokenId,
        message: `📈 Risk Score: ${analysis.riskScore}/100 | Payment Prob: ${analysis.paymentProbability}% | Days to due: ${analysis.daysUntilDue}`,
        timestamp: Date.now(),
        data: {
          riskScore: analysis.riskScore,
          paymentProbability: analysis.paymentProbability,
          daysUntilDue: analysis.daysUntilDue,
        },
      });

      // Broadcast strategy evaluation with market context
      await this.delay(400);

      if (wasAdjusted && this.currentMarketAlert) {
        // DRAMATIC: Show the market override happening
        this.broadcastThought({
          type: 'analysis',
          tokenId,
          message: `⚡ MARKET OVERRIDE: ${STRATEGY_NAMES[analysis.currentStrategy]} → ${STRATEGY_NAMES[analysis.recommendedStrategy]} (was ${STRATEGY_NAMES[originalStrategy]})`,
          timestamp: Date.now(),
          data: {
            currentStrategy: STRATEGY_NAMES[analysis.currentStrategy],
            recommendedStrategy: STRATEGY_NAMES[analysis.recommendedStrategy],
            originalRecommendation: STRATEGY_NAMES[originalStrategy],
            confidence: analysis.confidence,
            shouldAct: analysis.shouldAct,
            marketOverride: true,
          },
        });
      } else {
        this.broadcastThought({
          type: 'analysis',
          tokenId,
          message: `🎯 Strategy: ${STRATEGY_NAMES[analysis.currentStrategy]} → ${STRATEGY_NAMES[analysis.recommendedStrategy]} (${analysis.confidence}% confidence)`,
          timestamp: Date.now(),
          data: {
            currentStrategy: STRATEGY_NAMES[analysis.currentStrategy],
            recommendedStrategy: STRATEGY_NAMES[analysis.recommendedStrategy],
            confidence: analysis.confidence,
            shouldAct: analysis.shouldAct,
          },
        });
      }

      // Generate LLM explanation
      await this.delay(400);
      const explanation = await this.llm.generateExplanation(analysis);

      // Broadcast decision
      this.broadcastThought({
        type: 'decision',
        tokenId,
        message: explanation,
        timestamp: Date.now(),
        data: {
          shouldAct: analysis.shouldAct,
          strategy: analysis.recommendedStrategy,
        },
      });

      // Execute if conditions met
      if (analysis.shouldAct && this.config.autoExecute) {
        if (isDeposited) {
          await this.executeDecision(tokenId, analysis);
        } else {
          // Invoice not in YieldVault - provide guidance
          this.broadcastThought({
            type: 'thinking',
            tokenId,
            message: `💡 Invoice #${tokenId} not yet deposited. Deposit it to start earning with ${STRATEGY_NAMES[analysis.recommendedStrategy]} strategy.`,
            timestamp: Date.now(),
            data: { recommendedStrategy: STRATEGY_NAMES[analysis.recommendedStrategy], awaitingDeposit: true },
          });
        }
      }

      // Record analysis time for rate limiting
      this.recordAnalysisTime(tokenId);

      return analysis;
    } catch (error) {
      console.error(`Error analyzing invoice ${tokenId}:`, error);
      this.ws.broadcastError(tokenId, `Analysis failed: ${error}`);
      return null;
    }
  }

  private async executeDecision(tokenId: string, analysis: AnalysisResult): Promise<void> {
    this.broadcastThought({
      type: 'execution',
      tokenId,
      message: `⚡ Executing: Change to ${STRATEGY_NAMES[analysis.recommendedStrategy]} strategy...`,
      timestamp: Date.now(),
    });

    const result = await this.blockchain.recordDecision(
      tokenId,
      analysis.recommendedStrategy,
      analysis.confidence,
      analysis.reasoning
    );

    if (result.success) {
      this.ws.broadcastExecution(tokenId, true, result.txHash);
      this.broadcastThought({
        type: 'execution',
        tokenId,
        message: `✅ Strategy updated to ${STRATEGY_NAMES[analysis.recommendedStrategy]}`,
        timestamp: Date.now(),
        data: { txHash: result.txHash },
      });
    } else {
      this.ws.broadcastExecution(tokenId, false);
      this.broadcastThought({
        type: 'error',
        tokenId,
        message: '❌ Strategy update failed - will retry next cycle',
        timestamp: Date.now(),
      });
    }
  }

  private broadcastThought(thought: AgentThought): void {
    this.ws.broadcastThought(thought);

    // Also log to console with emoji
    const prefix = {
      thinking: '💭',
      analysis: '📊',
      decision: '🎯',
      execution: '⚡',
      error: '❌',
    }[thought.type];

    console.log(`${prefix} [${thought.tokenId}] ${thought.message}`);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Public API for manual triggers
  async triggerAnalysis(tokenId: string): Promise<AnalysisResult | null> {
    return this.analyzeInvoice(tokenId);
  }

  getStatus(): {
    running: boolean;
    connectedClients: number;
    config: AgentConfig;
  } {
    return {
      running: this.isRunning,
      connectedClients: this.ws.getConnectedClients(),
      config: this.config,
    };
  }

  // DEMO MODE: Simulate a market crash for presentations
  async triggerDemoScenario(scenario: 'market_crash' | 'market_rally' | 'reset'): Promise<void> {
    this.broadcastThought({
      type: 'thinking',
      tokenId: 'demo',
      message: `🎬 DEMO MODE: Triggering ${scenario} scenario...`,
      timestamp: Date.now(),
    });

    await this.delay(500);

    switch (scenario) {
      case 'market_crash':
        // Simulate 7% drop - triggers WARNING level
        this.blockchain.simulateMarketDrop(7);
        this.broadcastThought({
          type: 'error',
          tokenId: 'demo',
          message: '📉 Simulating market stress: ETH -7% in 4 hours...',
          timestamp: Date.now(),
        });
        break;

      case 'market_rally':
        // Simulate positive movement
        this.blockchain.simulateMarketDrop(-5); // negative drop = rally
        this.broadcastThought({
          type: 'analysis',
          tokenId: 'demo',
          message: '📈 Simulating market rally: ETH +5% in 4 hours...',
          timestamp: Date.now(),
        });
        break;

      case 'reset':
        // Reset to neutral
        this.blockchain.simulateMarketDrop(0);
        this.broadcastThought({
          type: 'thinking',
          tokenId: 'demo',
          message: '🔄 Market conditions reset to stable...',
          timestamp: Date.now(),
        });
        break;
    }

    await this.delay(1000);

    // Trigger immediate analysis cycle to show the effect
    this.broadcastThought({
      type: 'thinking',
      tokenId: 'demo',
      message: '⚡ Running immediate analysis to show agent response...',
      timestamp: Date.now(),
    });

    await this.runAnalysisCycle();
  }

  // Get blockchain service for external access (e.g., WebSocket commands)
  getBlockchainService(): BlockchainService {
    return this.blockchain;
  }
}
