"use client"

/**
 * Faktory Agent Page - Terminal/Bloomberg Aesthetic
 * ALIVE: Live agent log, pulse animations, grid background
 */

import { useState } from "react"
import { useAccount } from "wagmi"
import { Switch } from "@/components/ui/switch"
import { StatusBar } from "@/components/ui/status-bar"
import { TerminalNav } from "@/components/terminal-nav"
import { LiveAgentLog } from "@/components/live-agent-log"
import { useYieldVault } from "@/hooks/use-yield-vault"
import { formatUnits } from "viem"

export default function AgentPage() {
  const [autoExecute, setAutoExecute] = useState(true)
  const { address, isConnected } = useAccount()
  const { activeDepositsCount, totalYield } = useYieldVault()

  const yieldFormatted = Number(formatUnits(BigInt(totalYield || 0), 18))

  return (
    <div className="min-h-screen bg-[#0a0a0a] bg-grid noise-overlay scan-line pb-8">
      <TerminalNav />

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-[24px] font-bold mb-1">AI AGENT</h1>
            <p className="text-[12px] text-[#666666]">Autonomous yield optimization</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#10b981] status-pulse" />
            <span className="text-[12px] text-[#10b981] font-semibold">ONLINE</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid grid-cols-3 mb-8">
          <div className="stat-cell">
            <div className="stat-label">Monitoring</div>
            <div className="stat-value tabular-nums">{activeDepositsCount}</div>
            <div className="text-[11px] text-[#666666] mt-1">active deposits</div>
          </div>
          <div className="stat-cell">
            <div className="stat-label">Total Yield Generated</div>
            <div className="stat-value stat-value-green tabular-nums">+${yieldFormatted.toFixed(2)}</div>
            <div className="text-[11px] text-[#666666] mt-1">from vault strategies</div>
          </div>
          <div className="stat-cell">
            <div className="stat-label">Confidence Threshold</div>
            <div className="stat-value stat-value-amber tabular-nums">70%</div>
            <div className="text-[11px] text-[#666666] mt-1">for auto-execute</div>
          </div>
        </div>

        {/* Agent Controls */}
        <div className="terminal-card p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-[14px] font-semibold mb-1">Agent Controls</h2>
              <p className="text-[11px] text-[#666666]">Configure autonomous decision-making</p>
            </div>
          </div>

          <div className="flex items-start justify-between gap-4 p-4 bg-[#0a0a0a] rounded border border-[#1f1f1f]">
            <div className="flex-1">
              <h3 className="text-[13px] font-semibold mb-1">Auto-Execute Decisions</h3>
              <p className="text-[11px] text-[#666666]">
                Allow the AI agent to automatically implement strategy changes when confidence exceeds 70%.
              </p>
            </div>
            <Switch checked={autoExecute} onCheckedChange={setAutoExecute} />
          </div>

          {autoExecute && (
            <div className="mt-4 p-4 bg-[#10b981]/10 border border-[#10b981]/20 rounded">
              <div className="text-[11px]">
                <span className="text-[#10b981] font-semibold">SAFETY LIMITS ACTIVE</span>
                <ul className="text-[#666666] mt-2 space-y-1">
                  <li>• Max 50% portfolio in aggressive strategies</li>
                  <li>• Min 70% confidence for auto-execution</li>
                  <li>• Manual override always available</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Live Agent Log */}
        <div className="terminal-card mb-8">
          <div className="px-4 py-3 border-b border-[#1f1f1f] bg-[#111111]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold">Agent Activity</span>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] status-pulse" />
                <span className="text-[10px] text-[#10b981]">LIVE</span>
              </div>
            </div>
          </div>
          <div className="p-4 text-[12px]">
            <LiveAgentLog maxEntries={8} />
          </div>
        </div>

        {/* Current Tasks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="terminal-card p-6">
            <div className="text-[10px] text-[#666666] uppercase tracking-wider mb-3">Current Tasks</div>
            <div className="space-y-2 text-[12px]">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] status-pulse" />
                <span className="text-[#e5e5e5]">Monitoring Lendle supply rates</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] status-pulse" />
                <span className="text-[#e5e5e5]">Checking CRO price via Pyth</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] status-pulse" />
                <span className="text-[#e5e5e5]">Analyzing market volatility</span>
              </div>
            </div>
          </div>

          <div className="terminal-card p-6">
            <div className="text-[10px] text-[#666666] uppercase tracking-wider mb-3">Ready to Act</div>
            <p className="text-[12px] text-[#666666] mb-4">
              {activeDepositsCount > 0
                ? `Watching ${activeDepositsCount} active deposits for optimization.`
                : "Deposit an invoice to enable yield optimization."}
            </p>
            <div className="flex items-center gap-6 text-[11px]">
              <div>
                <span className="text-[#666666]">next_check:</span>
                <span className="text-[#10b981] ml-1 tabular-nums">~30s</span>
              </div>
              <div>
                <span className="text-[#666666]">uptime:</span>
                <span className="text-[#10b981] ml-1">24/7</span>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Insights */}
        <div className="stats-grid grid-cols-2">
          <div className="stat-cell">
            <div className="stat-label">Strategy Optimization</div>
            <div className="stat-value stat-value-amber tabular-nums">3.5-7%</div>
            <div className="text-[11px] text-[#666666] mt-1">APY based on strategy</div>
          </div>
          <div className="stat-cell">
            <div className="stat-label">Risk Management</div>
            <div className="stat-value stat-value-green">24/7</div>
            <div className="text-[11px] text-[#666666] mt-1">Pyth oracle price feeds</div>
          </div>
        </div>
      </main>

      {/* Status Bar */}
      <StatusBar status="online" network="CRONOS TESTNET" />
    </div>
  )
}
