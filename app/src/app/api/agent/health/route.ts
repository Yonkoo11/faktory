import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

interface AgentHealthResponse {
  status: "connected" | "disconnected" | "unknown"
  websocket: {
    url: string
    connected: boolean
    lastPing?: number
  }
  config: {
    analysisInterval: number
    minConfidence: number
    autoExecute: boolean
  }
  metrics?: {
    connectedClients: number
    uptime: number
    cyclesCompleted: number
  }
}

export async function GET() {
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080"

  // Try to check if WebSocket is available
  const response: AgentHealthResponse = {
    status: "unknown",
    websocket: {
      url: wsUrl,
      connected: false,
    },
    config: {
      analysisInterval: 30000,
      minConfidence: 70,
      autoExecute: true,
    },
  }

  // For server-side, we can't directly check WebSocket
  // The frontend should use this endpoint combined with actual WS connection status
  // We return the expected configuration

  return NextResponse.json({
    success: true,
    data: response,
    message: "Agent health status. Check WebSocket connection client-side for real-time status.",
  })
}
