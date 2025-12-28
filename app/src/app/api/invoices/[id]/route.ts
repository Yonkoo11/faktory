import { NextRequest, NextResponse } from "next/server"
import { getFormattedInvoice, getDecisionHistory } from "@/lib/contracts/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const tokenId = BigInt(id)

    const invoice = await getFormattedInvoice(tokenId)

    if (!invoice) {
      return NextResponse.json(
        {
          success: false,
          error: "Invoice not found",
        },
        { status: 404 }
      )
    }

    // Get decision history for this invoice
    const decisions = await getDecisionHistory(tokenId)
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
          reasoning: d.reasoning,
          confidence: Number(d.confidence),
          timestamp: new Date(Number(d.timestamp) * 1000).toISOString(),
          executed: d.executed,
        }))
      : []

    return NextResponse.json({
      success: true,
      data: {
        ...invoice,
        decisions: formattedDecisions,
      },
    })
  } catch (error) {
    console.error("Error fetching invoice:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch invoice",
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
