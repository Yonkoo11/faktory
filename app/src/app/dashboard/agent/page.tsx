"use client"

/**
 * Faktory Agent Page - Terminal/Bloomberg Aesthetic
 * ALIVE: Live agent log, pulse animations, grid background
 */

import { useState } from "react"
import { Switch } from "@/components/ui/switch"
import { StatusBar } from "@/components/ui/status-bar"
import { TerminalNav } from "@/components/terminal-nav"
import { useYieldVault } from "@/hooks/use-yield-vault"
import { useAgentWebSocket } from "@/features/agent/hooks/useAgentWebSocket"
import { formatUnits } from "viem"

export default function AgentPage() {
  const [autoExecute, setAutoExecute] = useState(false)
  const { activeDepositsCount, totalYield } = useYieldVault()
  const { thoughts, connected, connecting, offline, manualReconnect } = useAgentWebSocket()

  const yieldFormatted = Number(formatUnits(BigInt(totalYield || 0), 18))
  const serviceLabel = connected ? "ONLINE" : connecting ? "CONNECTING" : "OFFLINE"

  return (
    <div className="min-h-screen bg-[#0a0a0a] bg-grid noise-overlay scan-line pb-8">
      <TerminalNav />

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-[24px] font-bold mb-1">AI AGENT</h1>
            <p className="text-[12px] text-[#666666]">Live Base Sepolia agent monitor</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-[#10b981] status-pulse' : connecting ? 'bg-[#f59e0b] animate-pulse' : 'bg-[#ef4444]'}`} />
            <span className={`text-[12px] font-semibold ${connected ? 'text-[#10b981]' : connecting ? 'text-[#f59e0b]' : 'text-[#ef4444]'}`}>{serviceLabel}</span>
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
            <Switch checked={autoExecute} onCheckedChange={setAutoExecute} disabled={!connected} />
          </div>

          {!connected && (
            <div className="mt-4 p-4 bg-[#f59e0b]/10 border border-[#f59e0b]/20 rounded flex items-center justify-between gap-4">
              <p className="text-[11px] text-[#f59e0b]">
                Auto-execution is disabled until the deployed agent service connects.
              </p>
              {offline && (
                <button onClick={manualReconnect} className="text-[11px] text-[#e5e5e5] underline underline-offset-4">
                  retry connection
                </button>
              )}
            </div>
          )}

          {connected && autoExecute && (
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
                <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-[#10b981] status-pulse' : 'bg-[#666666]'}`} />
                <span className={connected ? "text-[10px] text-[#10b981]" : "text-[10px] text-[#666666]"}>{connected ? 'LIVE' : 'NO LIVE FEED'}</span>
              </div>
            </div>
          </div>
          <div className="p-4 text-[12px]">
            {thoughts.length === 0 ? (
              <div className="py-10 text-center text-[#666666]">
                {connecting
                  ? 'connecting to the deployed agent service...'
                  : 'no live agent events received; on-chain dashboard remains available'}
              </div>
            ) : (
              <div className="space-y-0">
                {thoughts.slice(-8).map((thought, index) => (
                  <div key={`${thought.timestamp}-${index}`} className="flex items-start gap-3 py-2 border-b border-[#1f1f1f] last:border-b-0">
                    <span className="text-[#444444]">&gt;</span>
                    <span className="text-[#666666] w-20 shrink-0 tabular-nums">{new Date(thought.timestamp).toLocaleTimeString()}</span>
                    <span className={thought.type === 'error' ? 'text-[#ef4444]' : thought.type === 'execution' ? 'text-[#f59e0b]' : 'text-[#10b981]'}>{thought.message}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Current Tasks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="terminal-card p-6">
            <div className="text-[10px] text-[#666666] uppercase tracking-wider mb-3">Current Tasks</div>
            <div className="space-y-2 text-[12px]">
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-[#10b981] status-pulse' : 'bg-[#666666]'}`} />
                <span className="text-[#e5e5e5]">{connected ? 'Monitoring configured Base Sepolia contracts' : 'Agent service not connected'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-[#10b981] status-pulse' : 'bg-[#666666]'}`} />
                <span className="text-[#e5e5e5]">{connected ? 'Reading Pyth oracle data' : 'Awaiting live oracle events'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${connected && activeDepositsCount > 0 ? 'bg-[#10b981] status-pulse' : 'bg-[#666666]'}`} />
                <span className="text-[#e5e5e5]">{activeDepositsCount > 0 ? `Watching ${activeDepositsCount} active deposits` : 'No active deposits to analyze'}</span>
              </div>
            </div>
          </div>

          <div className="terminal-card p-6">
            <div className="text-[10px] text-[#666666] uppercase tracking-wider mb-3">Ready to Act</div>
            <p className="text-[12px] text-[#666666] mb-4">
              {activeDepositsCount > 0
                ? connected
                  ? `Watching ${activeDepositsCount} active deposits for optimization.`
                  : `${activeDepositsCount} deposits found; connect the agent service to analyze them.`
                : "Deposit an invoice to enable yield optimization."}
            </p>
            <div className="flex items-center gap-6 text-[11px]">
              <div>
                <span className="text-[#666666]">service:</span>
                <span className={connected ? "text-[#10b981] ml-1" : "text-[#ef4444] ml-1"}>{serviceLabel.toLowerCase()}</span>
              </div>
              <div>
                <span className="text-[#666666]">network:</span>
                <span className="text-[#10b981] ml-1">Base Sepolia</span>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Insights */}
        <div className="stats-grid grid-cols-2">
          <div className="stat-cell">
            <div className="stat-label">Configured Strategy Range</div>
            <div className="stat-value stat-value-amber tabular-nums">3.5-7%</div>
            <div className="text-[11px] text-[#666666] mt-1">testnet strategy parameters</div>
          </div>
          <div className="stat-cell">
            <div className="stat-label">Auto-Execute Gate</div>
            <div className="stat-value stat-value-green">70%</div>
            <div className="text-[11px] text-[#666666] mt-1">minimum confidence threshold</div>
          </div>
        </div>
      </main>

      {/* Status Bar */}
      <StatusBar status="online" network="MULTICHAIN" />
    </div>
  )
}
