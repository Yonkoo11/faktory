// Centralized constants for Faktory Agent

import { Strategy } from './types.js';

/**
 * Human-readable strategy names indexed by Strategy enum value
 */
export const STRATEGY_NAMES = ['Hold', 'Conservative', 'Aggressive'] as const;

/**
 * APY rates in basis points (100 = 1%)
 * These should match the values in YieldVault.sol
 */
export const STRATEGY_APY = {
  [Strategy.Hold]: 0,           // 0%
  [Strategy.Conservative]: 350, // 3.5%
  [Strategy.Aggressive]: 700,   // 7%
} as const;

/**
 * Get strategy name from enum value
 */
export function getStrategyName(strategy: Strategy): string {
  return STRATEGY_NAMES[strategy] ?? 'Unknown';
}

/**
 * Get APY percentage from strategy
 */
export function getStrategyAPY(strategy: Strategy): number {
  return (STRATEGY_APY[strategy] ?? 0) / 100;
}

/**
 * Agent decision thresholds
 */
export const AGENT_THRESHOLDS = {
  MIN_CONFIDENCE: 70,
  HIGH_CONFIDENCE: 85,
  STRATEGY_CHANGE_THRESHOLD: 15, // Min confidence diff to recommend change
} as const;

/**
 * Risk score boundaries
 */
export const RISK_LEVELS = {
  LOW: 30,      // 0-30 = low risk (good)
  MEDIUM: 60,   // 31-60 = medium risk
  HIGH: 100,    // 61-100 = high risk (bad)
} as const;
