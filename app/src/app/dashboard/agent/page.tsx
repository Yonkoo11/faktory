"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { DashboardHeader } from "@/components/dashboard-header"
import { AgentActivity } from "@/components/AgentActivity"
import { useYieldVault } from "@/hooks/use-yield-vault"
import { IconBox } from "@/components/ui/icon-box"
import {
  Bot,
  Zap,
  TrendingUp,
  Shield,
  Activity,
  Settings,
} from "lucide-react"

export default function AgentPage() {
  const [autoExecute, setAutoExecute] = useState(true)

  // Get real data from blockchain
  const { activeDepositsCount, totalYield } = useYieldVault()

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="container mx-auto px-4 py-8 space-y-8 max-w-6xl">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">AI Agent</h1>
          <p className="text-muted-foreground">
            Autonomous yield optimization powered by machine learning and on-chain analytics
          </p>
        </div>

        {/* Agent Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="card-glass p-6 hover-glow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--gradient-primary-from)] to-[var(--gradient-primary-to)] flex items-center justify-center shadow-lg">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Agent Status</p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <p className="font-semibold text-primary">Enabled</p>
                </div>
              </div>
            </div>
            <p className="text-2xl font-bold mb-1 bg-gradient-to-r from-[var(--gradient-primary-from)] to-[var(--gradient-primary-to)] bg-clip-text text-transparent">{activeDepositsCount} deposits</p>
            <p className="text-sm text-muted-foreground">Will optimize when agent runs</p>
          </Card>

          <Card className="card-glass p-6 hover-glow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--gradient-success-from)] to-[var(--gradient-success-to)] flex items-center justify-center shadow-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Yield Generated</p>
              </div>
            </div>
            <p className="text-2xl font-bold mb-1 bg-gradient-to-r from-[var(--gradient-success-from)] to-[var(--gradient-success-to)] bg-clip-text text-transparent">~${parseFloat(totalYield).toFixed(2)}</p>
            <p className="text-sm text-muted-foreground flex items-center">
              <Zap className="w-3 h-3 mr-1" />
              From vault strategies
            </p>
          </Card>

          <Card className="card-glass p-6 hover-glow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--gradient-primary-from)] to-[var(--gradient-primary-to)] flex items-center justify-center shadow-lg">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Agent Mode</p>
              </div>
            </div>
            <p className="text-2xl font-bold mb-1">Auto-Execute</p>
            <p className="text-sm text-muted-foreground">When confidence &gt; 80%</p>
          </Card>
        </div>

        {/* Live Agent Activity Feed */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Live Agent Activity</h2>
          <AgentActivity showDemoControls={true} />
        </div>

        {/* Agent Controls */}
        <Card className="card-glass p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold mb-1">Agent Controls</h2>
              <p className="text-sm text-muted-foreground">Configure autonomous decision-making</p>
            </div>
            <Button variant="gradient" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Advanced Settings
            </Button>
          </div>

          <div className="space-y-6">
            <div className="flex items-start justify-between gap-4 p-5 bg-background rounded-lg border border-border">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-5 h-5 text-accent" />
                  <h3 className="font-semibold">Auto-Execute Decisions</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Allow the AI agent to automatically implement strategy changes without manual approval. Decisions with
                  confidence below 80% will still require approval.
                </p>
              </div>
              <Switch checked={autoExecute} onCheckedChange={setAutoExecute} />
            </div>

            {autoExecute && (
              <div className="p-4 bg-accent/5 border border-accent/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-foreground mb-1">Safety Limits Active</p>
                    <ul className="text-muted-foreground space-y-1">
                      <li>• Maximum 50% of portfolio can be in aggressive strategies</li>
                      <li>• Minimum 80% confidence required for auto-execution</li>
                      <li>• You can override any decision at any time</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Agent Activity Status */}
        <Card className="card-glass">
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold mb-1">Agent Activity</h2>
                <p className="text-sm text-muted-foreground">Real-time monitoring and optimization</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-[var(--gradient-primary-from)] to-[var(--gradient-primary-to)] shadow-lg">
                <div className="w-2 h-2 rounded-full bg-white" />
                <span className="text-xs font-medium text-white">Agent Enabled</span>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Current Activity */}
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Current Tasks</span>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-success" />
                    Monitoring Lendle supply rates
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-success" />
                    Checking MNT price via Pyth
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-success" />
                    Analyzing market volatility
                  </li>
                </ul>
              </div>

              {/* Next Action */}
              <div className="p-4 rounded-lg bg-accent/5 border border-accent/20">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-4 h-4 text-accent" />
                  <span className="text-sm font-medium">Ready to Act</span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {activeDepositsCount > 0
                    ? `Watching ${activeDepositsCount} active deposits for optimization opportunities.`
                    : "Deposit an invoice to enable yield optimization."}
                </p>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">Next check:</span>
                    <span className="font-mono text-primary">~30s</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">Uptime:</span>
                    <span className="font-mono text-success">24/7</span>
                  </div>
                </div>
              </div>
            </div>

            {/* How it works - compact */}
            <div className="p-4 rounded-lg bg-muted/30 border border-border">
              <p className="text-xs text-muted-foreground text-center">
                The AI agent analyzes market conditions every 30 seconds and automatically recommends strategy changes when confidence exceeds 80%.
              </p>
            </div>
          </div>
        </Card>

        {/* Performance Insights */}
        <Card className="card-glass p-6">
          <h2 className="text-xl font-semibold mb-4">Performance Insights</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 bg-primary/5 rounded-lg border border-primary/20 hover-glow">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--gradient-primary-from)] to-[var(--gradient-primary-to)] flex items-center justify-center shadow-lg">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Strategy Optimization</h3>
                  <p className="text-sm text-muted-foreground">Continuous yield improvement</p>
                </div>
              </div>
              <p className="text-2xl font-bold bg-gradient-to-r from-[var(--gradient-primary-from)] to-[var(--gradient-primary-to)] bg-clip-text text-transparent">3.5-7% APY</p>
              <p className="text-xs text-muted-foreground mt-1">Based on strategy selection</p>
            </div>

            <div className="p-5 bg-success/5 rounded-lg border border-success/20 hover-glow">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--gradient-success-from)] to-[var(--gradient-success-to)] flex items-center justify-center shadow-lg">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Risk Management</h3>
                  <p className="text-sm text-muted-foreground">Real-time monitoring</p>
                </div>
              </div>
              <p className="text-2xl font-bold bg-gradient-to-r from-[var(--gradient-success-from)] to-[var(--gradient-success-to)] bg-clip-text text-transparent">24/7 Active</p>
              <p className="text-xs text-muted-foreground mt-1">Pyth oracle price feeds</p>
            </div>
          </div>
        </Card>
      </main>
    </div>
  )
}
