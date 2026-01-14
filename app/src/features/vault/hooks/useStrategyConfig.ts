import { Shield, TrendingUp } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { StrategyType } from './useDepositFlow';

export interface StrategyConfig {
  id: StrategyType;
  name: string;
  apy: string;
  apyValue: number;
  description: string;
  risk: string;
  icon: LucideIcon;
  color: string;
  recommended: boolean;
  isLive: boolean;
}

interface UseStrategyConfigParams {
  conservativeAPY: number;
  aggressiveAPY: number;
  hasLendleData: boolean;
}

export function useStrategyConfig({
  conservativeAPY,
  aggressiveAPY,
  hasLendleData,
}: UseStrategyConfigParams): StrategyConfig[] {
  return [
    {
      id: 'hold' as StrategyType,
      name: 'Hold',
      apy: '0%',
      apyValue: 0,
      description: 'Keep funds idle. No yield, no risk.',
      risk: 'None',
      icon: Shield,
      color: 'muted',
      recommended: false,
      isLive: false,
    },
    {
      id: 'conservative' as StrategyType,
      name: 'Conservative',
      apy: `${conservativeAPY.toFixed(1)}%`,
      apyValue: conservativeAPY,
      description: 'Lend USDC on Lendle. Lower yield, battle-tested protocol.',
      risk: 'Low',
      icon: Shield,
      color: 'primary',
      recommended: true,
      isLive: hasLendleData,
    },
    {
      id: 'aggressive' as StrategyType,
      name: 'Aggressive',
      apy: `${aggressiveAPY.toFixed(1)}%`,
      apyValue: aggressiveAPY,
      description: 'Leveraged lending. Higher yield, more volatility.',
      risk: 'Medium',
      icon: TrendingUp,
      color: 'accent',
      recommended: false,
      isLive: hasLendleData,
    },
  ];
}

export function calculateProjectedEarnings(
  depositAmount: string,
  apyValue: number,
  days: number
): string {
  const amount = Number.parseFloat(depositAmount) || 0;
  const apy = apyValue / 100;
  return ((amount * apy * days) / 365).toFixed(2);
}
