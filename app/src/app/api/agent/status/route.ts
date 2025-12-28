import { NextResponse } from "next/server"
import {
  getTotalDecisions,
  getAgentConfig,
  getActiveDeposits,
  getDecisionHistory,
} from "@/lib/contracts/server"

export async function GET() {
  try {
    const [totalDecisions, config, activeDepositIds] = await Promise.all([
      getTotalDecisions(),
      getAgentConfig(),
      getActiveDeposits(),
    ])

    // Get recent decisions across all active deposits
    const recentDecisions: Array<{
      tokenId: string
      strategy: string
      reasoning: string
      confidence: number
      timestamp: string
      executed: boolean
    }> = []

    for (const tokenId of activeDepositIds.slice(0, 10)) {
      const decisions = await getDecisionHistory(tokenId)
      if (Array.isArray(decisions) && decisions.length > 0) {
        const latest = decisions[decisions.length - 1] as {
          tokenId: bigint
          recommendedStrategy: number
          reasoning: string
          confidence: bigint
          timestamp: bigint
          executed: boolean
        }
        recentDecisions.push({
          tokenId: tokenId.toString(),
          strategy: getStrategyLabel(latest.recommendedStrategy),
          reasoning: latest.reasoning,
          confidence: Number(latest.confidence),
          timestamp: new Date(Number(latest.timestamp) * 1000).toISOString(),
          executed: latest.executed,
        })
      }
    }

    // Sort by timestamp descending
    recentDecisions.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )

    const formattedConfig = config
      ? {
          minConfidence: Number((config as { minConfidence: bigint }).minConfidence),
          maxGasPrice: (config as { maxGasPrice: bigint }).maxGasPrice.toString(),
          autoExecute: (config as { autoExecute: boolean }).autoExecute,
          active: (config as { active: boolean }).active,
        }
      : null

    return NextResponse.json({
      success: true,
      data: {
        status: formattedConfig?.active ? "active" : "inactive",
        totalDecisions,
        activeDepositsMonitored: activeDepositIds.length,
        config: formattedConfig,
        recentDecisions: recentDecisions.slice(0, 5),
        lastUpdated: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("Error fetching agent status:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch agent status",
      },
      { status: 500 }
    )
  }
}

function getStrategyLabel(strategy: number): string {
  const labels: Record<number, string> = {
    0: "Hold",
    1: "Conservative",
    2: "Aggressive",
  }
  return labels[strategy] || "Unknown"
}
