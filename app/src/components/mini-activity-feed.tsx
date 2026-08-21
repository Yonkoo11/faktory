import { cn } from '@/lib/utils'

interface MiniActivityFeedProps {
  activeDepositsCount: number
  className?: string
}

export function MiniActivityFeed({ activeDepositsCount, className }: MiniActivityFeedProps) {
  return (
    <div className={cn('', className)}>
      <div className="flex items-center gap-2 mb-3">
        <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
        <span className="text-[10px] text-[#666666] uppercase tracking-wider">System Readiness</span>
      </div>
      <div className="space-y-2 text-[11px]">
        <p className="text-[#e5e5e5]">
          &gt; {activeDepositsCount > 0
            ? `monitoring ${activeDepositsCount} on-chain deposit${activeDepositsCount === 1 ? '' : 's'}`
            : 'no active deposits; connect a wallet and mint an invoice to begin'}
        </p>
        <p className="text-[#666666]">&gt; APY values marked EST are illustrative fallbacks</p>
        <p className="text-[#666666]">&gt; live AI events appear on the agent page when its service connects</p>
      </div>
    </div>
  )
}
