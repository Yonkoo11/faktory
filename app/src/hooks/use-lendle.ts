"use client"

// Simulated APY data for Cronos x402 PayTech Hackathon demo
// In production, this would integrate with a real Cronos DeFi protocol

export function useLendleAPY(asset: string = "USDC") {
  // Return simulated APY data for demo
  const simulatedRates: Record<string, { supply: string; borrow: string }> = {
    USDC: { supply: "4.25", borrow: "6.50" },
    USDT: { supply: "3.80", borrow: "5.90" },
    WETH: { supply: "2.10", borrow: "4.20" },
    CRO: { supply: "5.50", borrow: "8.00" },
  }

  const rates = simulatedRates[asset] || simulatedRates.USDC

  return {
    supplyAPY: rates.supply,
    borrowAPY: rates.borrow,
    availableLiquidity: "1000000.00", // Simulated
    isLoading: false,
    error: null,
    refetch: () => Promise.resolve(),
    isLive: false, // Indicates simulated data
    isSimulated: true,
  }
}

// Hook to get multiple asset APYs
export function useLendleMarkets() {
  const usdc = useLendleAPY("USDC")
  const usdt = useLendleAPY("USDT")
  const weth = useLendleAPY("WETH")
  const cro = useLendleAPY("CRO")

  return {
    USDC: usdc,
    USDT: usdt,
    WETH: weth,
    CRO: cro,
    isLoading: false,
    hasLiveData: false,
    isSimulated: true,
  }
}
