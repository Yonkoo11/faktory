// LLM integration for generating natural language explanations

import Anthropic from '@anthropic-ai/sdk';
import { AnalysisResult, Strategy, AgentThought } from './types.js';
import { STRATEGY_NAMES } from './constants.js';

// Configuration
const LLM_CONFIG = {
  model: 'claude-3-5-haiku-20241022', // Latest fast model
  maxTokens: 300,
  timeoutMs: 30000, // 30 second timeout
  maxRetries: 2,
};

// Timeout wrapper for API calls
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, operationName: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`${operationName} timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    promise
      .then((result) => {
        clearTimeout(timeout);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timeout);
        reject(error);
      });
  });
}

export class LLMService {
  private client: Anthropic | null = null;
  private enabled: boolean = false;
  private callCount: number = 0;
  private lastCallTime: number = 0;
  private rateLimitWindowMs: number = 60000; // 1 minute
  private maxCallsPerWindow: number = 30;

  constructor(apiKey?: string) {
    if (apiKey) {
      this.client = new Anthropic({ apiKey });
      this.enabled = true;
      console.log(`LLM Service initialized with model: ${LLM_CONFIG.model}`);
    } else {
      console.warn('No Anthropic API key provided. Using template-based explanations.');
    }
  }

  private checkRateLimit(): boolean {
    const now = Date.now();
    if (now - this.lastCallTime > this.rateLimitWindowMs) {
      this.callCount = 0;
      this.lastCallTime = now;
    }
    return this.callCount < this.maxCallsPerWindow;
  }

  async generateExplanation(analysis: AnalysisResult): Promise<string> {
    if (!this.enabled || !this.client) {
      return this.generateTemplateExplanation(analysis);
    }

    // Check rate limit
    if (!this.checkRateLimit()) {
      console.warn('LLM rate limit reached, using template');
      return this.generateTemplateExplanation(analysis);
    }

    try {
      const prompt = this.buildPrompt(analysis);

      const apiCall = this.client.messages.create({
        model: LLM_CONFIG.model,
        max_tokens: LLM_CONFIG.maxTokens,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        system: `You are an AI financial advisor agent analyzing tokenized invoices for yield optimization.
Your role is to explain investment decisions in clear, concise language that a small business owner can understand.
Keep explanations under 3 sentences. Be direct and actionable.
Never use jargon without explanation. Focus on the "why" behind recommendations.`,
      });

      const response = await withTimeout(apiCall, LLM_CONFIG.timeoutMs, 'LLM generateExplanation');
      this.callCount++;

      const textBlock = response.content.find((block) => block.type === 'text');
      return textBlock?.text || this.generateTemplateExplanation(analysis);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('LLM error, falling back to template:', errorMessage);
      return this.generateTemplateExplanation(analysis);
    }
  }

  private buildPrompt(analysis: AnalysisResult): string {
    return `Explain this invoice yield strategy decision to a business owner:

Invoice Details:
- Token ID: ${analysis.tokenId}
- Days until payment due: ${analysis.daysUntilDue}
- Risk Score: ${analysis.riskScore}/100 (higher = safer)
- Payment Probability: ${analysis.paymentProbability}%
- Current Strategy: ${STRATEGY_NAMES[analysis.currentStrategy]}
- Recommended Strategy: ${STRATEGY_NAMES[analysis.recommendedStrategy]}
- Confidence: ${analysis.confidence}%
- Should Change: ${analysis.shouldAct ? 'Yes' : 'No'}

Strategy Definitions:
- Hold: Keep invoice without yield optimization (0% APY)
- Conservative: Low-risk lending pools (3-4% APY)
- Aggressive: Higher-yield opportunities (6-8% APY)

Explain why we're ${analysis.shouldAct ? 'changing to' : 'keeping'} the ${STRATEGY_NAMES[analysis.recommendedStrategy]} strategy in 2-3 sentences.`;
  }

  private generateTemplateExplanation(analysis: AnalysisResult): string {
    const strategy = STRATEGY_NAMES[analysis.recommendedStrategy];
    const current = STRATEGY_NAMES[analysis.currentStrategy];

    if (!analysis.shouldAct) {
      if (analysis.currentStrategy === analysis.recommendedStrategy) {
        return `Maintaining ${current} strategy. Current conditions remain optimal for this approach ` +
          `with ${analysis.confidence}% confidence based on ${analysis.daysUntilDue} days until due ` +
          `and ${analysis.paymentProbability}% payment probability.`;
      }
      return `No strategy change recommended at this time. While ${strategy} might offer benefits, ` +
        `confidence level (${analysis.confidence}%) is below our threshold for strategy changes.`;
    }

    if (analysis.recommendedStrategy === Strategy.Aggressive) {
      return `Upgrading to Aggressive strategy for higher yields (6-8% APY). ` +
        `Strong fundamentals: ${analysis.riskScore}/100 risk score, ${analysis.paymentProbability}% payment probability, ` +
        `and ${analysis.daysUntilDue} days of yield accumulation time make this a confident move.`;
    } else if (analysis.recommendedStrategy === Strategy.Conservative) {
      return `Moving to Conservative strategy for balanced risk-reward (3-4% APY). ` +
        `Moderate conditions suggest stable yield generation while protecting capital. ` +
        `${analysis.confidence}% confidence in this recommendation.`;
    } else {
      return `Switching to Hold strategy to protect capital. ` +
        `Current risk metrics (${analysis.riskScore}/100 risk, ${analysis.paymentProbability}% payment probability) ` +
        `suggest caution until conditions improve.`;
    }
  }

  async generateThinkingStream(analysis: AnalysisResult): Promise<AgentThought[]> {
    const thoughts: AgentThought[] = [];
    const now = Date.now();

    // Step 1: Acknowledging the invoice
    thoughts.push({
      type: 'thinking',
      tokenId: analysis.tokenId,
      message: `Analyzing Invoice #${analysis.tokenId.slice(0, 8)}...`,
      timestamp: now,
      data: { step: 1, total: 4 },
    });

    // Step 2: Risk assessment
    thoughts.push({
      type: 'analysis',
      tokenId: analysis.tokenId,
      message: `Risk Assessment: Score ${analysis.riskScore}/100, Payment Probability ${analysis.paymentProbability}%`,
      timestamp: now + 500,
      data: {
        riskScore: analysis.riskScore,
        paymentProbability: analysis.paymentProbability,
        daysUntilDue: analysis.daysUntilDue,
      },
    });

    // Step 3: Strategy evaluation
    const strategyName = STRATEGY_NAMES[analysis.recommendedStrategy];
    thoughts.push({
      type: 'analysis',
      tokenId: analysis.tokenId,
      message: `Evaluating strategies... ${strategyName} appears optimal with ${analysis.confidence}% confidence`,
      timestamp: now + 1000,
      data: {
        currentStrategy: STRATEGY_NAMES[analysis.currentStrategy],
        recommendedStrategy: strategyName,
        confidence: analysis.confidence,
      },
    });

    // Step 4: Decision
    thoughts.push({
      type: 'decision',
      tokenId: analysis.tokenId,
      message: await this.generateExplanation(analysis),
      timestamp: now + 1500,
      data: {
        shouldAct: analysis.shouldAct,
        strategy: analysis.recommendedStrategy,
        reasoning: analysis.reasoning,
      },
    });

    return thoughts;
  }
}
