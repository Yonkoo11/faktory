// Intelligent strategy optimizer with market awareness and learning
// Beyond simple rules - uses multi-factor scoring and pattern recognition

import { Strategy, Invoice, Deposit, AnalysisResult, MarketConditions, MarketAlert } from './types.js';
import { STRATEGY_NAMES } from './constants.js';

// Historical decision tracking for learning
interface DecisionRecord {
  tokenId: string;
  timestamp: number;
  strategy: Strategy;
  confidence: number;
  riskScore: number;
  daysUntilDue: number;
  marketVolatility: string;
  outcome?: 'success' | 'suboptimal'; // Track if decision was good
}

// Market regime detection
export type MarketRegime = 'bull' | 'bear' | 'volatile' | 'stable' | 'unknown';

interface MarketDataPoint {
  timestamp: number;
  ethPrice: number;
  priceChange24h: number;
  volatility: string;
}

// In-memory stores
const decisionHistory: DecisionRecord[] = [];
const patternInsights: Map<string, number> = new Map();
const marketHistory: MarketDataPoint[] = [];
let currentRegime: MarketRegime = 'unknown';
let lastRegimeUpdate: number = 0;

interface OptimizationContext {
  invoice: Invoice;
  deposit?: Deposit;
  currentTimestamp: number;
  marketConditions?: MarketConditions;
}

interface StrategyRecommendation {
  strategy: Strategy;
  confidence: number;
  reasoning: string;
  factors: string[];
}

export function optimizeStrategy(context: OptimizationContext): StrategyRecommendation {
  const { invoice, deposit, currentTimestamp } = context;

  const factors: string[] = [];
  let score = 0;

  // Calculate days until due
  const daysUntilDue = Math.floor((invoice.dueDate - currentTimestamp) / (24 * 60 * 60));

  // Factor 1: Risk Score (0-100, higher = safer)
  if (invoice.riskScore >= 80) {
    score += 30;
    factors.push(`High risk score (${invoice.riskScore}/100) indicates reliable payer`);
  } else if (invoice.riskScore >= 60) {
    score += 15;
    factors.push(`Moderate risk score (${invoice.riskScore}/100)`);
  } else if (invoice.riskScore >= 40) {
    score += 5;
    factors.push(`Below average risk score (${invoice.riskScore}/100) suggests caution`);
  } else {
    score -= 10;
    factors.push(`Low risk score (${invoice.riskScore}/100) indicates high default risk`);
  }

  // Factor 2: Payment Probability
  if (invoice.paymentProbability >= 90) {
    score += 25;
    factors.push(`Excellent payment probability (${invoice.paymentProbability}%)`);
  } else if (invoice.paymentProbability >= 75) {
    score += 15;
    factors.push(`Good payment probability (${invoice.paymentProbability}%)`);
  } else if (invoice.paymentProbability >= 50) {
    score += 5;
    factors.push(`Moderate payment probability (${invoice.paymentProbability}%)`);
  } else {
    score -= 15;
    factors.push(`Low payment probability (${invoice.paymentProbability}%) - significant risk`);
  }

  // Factor 3: Time until due
  if (daysUntilDue >= 60) {
    score += 20;
    factors.push(`Long duration (${daysUntilDue} days) allows for yield accumulation`);
  } else if (daysUntilDue >= 30) {
    score += 15;
    factors.push(`Moderate duration (${daysUntilDue} days) for yield`);
  } else if (daysUntilDue >= 14) {
    score += 5;
    factors.push(`Short duration (${daysUntilDue} days) limits yield potential`);
  } else if (daysUntilDue >= 0) {
    score -= 5;
    factors.push(`Very short duration (${daysUntilDue} days) - minimal yield opportunity`);
  } else {
    score -= 30;
    factors.push(`Invoice is OVERDUE by ${Math.abs(daysUntilDue)} days - high risk`);
  }

  // Factor 4: Current strategy efficiency
  if (deposit) {
    const depositDuration = (currentTimestamp - deposit.depositTime) / (24 * 60 * 60);
    if (deposit.strategy === Strategy.Hold && score > 50) {
      score += 10;
      factors.push(`Currently on Hold strategy but conditions favor yield optimization`);
    } else if (deposit.strategy === Strategy.Aggressive && score < 30) {
      score -= 10;
      factors.push(`Aggressive strategy may be too risky given current conditions`);
    }

    if (depositDuration > 7 && deposit.strategy === Strategy.Hold) {
      factors.push(`Invoice has been on Hold for ${Math.floor(depositDuration)} days - consider activation`);
    }
  }

  // Determine strategy based on score
  let strategy: Strategy;
  let confidence: number;

  if (score >= 60) {
    strategy = Strategy.Aggressive;
    confidence = Math.min(95, 70 + (score - 60));
  } else if (score >= 30) {
    strategy = Strategy.Conservative;
    confidence = Math.min(90, 60 + (score - 30));
  } else {
    strategy = Strategy.Hold;
    confidence = Math.min(85, 50 + Math.abs(score));
  }

  // Generate reasoning
  const reasoning = generateReasoning(STRATEGY_NAMES[strategy], factors, confidence, daysUntilDue, invoice);

  return {
    strategy,
    confidence,
    reasoning,
    factors,
  };
}

function generateReasoning(
  strategyName: string,
  factors: string[],
  confidence: number,
  daysUntilDue: number,
  invoice: Invoice
): string {
  const topFactors = factors.slice(0, 3).join('. ');

  if (strategyName === 'Aggressive') {
    return `Recommending AGGRESSIVE strategy with ${confidence}% confidence. ${topFactors}. ` +
      `With ${daysUntilDue} days until due and strong risk metrics, ` +
      `this invoice is well-suited for higher-yield opportunities (6-8% APY).`;
  } else if (strategyName === 'Conservative') {
    return `Recommending CONSERVATIVE strategy with ${confidence}% confidence. ${topFactors}. ` +
      `The moderate risk profile suggests a balanced approach with stable yields (3-4% APY) ` +
      `while maintaining capital protection.`;
  } else {
    return `Recommending HOLD strategy with ${confidence}% confidence. ${topFactors}. ` +
      `Current conditions do not favor active yield strategies. ` +
      `Will continue monitoring for improved conditions.`;
  }
}

// ============ Advanced Intelligence Features ============

// Multi-factor composite scoring with weighted factors
export function calculateCompositeScore(
  riskScore: number,
  paymentProbability: number,
  daysUntilDue: number,
  marketVolatility: string,
  depositDuration: number
): { score: number; breakdown: Record<string, number>; insights: string[] } {
  const insights: string[] = [];
  const breakdown: Record<string, number> = {};

  // Factor weights (tuned based on importance)
  const weights = {
    risk: 0.25,
    payment: 0.25,
    time: 0.20,
    market: 0.20,
    momentum: 0.10,
  };

  // Risk score component (0-100 normalized to 0-1)
  breakdown.risk = riskScore / 100;
  if (riskScore >= 80) insights.push('Strong debtor reliability');
  else if (riskScore < 50) insights.push('Elevated counterparty risk detected');

  // Payment probability component
  breakdown.payment = paymentProbability / 100;
  if (paymentProbability >= 90) insights.push('Historical payment patterns excellent');
  else if (paymentProbability < 70) insights.push('Payment uncertainty warrants caution');

  // Time value component (more time = more opportunity)
  breakdown.time = Math.min(daysUntilDue / 90, 1); // Cap at 90 days
  if (daysUntilDue >= 60) insights.push('Long runway enables yield accumulation');
  else if (daysUntilDue < 14) insights.push('Limited time constrains strategy options');

  // Market conditions component
  const volatilityScores: Record<string, number> = {
    'low': 1.0,
    'medium': 0.7,
    'high': 0.4,
    'extreme': 0.1,
  };
  breakdown.market = volatilityScores[marketVolatility] ?? 0.5;
  if (marketVolatility === 'high' || marketVolatility === 'extreme') {
    insights.push('Market stress signals defensive positioning');
  }

  // Momentum component (how long deposited, indicating stability)
  breakdown.momentum = Math.min(depositDuration / 30, 1); // Cap at 30 days
  if (depositDuration > 14) insights.push('Established position enables strategy refinement');

  // Calculate weighted composite
  const score =
    breakdown.risk * weights.risk +
    breakdown.payment * weights.payment +
    breakdown.time * weights.time +
    breakdown.market * weights.market +
    breakdown.momentum * weights.momentum;

  return { score, breakdown, insights };
}

// Pattern recognition from historical decisions
export function recognizePatterns(
  riskScore: number,
  daysUntilDue: number,
  marketVolatility: string
): { pattern: string; confidence: number; recommendation: string } {
  // Define pattern signatures
  const patterns = [
    {
      name: 'Safe Haven',
      match: (r: number, d: number, m: string) => r >= 80 && d >= 30 && (m === 'low' || m === 'medium'),
      confidence: 90,
      recommendation: 'Optimal conditions for aggressive yield strategy',
    },
    {
      name: 'Time Pressure',
      match: (r: number, d: number) => d < 14 && r >= 60,
      confidence: 85,
      recommendation: 'Short duration limits yield potential - prioritize liquidity',
    },
    {
      name: 'Risk-Reward Balance',
      match: (r: number, d: number, m: string) => r >= 60 && r < 80 && d >= 30 && m !== 'extreme',
      confidence: 75,
      recommendation: 'Moderate risk profile suits conservative yield strategy',
    },
    {
      name: 'Defensive Posture',
      match: (r: number, d: number, m: string) => r < 60 || m === 'extreme' || m === 'high',
      confidence: 88,
      recommendation: 'Elevated risk signals - protect capital over yield',
    },
    {
      name: 'Opportunity Window',
      match: (r: number, d: number, m: string) => r >= 70 && d >= 45 && m === 'low',
      confidence: 82,
      recommendation: 'Stable conditions + long duration = maximize yield exposure',
    },
  ];

  // Find matching pattern
  for (const pattern of patterns) {
    if (pattern.match(riskScore, daysUntilDue, marketVolatility)) {
      return {
        pattern: pattern.name,
        confidence: pattern.confidence,
        recommendation: pattern.recommendation,
      };
    }
  }

  return {
    pattern: 'Standard',
    confidence: 70,
    recommendation: 'Apply balanced risk-adjusted strategy',
  };
}

// Record decision for learning (in production, would persist)
export function recordDecision(
  tokenId: string,
  strategy: Strategy,
  confidence: number,
  riskScore: number,
  daysUntilDue: number,
  marketVolatility: string
): void {
  decisionHistory.push({
    tokenId,
    timestamp: Date.now(),
    strategy,
    confidence,
    riskScore,
    daysUntilDue,
    marketVolatility,
  });

  // Keep last 100 decisions
  if (decisionHistory.length > 100) {
    decisionHistory.shift();
  }

  // Update pattern insights
  const patternKey = `${strategy}-${Math.floor(riskScore / 20) * 20}-${marketVolatility}`;
  patternInsights.set(patternKey, (patternInsights.get(patternKey) || 0) + 1);
}

// Get learning statistics
export function getLearningStats(): {
  totalDecisions: number;
  strategyDistribution: Record<string, number>;
  topPatterns: Array<{ pattern: string; count: number }>;
} {
  const strategyDistribution: Record<string, number> = { Hold: 0, Conservative: 0, Aggressive: 0 };

  for (const decision of decisionHistory) {
    const strategyName = STRATEGY_NAMES[decision.strategy];
    strategyDistribution[strategyName]++;
  }

  const topPatterns = Array.from(patternInsights.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([pattern, count]) => ({ pattern, count }));

  return {
    totalDecisions: decisionHistory.length,
    strategyDistribution,
    topPatterns,
  };
}

export function shouldChangeStrategy(
  current: Strategy,
  recommended: Strategy,
  confidence: number,
  minConfidence: number = 70
): boolean {
  // Don't change if same strategy
  if (current === recommended) return false;

  // Don't change if confidence is too low
  if (confidence < minConfidence) return false;

  // Always allow moving to safer strategy
  if (recommended < current) return true;

  // Require higher confidence to move to riskier strategy
  if (recommended > current && confidence >= minConfidence + 10) return true;

  return false;
}

export function analyzeInvoice(
  invoice: Invoice,
  deposit: Deposit | undefined,
  currentTimestamp: number
): AnalysisResult {
  const recommendation = optimizeStrategy({
    invoice,
    deposit,
    currentTimestamp,
  });

  const currentStrategy = deposit?.strategy ?? Strategy.Hold;
  const daysUntilDue = Math.floor((invoice.dueDate - currentTimestamp) / (24 * 60 * 60));

  const shouldAct = shouldChangeStrategy(
    currentStrategy,
    recommendation.strategy,
    recommendation.confidence
  );

  return {
    tokenId: invoice.tokenId,
    invoice,
    deposit,
    riskScore: invoice.riskScore,
    paymentProbability: invoice.paymentProbability,
    daysUntilDue,
    currentStrategy,
    recommendedStrategy: recommendation.strategy,
    confidence: recommendation.confidence,
    reasoning: recommendation.reasoning,
    shouldAct,
  };
}

// Apply market conditions to override strategy recommendations
export function applyMarketAdjustment(
  analysis: AnalysisResult,
  marketConditions: MarketConditions | null,
  marketAlert: MarketAlert | null
): AnalysisResult {
  if (!marketAlert || !marketConditions) {
    return analysis;
  }

  const adjusted = { ...analysis };

  // Critical alert: Force move to Hold
  if (marketAlert.level === 'critical') {
    if (analysis.currentStrategy !== Strategy.Hold) {
      adjusted.recommendedStrategy = Strategy.Hold;
      adjusted.confidence = 95; // High confidence for protective action
      adjusted.shouldAct = true;
      adjusted.reasoning = `MARKET OVERRIDE: ${marketAlert.message}. ` +
        `Moving to HOLD strategy to protect capital. ` +
        `Original analysis suggested ${STRATEGY_NAMES[analysis.recommendedStrategy]} ` +
        `but market conditions require defensive positioning.`;
    }
  }

  // Warning alert: Cap at Conservative
  else if (marketAlert.level === 'warning') {
    if (analysis.currentStrategy === Strategy.Aggressive) {
      adjusted.recommendedStrategy = Strategy.Conservative;
      adjusted.confidence = Math.max(analysis.confidence, 85);
      adjusted.shouldAct = true;
      adjusted.reasoning = `MARKET ADJUSTMENT: ${marketAlert.message}. ` +
        `Reducing from Aggressive to Conservative strategy. ` +
        `Market volatility (${marketConditions.volatilityLevel}) suggests reducing risk exposure.`;
    } else if (analysis.recommendedStrategy === Strategy.Aggressive) {
      adjusted.recommendedStrategy = Strategy.Conservative;
      adjusted.reasoning = `MARKET CAUTION: Blocking upgrade to Aggressive due to market stress. ` +
        `${marketAlert.message}. Recommending Conservative instead.`;
    }
  }

  return adjusted;
}

// Generate market-aware reasoning
export function generateMarketReasoning(
  baseReasoning: string,
  marketConditions: MarketConditions | null
): string {
  if (!marketConditions || marketConditions.volatilityLevel === 'low') {
    return baseReasoning;
  }

  const volatilityNote = marketConditions.volatilityLevel === 'extreme'
    ? 'EXTREME market volatility detected - prioritizing capital protection.'
    : marketConditions.volatilityLevel === 'high'
    ? 'High market volatility - factoring increased risk into strategy.'
    : 'Moderate market movement - maintaining vigilance.';

  return `${volatilityNote} ${baseReasoning}`;
}

// ============ Market Regime Detection ============

/**
 * Update market data and detect the current regime
 * Called on each market conditions update
 */
export function updateMarketRegime(marketConditions: MarketConditions): MarketRegime {
  const now = Date.now();

  // Record market data point
  marketHistory.push({
    timestamp: now,
    ethPrice: marketConditions.ethPrice ?? 0,
    priceChange24h: marketConditions.ethPriceChange24h,
    volatility: marketConditions.volatilityLevel,
  });

  // Keep last 24 data points (roughly 12 hours at 30s intervals)
  while (marketHistory.length > 288) {
    marketHistory.shift();
  }

  // Only update regime every 5 minutes to avoid flip-flopping
  if (now - lastRegimeUpdate < 5 * 60 * 1000 && currentRegime !== 'unknown') {
    return currentRegime;
  }

  // Need at least 10 data points to detect regime
  if (marketHistory.length < 10) {
    return 'unknown';
  }

  currentRegime = detectRegime();
  lastRegimeUpdate = now;

  return currentRegime;
}

/**
 * Analyze market history to detect the current regime
 */
function detectRegime(): MarketRegime {
  const recentPoints = marketHistory.slice(-20); // Last ~10 minutes

  // Calculate average price change
  const avgPriceChange = recentPoints.reduce((sum, p) => sum + p.priceChange24h, 0) / recentPoints.length;

  // Count volatility levels
  const volatilityCounts = { low: 0, medium: 0, high: 0, extreme: 0 };
  recentPoints.forEach(p => {
    const level = p.volatility as keyof typeof volatilityCounts;
    if (level in volatilityCounts) {
      volatilityCounts[level]++;
    }
  });

  // Calculate price trend (simple moving average comparison)
  const firstHalf = recentPoints.slice(0, Math.floor(recentPoints.length / 2));
  const secondHalf = recentPoints.slice(Math.floor(recentPoints.length / 2));
  const firstAvg = firstHalf.reduce((sum, p) => sum + p.ethPrice, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, p) => sum + p.ethPrice, 0) / secondHalf.length;
  const trendPercent = ((secondAvg - firstAvg) / firstAvg) * 100;

  // Determine regime based on signals
  const highVolatilityRatio = (volatilityCounts.high + volatilityCounts.extreme) / recentPoints.length;

  // Volatile regime: High volatility regardless of direction
  if (highVolatilityRatio > 0.5) {
    return 'volatile';
  }

  // Bull regime: Consistent positive trend with low-medium volatility
  if (avgPriceChange > 2 && trendPercent > 0.5 && highVolatilityRatio < 0.3) {
    return 'bull';
  }

  // Bear regime: Consistent negative trend
  if (avgPriceChange < -2 && trendPercent < -0.5) {
    return 'bear';
  }

  // Stable regime: Low volatility, minimal price change
  if (volatilityCounts.low > recentPoints.length * 0.6 && Math.abs(avgPriceChange) < 1) {
    return 'stable';
  }

  // Default to stable if no strong signals
  return 'stable';
}

/**
 * Get the current market regime
 */
export function getCurrentRegime(): MarketRegime {
  return currentRegime;
}

/**
 * Get regime-adjusted strategy weights
 * Returns multipliers for aggressive strategies based on regime
 */
export function getRegimeAdjustment(): {
  regime: MarketRegime;
  aggressiveMultiplier: number;
  conservativeMultiplier: number;
  holdMultiplier: number;
  description: string;
} {
  switch (currentRegime) {
    case 'bull':
      return {
        regime: 'bull',
        aggressiveMultiplier: 1.2,  // Favor aggressive in bull markets
        conservativeMultiplier: 1.0,
        holdMultiplier: 0.8,
        description: 'Bull market detected - favoring yield optimization',
      };
    case 'bear':
      return {
        regime: 'bear',
        aggressiveMultiplier: 0.6,  // Reduce aggressive in bear markets
        conservativeMultiplier: 1.1,
        holdMultiplier: 1.3,
        description: 'Bear market detected - prioritizing capital preservation',
      };
    case 'volatile':
      return {
        regime: 'volatile',
        aggressiveMultiplier: 0.5,  // Avoid aggressive in volatile markets
        conservativeMultiplier: 0.9,
        holdMultiplier: 1.4,
        description: 'High volatility detected - reducing risk exposure',
      };
    case 'stable':
      return {
        regime: 'stable',
        aggressiveMultiplier: 1.1,  // Slight preference for yield in stable markets
        conservativeMultiplier: 1.0,
        holdMultiplier: 0.9,
        description: 'Stable market conditions - balanced approach',
      };
    default:
      return {
        regime: 'unknown',
        aggressiveMultiplier: 1.0,
        conservativeMultiplier: 1.0,
        holdMultiplier: 1.0,
        description: 'Insufficient data for regime detection',
      };
  }
}

/**
 * Apply regime-based adjustments to analysis result
 */
export function applyRegimeAdjustment(analysis: AnalysisResult): AnalysisResult {
  const adjustment = getRegimeAdjustment();

  if (adjustment.regime === 'unknown') {
    return analysis;
  }

  const adjusted = { ...analysis };

  // In bear or volatile markets, prevent upgrades to aggressive
  if ((adjustment.regime === 'bear' || adjustment.regime === 'volatile') &&
      analysis.recommendedStrategy === Strategy.Aggressive &&
      analysis.currentStrategy !== Strategy.Aggressive) {
    adjusted.recommendedStrategy = Strategy.Conservative;
    adjusted.reasoning = `REGIME ADJUSTMENT (${adjustment.regime.toUpperCase()}): ` +
      `${adjustment.description}. Blocking upgrade to Aggressive strategy. ` +
      `Recommending Conservative instead to balance yield and risk.`;
    adjusted.shouldAct = shouldChangeStrategy(
      analysis.currentStrategy,
      Strategy.Conservative,
      analysis.confidence
    );
  }

  // In bear markets, suggest moving from aggressive to conservative
  if (adjustment.regime === 'bear' &&
      analysis.currentStrategy === Strategy.Aggressive) {
    adjusted.recommendedStrategy = Strategy.Conservative;
    adjusted.confidence = Math.max(analysis.confidence, 80);
    adjusted.shouldAct = true;
    adjusted.reasoning = `REGIME ADJUSTMENT (BEAR MARKET): ` +
      `${adjustment.description}. Recommending de-risking from Aggressive to Conservative.`;
  }

  // In bull markets with high confidence, consider aggressive
  if (adjustment.regime === 'bull' &&
      analysis.recommendedStrategy === Strategy.Conservative &&
      analysis.confidence >= 75 &&
      analysis.currentStrategy !== Strategy.Aggressive) {
    // Only suggest, don't force
    adjusted.reasoning = `${analysis.reasoning} ` +
      `REGIME NOTE: Bull market conditions may support aggressive strategy for qualifying invoices.`;
  }

  return adjusted;
}

/**
 * Get market regime statistics for display
 */
export function getRegimeStats(): {
  currentRegime: MarketRegime;
  dataPoints: number;
  lastUpdate: number;
  adjustment: ReturnType<typeof getRegimeAdjustment>;
} {
  return {
    currentRegime,
    dataPoints: marketHistory.length,
    lastUpdate: lastRegimeUpdate,
    adjustment: getRegimeAdjustment(),
  };
}
