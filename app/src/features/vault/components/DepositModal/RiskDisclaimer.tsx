import { Checkbox } from '@/components/ui/checkbox';

interface RiskDisclaimerProps {
  acceptRisk: boolean;
  onAcceptChange: (accepted: boolean) => void;
}

export function RiskDisclaimer({ acceptRisk, onAcceptChange }: RiskDisclaimerProps) {
  return (
    <div className="flex items-start gap-3 p-4 bg-warning/5 border border-warning/20 rounded-lg">
      <Checkbox
        id="acceptRisk"
        checked={acceptRisk}
        onCheckedChange={(checked) => onAcceptChange(checked as boolean)}
        className="mt-1"
      />
      <label htmlFor="acceptRisk" className="text-sm cursor-pointer">
        <p className="font-medium text-foreground mb-1">I understand the risks</p>
        <p className="text-muted-foreground">
          DeFi lending carries smart contract risk. Yield rates are variable and not
          guaranteed. I have reviewed the strategy details and accept the associated
          risks.
        </p>
      </label>
    </div>
  );
}
