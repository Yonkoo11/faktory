'use client'

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface RiskBadgeProps {
  score: number
}

export function RiskBadge({ score }: RiskBadgeProps) {
  const getRiskLevel = () => {
    if (score >= 80) return {
      dotClass: "bg-success",
      textClass: "text-success",
      label: "Low Risk",
      desc: "High payment probability"
    }
    if (score >= 60) return {
      dotClass: "bg-warning",
      textClass: "text-warning",
      label: "Medium Risk",
      desc: "Moderate payment probability"
    }
    return {
      dotClass: "bg-destructive",
      textClass: "text-destructive",
      label: "High Risk",
      desc: "Lower payment probability"
    }
  }

  const { dotClass, textClass, label, desc } = getRiskLevel()

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5 cursor-help">
            <div className={`w-2 h-2 rounded-full ${dotClass}`} />
            <span className={`text-xs font-medium ${textClass}`}>{score}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[200px]">
          <p className="font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">{desc}</p>
          <p className="text-xs text-muted-foreground mt-1">AI-predicted payment score based on invoice data</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
