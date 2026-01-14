import { Checkbox } from '@/components/ui/checkbox';

interface RiskDisclaimerProps {
  acceptRisk: boolean;
  onAcceptChange: (accepted: boolean) => void;
}

export function RiskDisclaimer({ acceptRisk, onAcceptChange }: RiskDisclaimerProps) {
  return (
    <div className="space-y-3">
      {/* Required indicator */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="text-destructive">*</span>
        <span>Required to continue</span>
      </div>

      {/* Clickable risk acceptance box */}
      <label
        htmlFor="acceptRisk"
        className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
          acceptRisk
            ? 'bg-success/5 border-success/30'
            : 'bg-warning/5 border-warning/30 hover:border-warning/50'
        }`}
      >
        <Checkbox
          id="acceptRisk"
          checked={acceptRisk}
          onCheckedChange={(checked) => onAcceptChange(checked as boolean)}
          className="mt-1 h-5 w-5"
        />
        <div className="flex-1">
          <p className="font-semibold text-foreground mb-1.5 text-base">
            I understand the risks
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            DeFi lending carries smart contract risk. Yield rates are variable and not
            guaranteed. I have reviewed the strategy details and accept the associated
            risks.
          </p>
        </div>
      </label>

      {/* Visual prompt when unchecked */}
      {!acceptRisk && (
        <p className="text-xs text-warning flex items-center gap-1.5 pl-1">
          <span className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" />
          Please check the box above to proceed with your deposit
        </p>
      )}
    </div>
  );
}
