"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { DashboardHeader } from "@/components/dashboard-header"
import { AgentActivity } from "@/components/AgentActivity"
import { useYieldVault } from "@/hooks/use-yield-vault"
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
          <Card className="glass border-glass-border p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center">
                <Bot className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Agent Status</p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  <p className="font-semibold text-success">Active</p>
                </div>
              </div>
            </div>
            <p className="text-2xl font-bold mb-1">Monitoring {activeDepositsCount} deposits</p>
            <p className="text-sm text-muted-foreground">Real-time blockchain data</p>
          </Card>

          <Card className="glass border-glass-border p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-success/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Yield Generated</p>
              </div>
            </div>
            <p className="text-2xl font-bold mb-1">${parseFloat(totalYield).toFixed(2)}</p>
            <p className="text-sm text-muted-foreground flex items-center">
              <Zap className="w-3 h-3 mr-1" />
              From vault strategies
            </p>
          </Card>

          <Card className="glass border-glass-border p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-success/20 to-accent/20 flex items-center justify-center">
                <Activity className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Agent Mode</p>
              </div>
            </div>
            <p className="text-2xl font-bold mb-1">Autonomous</p>
            <p className="text-sm text-muted-foreground">Optimizing yield strategies</p>
          </Card>
        </div>

        {/* Live Agent Activity Feed */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Live Agent Activity</h2>
          <AgentActivity showDemoControls={true} />
        </div>

        {/* Agent Controls */}
        <Card className="glass border-glass-border p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold mb-1">Agent Controls</h2>
              <p className="text-sm text-muted-foreground">Configure autonomous decision-making</p>
            </div>
            <Button variant="outline" size="sm" className="border-glass-border bg-background/50">
              <Settings className="w-4 h-4 mr-2" />
              Advanced Settings
            </Button>
          </div>

          <div className="space-y-6">
            <div className="flex items-start justify-between gap-4 p-5 bg-background/50 rounded-lg border border-glass-border">
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

        {/* Recent Decisions Feed */}
        <Card className="glass border-glass-border">
          <div className="p-6 border-b border-glass-border">
            <h2 className="text-xl font-semibold mb-1">Recent Decisions</h2>
            <p className="text-sm text-muted-foreground">AI-powered strategy optimizations and recommendations</p>
          </div>

          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-4">
              <Bot className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Decisions Yet</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              The agent will analyze your deposited invoices and make strategy recommendations here.
              Deposit invoices to the yield vault to see the agent in action.
            </p>
          </div>
        </Card>

        {/* Performance Insights */}
        <Card className="glass border-glass-border p-6">
          <h2 className="text-xl font-semibold mb-4">Performance Insights</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg border border-glass-border">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Strategy Optimization</h3>
                  <p className="text-sm text-muted-foreground">Continuous yield improvement</p>
                </div>
              </div>
              <p className="text-2xl font-bold gradient-text">3.5-7% APY</p>
              <p className="text-xs text-muted-foreground mt-1">Based on strategy selection</p>
            </div>

            <div className="p-5 bg-gradient-to-br from-success/5 to-primary/5 rounded-lg border border-glass-border">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-success/20 to-primary/20 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-success" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Risk Management</h3>
                  <p className="text-sm text-muted-foreground">Real-time monitoring</p>
                </div>
              </div>
              <p className="text-2xl font-bold gradient-text">24/7 Active</p>
              <p className="text-xs text-muted-foreground mt-1">Pyth oracle price feeds</p>
            </div>
          </div>
        </Card>
      </main>
    </div>
  )
}
