import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Zap } from 'lucide-react';
import { calculateProjectedEarnings } from '../../hooks/useStrategyConfig';

interface AmountInputProps {
  depositAmount: string;
  onAmountChange: (amount: string) => void;
  invoiceAmount?: string;
  selectedStrategyAPY: number;
}

export function AmountInput({
  depositAmount,
  onAmountChange,
  invoiceAmount,
  selectedStrategyAPY,
}: AmountInputProps) {
  const showFullAmountTip =
    invoiceAmount &&
    depositAmount !== invoiceAmount &&
    depositAmount !== '';

  return (
    <div className="space-y-4">
      {/* Amount Input */}
      <div className="space-y-2">
        <Label htmlFor="depositAmount">Principal Amount</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            $
          </span>
          <Input
            id="depositAmount"
            type="number"
            placeholder="25000"
            value={depositAmount}
            onChange={(e) => onAmountChange(e.target.value)}
            className="pl-7 bg-background/50 border-glass-border text-lg font-semibold"
          />
        </div>
        {showFullAmountTip && (
          <p className="text-xs text-muted-foreground">
            Tip: Depositing the full invoice amount (${invoiceAmount}) maximizes
            yield.
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          No lockup — withdraw your funds anytime.
        </p>
      </div>

      {/* Projected Earnings Calculator */}
      <Card className="glass border-glass-border p-5 bg-gradient-to-br from-primary/5 to-accent/5">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          Projected Earnings (estimated)
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">30 Days</p>
            <p className="text-xl font-bold gradient-text">
              ~${calculateProjectedEarnings(depositAmount, selectedStrategyAPY, 30)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">90 Days</p>
            <p className="text-xl font-bold gradient-text">
              ~${calculateProjectedEarnings(depositAmount, selectedStrategyAPY, 90)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">1 Year</p>
            <p className="text-xl font-bold gradient-text">
              ~${calculateProjectedEarnings(depositAmount, selectedStrategyAPY, 365)}
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Based on current APY. Actual yield may vary.
        </p>
      </Card>
    </div>
  );
}
