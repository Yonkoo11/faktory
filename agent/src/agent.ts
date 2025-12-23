// Faktory Agent - Autonomous yield optimization agent

import { BlockchainService, ContractAddresses } from './blockchain.js';
import { LLMService } from './llm.js';
import { AgentWebSocket } from './websocket.js';
import { analyzeInvoice } from './optimizer.js';
import { AgentConfig, AgentThought, Strategy, AnalysisResult } from './types.js';

const STRATEGY_NAMES = ['Hold', 'Conservative', 'Aggressive'];

export class FaktoryAgent {
  private blockchain: BlockchainService;
  private llm: LLMService;
  private ws: AgentWebSocket;
  private config: AgentConfig;
  private isRunning = false;
  private analysisLoop: NodeJS.Timeout | null = null;

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

  private startAnalysisLoop(): void {
    // Run initial analysis
    this.runAnalysisCycle();

    // Set up recurring analysis
    this.analysisLoop = setInterval(() => {
      this.runAnalysisCycle();
    }, this.config.analysisInterval);
  }

  private async runAnalysisCycle(): Promise<void> {
    try {
      this.broadcastThought({
        type: 'thinking',
        tokenId: 'system',
        message: '🔍 Scanning for active invoices...',
        timestamp: Date.now(),
      });

      // Get active deposits (invoices currently in yield strategies)
      const activeDeposits = await this.blockchain.getActiveDeposits();

      if (activeDeposits.length === 0) {
        this.broadcastThought({
          type: 'thinking',
          tokenId: 'system',
          message: '📭 No active deposits found. Waiting for new invoices...',
          timestamp: Date.now(),
        });
        return;
      }

      this.broadcastThought({
        type: 'thinking',
        tokenId: 'system',
        message: `📊 Found ${activeDeposits.length} active deposit(s). Beginning analysis...`,
        timestamp: Date.now(),
      });

      // Analyze each deposit
      const analysisPromises = activeDeposits
        .slice(0, this.config.maxConcurrentAnalyses)
        .map((tokenId) => this.analyzeInvoice(tokenId));

      await Promise.allSettled(analysisPromises);

      this.broadcastThought({
        type: 'thinking',
        tokenId: 'system',
        message: `✅ Analysis cycle complete. Next scan in ${this.config.analysisInterval / 1000}s`,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Error in analysis cycle:', error);
      this.ws.broadcastError('system', `Analysis cycle error: ${error}`);
    }
  }

  async analyzeInvoice(tokenId: string): Promise<AnalysisResult | null> {
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

      // Broadcast thinking start
      this.broadcastThought({
        type: 'thinking',
        tokenId,
        message: `🔍 Analyzing Invoice #${tokenId.slice(0, 8)}...`,
        timestamp: Date.now(),
        data: { step: 1, total: 4 },
      });

      // Analyze using optimizer
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const analysis = analyzeInvoice(invoice, deposit || undefined, currentTimestamp);

      // Broadcast risk assessment
      await this.delay(500);
      this.broadcastThought({
        type: 'analysis',
        tokenId,
        message: `📈 Risk Score: ${analysis.riskScore}/100 | Payment Probability: ${analysis.paymentProbability}%`,
        timestamp: Date.now(),
        data: {
          riskScore: analysis.riskScore,
          paymentProbability: analysis.paymentProbability,
          daysUntilDue: analysis.daysUntilDue,
        },
      });

      // Broadcast strategy evaluation
      await this.delay(500);
      this.broadcastThought({
        type: 'analysis',
        tokenId,
        message: `🎯 Evaluating: ${STRATEGY_NAMES[analysis.currentStrategy]} → ${STRATEGY_NAMES[analysis.recommendedStrategy]} (${analysis.confidence}% confidence)`,
        timestamp: Date.now(),
        data: {
          currentStrategy: STRATEGY_NAMES[analysis.currentStrategy],
          recommendedStrategy: STRATEGY_NAMES[analysis.recommendedStrategy],
          confidence: analysis.confidence,
          shouldAct: analysis.shouldAct,
        },
      });

      // Generate LLM explanation
      await this.delay(500);
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
        await this.executeDecision(tokenId, analysis);
      }

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
}
