import { NextRequest, NextResponse } from "next/server"
import {
  getTotalValueLocked,
  getTotalYieldGenerated,
  getActiveDeposits,
  getDeposit,
  getAccruedYield,
} from "@/lib/contracts/server"
import { formatUnits } from "viem"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const address = searchParams.get("address")

    // Get global yield stats
    const [tvl, totalYield, activeDepositIds] = await Promise.all([
      getTotalValueLocked(),
      getTotalYieldGenerated(),
      getActiveDeposits(),
    ])

    // If no address specified, return global stats
    if (!address) {
      return NextResponse.json({
        success: true,
        data: {
          tvl: formatUnits(tvl, 18),
          tvlRaw: tvl.toString(),
          totalYieldGenerated: formatUnits(totalYield, 18),
          totalYieldGeneratedRaw: totalYield.toString(),
          activeDepositsCount: activeDepositIds.length,
        },
      })
    }

    // If address specified, get user-specific data
    // For now, we'll filter deposits by owner
    const userDeposits = []

    for (const tokenId of activeDepositIds) {
      const deposit = await getDeposit(tokenId)
      if (deposit && deposit.owner.toLowerCase() === address.toLowerCase()) {
        const yield_ = await getAccruedYield(tokenId)
        userDeposits.push({
          tokenId: tokenId.toString(),
          strategy: getStrategyLabel(deposit.strategy),
          strategyCode: deposit.strategy,
          depositTime: new Date(Number(deposit.depositTime) * 1000).toISOString(),
          principal: formatUnits(deposit.principal, 18),
          principalRaw: deposit.principal.toString(),
          accruedYield: formatUnits(yield_, 18),
          accruedYieldRaw: yield_.toString(),
        })
      }
    }

    const totalUserPrincipal = userDeposits.reduce(
      (sum, d) => sum + BigInt(d.principalRaw),
      BigInt(0)
    )
    const totalUserYield = userDeposits.reduce(
      (sum, d) => sum + BigInt(d.accruedYieldRaw),
      BigInt(0)
    )

    return NextResponse.json({
      success: true,
      data: {
        address,
        deposits: userDeposits,
        totalPrincipal: formatUnits(totalUserPrincipal, 18),
        totalPrincipalRaw: totalUserPrincipal.toString(),
        totalAccruedYield: formatUnits(totalUserYield, 18),
        totalAccruedYieldRaw: totalUserYield.toString(),
        depositCount: userDeposits.length,
        globalStats: {
          tvl: formatUnits(tvl, 18),
          totalYieldGenerated: formatUnits(totalYield, 18),
        },
      },
    })
  } catch (error) {
    console.error("Error fetching yield data:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch yield data",
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
