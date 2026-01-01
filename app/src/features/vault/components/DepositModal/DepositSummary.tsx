import type { StrategyType } from '../../hooks/useDepositFlow';

interface DepositSummaryProps {
  depositAmount: string;
  selectedStrategy: StrategyType;
  strategyAPY: string;
}

export function DepositSummary({
  depositAmount,
  selectedStrategy,
  strategyAPY,
}: DepositSummaryProps) {
  const strategyName =
    selectedStrategy.charAt(0).toUpperCase() + selectedStrategy.slice(1);

  return (
    <div className="p-4 bg-muted/30 rounded-lg border border-glass-border text-sm">
      <p className="font-medium mb-2">You&apos;re about to:</p>
      <ul className="space-y-1 text-muted-foreground">
        <li>
          • Deposit{' '}
          <span className="text-foreground font-medium">${depositAmount} USDC</span>
        </li>
        <li>
          • Use <span className="text-foreground font-medium">{strategyName}</span>{' '}
          strategy
        </li>
        <li>
          • Earn ~<span className="text-foreground font-medium">{strategyAPY}</span>{' '}
          APY
        </li>
      </ul>
    </div>
  );
}
