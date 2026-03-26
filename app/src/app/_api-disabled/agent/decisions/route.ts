import { NextRequest, NextResponse } from "next/server"
import { getActiveDeposits, getDecisionHistory } from "@/lib/contracts/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const tokenId = searchParams.get("tokenId")
    const limit = parseInt(searchParams.get("limit") || "20")
    const offset = parseInt(searchParams.get("offset") || "0")

    // If tokenId specified, get decisions for that specific invoice
    if (tokenId) {
      const decisions = await getDecisionHistory(BigInt(tokenId))
      const formattedDecisions = Array.isArray(decisions)
        ? decisions.map((d: {
            tokenId: bigint
            recommendedStrategy: number
            reasoning: string
            confidence: bigint
            timestamp: bigint
            executed: boolean
          }) => ({
            tokenId: d.tokenId.toString(),
            strategy: getStrategyLabel(d.recommendedStrategy),
            strategyCode: d.recommendedStrategy,
            reasoning: d.reasoning,
            confidence: Number(d.confidence),
            timestamp: new Date(Number(d.timestamp) * 1000).toISOString(),
            executed: d.executed,
          }))
        : []

      return NextResponse.json({
        success: true,
        data: {
          tokenId,
          decisions: formattedDecisions,
          total: formattedDecisions.length,
        },
      })
    }

    // Get all decisions across all active deposits
    const activeDepositIds = await getActiveDeposits()

    const allDecisions: Array<{
      tokenId: string
      strategy: string
      strategyCode: number
      reasoning: string
      confidence: number
      timestamp: string
      executed: boolean
    }> = []

    for (const id of activeDepositIds) {
      const decisions = await getDecisionHistory(id)
      if (Array.isArray(decisions)) {
        for (const d of decisions as Array<{
          tokenId: bigint
          recommendedStrategy: number
          reasoning: string
          confidence: bigint
          timestamp: bigint
          executed: boolean
        }>) {
          allDecisions.push({
            tokenId: id.toString(),
            strategy: getStrategyLabel(d.recommendedStrategy),
            strategyCode: d.recommendedStrategy,
            reasoning: d.reasoning,
            confidence: Number(d.confidence),
            timestamp: new Date(Number(d.timestamp) * 1000).toISOString(),
            executed: d.executed,
          })
        }
      }
    }

    // Sort by timestamp descending
    allDecisions.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )

    // Paginate
    const paginated = allDecisions.slice(offset, offset + limit)

    return NextResponse.json({
      success: true,
      data: {
        decisions: paginated,
        total: allDecisions.length,
        limit,
        offset,
        hasMore: offset + limit < allDecisions.length,
      },
    })
  } catch (error) {
    console.error("Error fetching agent decisions:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch agent decisions",
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
