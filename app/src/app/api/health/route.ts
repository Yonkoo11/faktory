import { NextResponse } from "next/server"
import { publicClient, getActiveDeposits, getTotalInvoices } from "@/lib/contracts/server"

export const dynamic = "force-dynamic"
export const revalidate = 0

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy"
  timestamp: string
  version: string
  services: {
    blockchain: {
      status: "up" | "down"
      chainId?: number
      blockNumber?: number
      latency?: number
    }
    contracts: {
      status: "up" | "down"
      invoicesCount?: number
      activeDeposits?: number
    }
    agent: {
      status: "unknown" | "up" | "down"
      wsEndpoint: string
    }
  }
}

export async function GET() {
  const startTime = Date.now()

  const health: HealthStatus = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "1.0.0",
    services: {
      blockchain: { status: "down" },
      contracts: { status: "down" },
      agent: {
        status: "unknown",
        wsEndpoint: process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080",
      },
    },
  }

  // Check blockchain connectivity
  try {
    const blockchainStart = Date.now()
    const [chainId, blockNumber] = await Promise.all([
      publicClient.getChainId(),
      publicClient.getBlockNumber(),
    ])
    health.services.blockchain = {
      status: "up",
      chainId,
      blockNumber: Number(blockNumber),
      latency: Date.now() - blockchainStart,
    }
  } catch (error) {
    console.error("Blockchain health check failed:", error)
    health.services.blockchain.status = "down"
    health.status = "degraded"
  }

  // Check contract accessibility
  try {
    const [totalInvoices, activeDeposits] = await Promise.all([
      getTotalInvoices(),
      getActiveDeposits(),
    ])
    health.services.contracts = {
      status: "up",
      invoicesCount: totalInvoices,
      activeDeposits: activeDeposits.length,
    }
  } catch (error) {
    console.error("Contract health check failed:", error)
    health.services.contracts.status = "down"
    health.status = "degraded"
  }

  // Determine overall status
  if (
    health.services.blockchain.status === "down" &&
    health.services.contracts.status === "down"
  ) {
    health.status = "unhealthy"
  }

  const statusCode = health.status === "unhealthy" ? 503 : 200

  return NextResponse.json(health, {
    status: statusCode,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "X-Response-Time": `${Date.now() - startTime}ms`,
    },
  })
}
