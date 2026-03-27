"use client"

import { useReadContract, useChainId } from 'wagmi'
import { CHAIN_IDS, getChainMeta } from '@/lib/wagmi'

// Aave V3 Pool addresses per chain ID
// Source: contracts/script/config/*.json
const AAVE_POOL_ADDRESSES: Partial<Record<number, `0x${string}`>> = {
  [CHAIN_IDS.ETHEREUM]:  "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2",
  [CHAIN_IDS.BSC]:       "0x6807dc923806fE8Fd134338EABCA509979a7e0cB",
  [CHAIN_IDS.BASE]:      "0xA238Dd80C259a72e81d7e4664a9801593F98d1c5",
  [CHAIN_IDS.ARBITRUM]:  "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
  [CHAIN_IDS.POLYGON]:   "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
  // Testnets
  [CHAIN_IDS.SEPOLIA]:         "0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951",
  [CHAIN_IDS.BASE_SEPOLIA]:    "0x07eA79F68B2B3df564D0A34F8e19D9B1e339814b",
  [CHAIN_IDS.ARBITRUM_SEPOLIA]:"0xBfC91D59fdAA134A4ED45f7B28502d3E9d9F3192",
  [CHAIN_IDS.POLYGON_AMOY]:    "0x0b913A76beFF3887d611050b5e2D4a3aBBCf19a2",
}

// USDC addresses per chain ID (the asset we query for yield)
const USDC_ADDRESSES: Partial<Record<number, `0x${string}`>> = {
  [CHAIN_IDS.ETHEREUM]:  "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  [CHAIN_IDS.BSC]:       "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
  [CHAIN_IDS.BASE]:      "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  [CHAIN_IDS.ARBITRUM]:  "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  [CHAIN_IDS.POLYGON]:   "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
  // Testnets
  [CHAIN_IDS.SEPOLIA]:         "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8",
  [CHAIN_IDS.BASE_SEPOLIA]:    "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  [CHAIN_IDS.ARBITRUM_SEPOLIA]:"0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
  [CHAIN_IDS.POLYGON_AMOY]:    "0x52D800ca262dc7C3D1F72A80D3E78E0636A23B33",
}

// Minimal ABI: only the fields we need from getReserveData
// currentLiquidityRate is at index 2 in the returned struct
const AAVE_POOL_ABI = [
  {
    name: "getReserveData",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "asset", type: "address" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "configuration", type: "uint256" },
          { name: "liquidityIndex", type: "uint128" },
          { name: "currentLiquidityRate", type: "uint128" }, // RAY = 1e27
          { name: "variableBorrowIndex", type: "uint128" },
          { name: "currentVariableBorrowRate", type: "uint128" }, // RAY = 1e27
          { name: "currentStableBorrowRate", type: "uint128" },
          { name: "lastUpdateTimestamp", type: "uint40" },
          { name: "id", type: "uint16" },
          { name: "aTokenAddress", type: "address" },
          { name: "stableDebtTokenAddress", type: "address" },
          { name: "variableDebtTokenAddress", type: "address" },
          { name: "interestRateStrategyAddress", type: "address" },
          { name: "accruedToTreasury", type: "uint128" },
          { name: "unbacked", type: "uint128" },
          { name: "isolationModeTotalDebt", type: "uint128" },
        ],
      },
    ],
  },
] as const

// Convert a RAY-denominated rate (1e27) to an APY percentage string
// Formula: apy% = currentLiquidityRate / 1e25  (moves decimal 2 places for %)
function rayToAPYPercent(ray: bigint): string {
  // ray / 1e25 = percentage with 2 decimal places
  // e.g. 42500000000000000000000000n / 1e25 = 4.25
  const scaled = Number(ray) / 1e25
  return scaled.toFixed(2)
}

// Simulated fallback rates (shown when Aave read unavailable or returns garbage)
const SIMULATED_RATES: Record<string, { supply: string; borrow: string }> = {
  USDC: { supply: "4.25", borrow: "6.50" },
  USDT: { supply: "3.80", borrow: "5.90" },
  WETH: { supply: "2.10", borrow: "4.20" },
  DAI:  { supply: "4.00", borrow: "6.00" },
}

export function useYieldAPY(asset: string = "USDC") {
  const chainId = useChainId()
  const meta = getChainMeta(chainId)
  const supportsAave = meta?.hasAave ?? false

  const poolAddress = AAVE_POOL_ADDRESSES[chainId]
  const usdcAddress = USDC_ADDRESSES[chainId]

  // Only query USDC for now; other assets fall back to simulated
  const canQuery = supportsAave && asset === "USDC" && !!poolAddress && !!usdcAddress

  const { data, isLoading, error, refetch } = useReadContract({
    address: poolAddress,
    abi: AAVE_POOL_ABI,
    functionName: "getReserveData",
    args: usdcAddress ? [usdcAddress] : undefined,
    query: { enabled: canQuery },
  })

  const fallback = SIMULATED_RATES[asset] ?? SIMULATED_RATES.USDC

  // If we have live data, derive rates from it
  if (canQuery && data && !error) {
    const reserveData = data as {
      currentLiquidityRate: bigint
      currentVariableBorrowRate: bigint
    }
    const supplyAPY = rayToAPYPercent(reserveData.currentLiquidityRate)
    const borrowAPY = rayToAPYPercent(reserveData.currentVariableBorrowRate)

    // Sanity check: testnet Aave pools often have absurd rates.
    // If supply APY > 20%, treat as unreliable and fall back to simulated.
    const supplyNum = parseFloat(supplyAPY)
    if (supplyNum > 20 || supplyNum < 0) {
      // Fall through to simulated data below
    } else {
      return {
        supplyAPY,
        borrowAPY,
        availableLiquidity: "0.00",
        isLoading,
        error: null,
        refetch,
        isLive: true,
        isSimulated: false,
      }
    }
  }

  // Fallback: simulated data (SKALE, unsupported chains, read errors, non-USDC assets)
  return {
    supplyAPY: fallback.supply,
    borrowAPY: fallback.borrow,
    availableLiquidity: "1000000.00",
    isLoading: canQuery ? isLoading : false,
    error: canQuery ? (error ?? null) : null,
    refetch: canQuery ? refetch : () => Promise.resolve(),
    isLive: false,
    isSimulated: true,
  }
}

// Hook to get multiple asset APYs
// USDC gets live Aave data when available; others are always simulated
export function useYieldMarkets() {
  const usdc = useYieldAPY("USDC")
  const usdt = useYieldAPY("USDT")
  const weth = useYieldAPY("WETH")
  const dai  = useYieldAPY("DAI")

  return {
    USDC: usdc,
    USDT: usdt,
    WETH: weth,
    DAI:  dai,
    isLoading: usdc.isLoading,
    hasLiveData: usdc.isLive,
    isSimulated: usdc.isSimulated,
  }
}

