// Rule-based strategy optimizer

import { Strategy, Invoice, Deposit, AnalysisResult } from './types.js';

interface OptimizationContext {
  invoice: Invoice;
  deposit?: Deposit;
  currentTimestamp: number;
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
  const strategyNames = ['Hold', 'Conservative', 'Aggressive'];
  const reasoning = generateReasoning(strategyNames[strategy], factors, confidence, daysUntilDue, invoice);

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
