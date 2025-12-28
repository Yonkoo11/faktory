"use client"

import { useReadContract } from "wagmi"
import { formatUnits } from "viem"

// Lendle Protocol Data Provider ABI (Aave V2 compatible)
const LendleDataProviderABI = [
  {
    name: "getReserveData",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "asset", type: "address" }],
    outputs: [
      { name: "availableLiquidity", type: "uint256" },
      { name: "totalStableDebt", type: "uint256" },
      { name: "totalVariableDebt", type: "uint256" },
      { name: "liquidityRate", type: "uint256" },
      { name: "variableBorrowRate", type: "uint256" },
      { name: "stableBorrowRate", type: "uint256" },
      { name: "averageStableBorrowRate", type: "uint256" },
      { name: "liquidityIndex", type: "uint256" },
      { name: "variableBorrowIndex", type: "uint256" },
      { name: "lastUpdateTimestamp", type: "uint40" },
    ],
  },
  {
    name: "getAllReservesTokens",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        components: [
          { name: "symbol", type: "string" },
          { name: "tokenAddress", type: "address" },
        ],
      },
    ],
  },
] as const

// Lendle addresses on Mantle Mainnet (for reading real APY data)
// NOTE: This hook always reads from Mantle Mainnet (5000) to show real market rates
// regardless of what chain the user is connected to
const LENDLE_DATA_PROVIDER = "0x552b9e4bae485C4B7F540777d7D25614CdB84773" as const
const MANTLE_MAINNET_CHAIN_ID = 5000

// Common assets on Lendle
const ASSETS = {
  USDC: "0x09Bc4E0D864854c6aFB6eB9A9cdF58aC190D0dF9", // USDC on Mantle
  USDT: "0x201EBa5CC46D216Ce6DC03F6a759e8E766e956aE", // USDT on Mantle
  WETH: "0xdEAddEaDdeadDEadDEADDEAddEADDEAddead1111", // WETH on Mantle
  WMNT: "0x78c1b0C915c4FAA5FffA6CAbf0219DA63d7f4cb8", // WMNT on Mantle
} as const

// RAY = 10^27 (Aave uses RAY for interest rates)
const RAY = BigInt(10 ** 27)

export function useLendleAPY(asset: keyof typeof ASSETS = "USDC") {
  const { data: reserveData, isLoading, error, refetch } = useReadContract({
    address: LENDLE_DATA_PROVIDER,
    abi: LendleDataProviderABI,
    functionName: "getReserveData",
    args: [ASSETS[asset]],
    chainId: MANTLE_MAINNET_CHAIN_ID, // Always read from Mantle Mainnet for real rates
  })

  // Convert liquidityRate from RAY to percentage
  // liquidityRate is in RAY (27 decimals), APY = rate / 10^27 * 100
  const supplyAPY = reserveData
    ? Number(reserveData[3]) / Number(RAY) * 100
    : null

  const borrowAPY = reserveData
    ? Number(reserveData[4]) / Number(RAY) * 100
    : null

  return {
    supplyAPY: supplyAPY ? supplyAPY.toFixed(2) : null,
    borrowAPY: borrowAPY ? borrowAPY.toFixed(2) : null,
    availableLiquidity: reserveData ? formatUnits(reserveData[0], 6) : null, // USDC has 6 decimals
    isLoading,
    error,
    refetch,
    isLive: !!reserveData, // Indicates we got real data
  }
}

// Hook to get multiple asset APYs
export function useLendleMarkets() {
  const usdc = useLendleAPY("USDC")
  const usdt = useLendleAPY("USDT")
  const weth = useLendleAPY("WETH")

  return {
    USDC: usdc,
    USDT: usdt,
    WETH: weth,
    isLoading: usdc.isLoading || usdt.isLoading || weth.isLoading,
    hasLiveData: usdc.isLive || usdt.isLive || weth.isLive,
  }
}
