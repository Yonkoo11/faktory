"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Zap, DollarSign, TrendingDown } from "lucide-react"

interface CostCalculatorProps {
  className?: string
}

export function CostCalculator({ className }: CostCalculatorProps) {
  const [txPerDay, setTxPerDay] = useState(2880) // Default: agent runs every 30s

  // Cost estimates (conservative)
  const L1_COST_PER_TX = 0.50 // $0.50 average on Ethereum
  const MANTLE_COST_PER_TX = 0.001 // $0.001 on Mantle

  const dailyCostL1 = txPerDay * L1_COST_PER_TX
  const dailyCostMantle = txPerDay * MANTLE_COST_PER_TX
  const dailySavings = dailyCostL1 - dailyCostMantle
  const monthlySavings = dailySavings * 30
  const savingsPercent = ((dailySavings / dailyCostL1) * 100).toFixed(0)

  return (
    <Card className={`glass border-glass-border p-6 ${className}`}>
      <div className="flex items-center gap-2 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-success/20 to-primary/20 flex items-center justify-center">
          <DollarSign className="w-5 h-5 text-success" />
        </div>
        <div>
          <h3 className="font-semibold">Cost Savings Calculator</h3>
          <p className="text-xs text-muted-foreground">See how much Mantle saves you</p>
        </div>
      </div>

      {/* Slider */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-muted-foreground">Agent transactions per day</span>
          <span className="font-mono font-medium">{txPerDay.toLocaleString()}</span>
        </div>
        <Slider
          value={[txPerDay]}
          onValueChange={(value) => setTxPerDay(value[0])}
          min={100}
          max={10000}
          step={100}
          className="my-4"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>100 tx/day</span>
          <span>10,000 tx/day</span>
        </div>
      </div>

      {/* Comparison */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
          <div className="text-xs text-muted-foreground mb-1">Ethereum L1</div>
          <div className="text-2xl font-bold text-destructive">
            ${dailyCostL1.toFixed(2)}
          </div>
          <div className="text-xs text-muted-foreground">per day</div>
        </div>
        <div className="p-4 rounded-lg bg-success/10 border border-success/20">
          <div className="text-xs text-muted-foreground mb-1">Mantle</div>
          <div className="text-2xl font-bold text-success">
            ${dailyCostMantle.toFixed(2)}
          </div>
          <div className="text-xs text-muted-foreground">per day</div>
        </div>
      </div>

      {/* Savings */}
      <div className="p-4 rounded-lg bg-gradient-to-r from-success/10 to-primary/10 border border-success/20">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-success" />
            <span className="text-sm font-medium">Your Savings</span>
          </div>
          <Badge variant="outline" className="border-success/30 bg-success/10 text-success">
            {savingsPercent}% cheaper
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xl font-bold text-success">${dailySavings.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground">per day</div>
          </div>
          <div>
            <div className="text-xl font-bold text-success">${monthlySavings.toFixed(0)}</div>
            <div className="text-xs text-muted-foreground">per month</div>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-4 text-center">
        <Zap className="w-3 h-3 inline mr-1" />
        Faktory&apos;s AI agent runs {(2880).toLocaleString()} tx/day by default
      </p>
    </Card>
  )
}
