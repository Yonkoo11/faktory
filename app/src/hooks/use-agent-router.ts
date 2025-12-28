"use client"

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useChainId } from "wagmi"
import { AgentRouterABI, type AgentDecision, type AgentConfig, Strategy } from "@/lib/contracts/abis"
import { getAgentRouterAddress } from "@/lib/contracts/addresses"

export function useAgentRouter() {
  const chainId = useChainId()
  const contractAddress = getAgentRouterAddress(chainId)

  // Get agent config
  const { data: config, refetch: refetchConfig } = useReadContract({
    address: contractAddress,
    abi: AgentRouterABI,
    functionName: "getConfig",
  })

  // Get total decisions
  const { data: totalDecisions, refetch: refetchTotal } = useReadContract({
    address: contractAddress,
    abi: AgentRouterABI,
    functionName: "totalDecisions",
  })

  const formattedConfig = config
    ? {
        minConfidence: Number(config.minConfidence),
        maxGasPrice: config.maxGasPrice,
        autoExecute: config.autoExecute,
        active: config.active,
      }
    : null

  return {
    contractAddress,
    config: formattedConfig,
    totalDecisions: totalDecisions ? Number(totalDecisions) : 0,
    refetch: () => {
      refetchConfig()
      refetchTotal()
    },
  }
}

export function useAgentDecisions(tokenId: bigint | number | undefined) {
  const chainId = useChainId()
  const contractAddress = getAgentRouterAddress(chainId)

  // Get decision history
  const { data: decisions, isLoading, refetch } = useReadContract({
    address: contractAddress,
    abi: AgentRouterABI,
    functionName: "getDecisionHistory",
    args: tokenId !== undefined ? [BigInt(tokenId)] : undefined,
    query: { enabled: tokenId !== undefined },
  })

  // Get latest decision
  const { data: latestDecision } = useReadContract({
    address: contractAddress,
    abi: AgentRouterABI,
    functionName: "getLatestDecision",
    args: tokenId !== undefined ? [BigInt(tokenId)] : undefined,
    query: { enabled: tokenId !== undefined },
  })

  // Get decision count
  const { data: decisionCount } = useReadContract({
    address: contractAddress,
    abi: AgentRouterABI,
    functionName: "getDecisionCount",
    args: tokenId !== undefined ? [BigInt(tokenId)] : undefined,
    query: { enabled: tokenId !== undefined },
  })

  const formattedDecisions = decisions
    ? decisions.map((d) => ({
        tokenId: d.tokenId,
        recommendedStrategy: d.recommendedStrategy as Strategy,
        strategyLabel: getStrategyLabel(d.recommendedStrategy as Strategy),
        reasoning: d.reasoning,
        confidence: Number(d.confidence),
        timestamp: new Date(Number(d.timestamp) * 1000),
        executed: d.executed,
      }))
    : []

  const formattedLatest = latestDecision
    ? {
        tokenId: latestDecision.tokenId,
        recommendedStrategy: latestDecision.recommendedStrategy as Strategy,
        strategyLabel: getStrategyLabel(latestDecision.recommendedStrategy as Strategy),
        reasoning: latestDecision.reasoning,
        confidence: Number(latestDecision.confidence),
        timestamp: new Date(Number(latestDecision.timestamp) * 1000),
        executed: latestDecision.executed,
      }
    : null

  return {
    decisions: formattedDecisions,
    latestDecision: formattedLatest,
    decisionCount: decisionCount ? Number(decisionCount) : 0,
    isLoading,
    refetch,
  }
}

export function useRequestAnalysis() {
  const chainId = useChainId()
  const contractAddress = getAgentRouterAddress(chainId)

  const { writeContract, data: hash, isPending, error } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const requestAnalysis = async (tokenId: bigint) => {
    writeContract({
      address: contractAddress,
      abi: AgentRouterABI,
      functionName: "requestAnalysis",
      args: [tokenId],
    })
  }

  return {
    requestAnalysis,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  }
}

export function useNeedsAnalysis(tokenId: bigint | number | undefined, maxAge: number = 3600) {
  const chainId = useChainId()
  const contractAddress = getAgentRouterAddress(chainId)

  const { data: needsAnalysis, refetch } = useReadContract({
    address: contractAddress,
    abi: AgentRouterABI,
    functionName: "needsAnalysis",
    args: tokenId !== undefined ? [BigInt(tokenId), BigInt(maxAge)] : undefined,
    query: { enabled: tokenId !== undefined },
  })

  const { data: lastAnalysis } = useReadContract({
    address: contractAddress,
    abi: AgentRouterABI,
    functionName: "lastAnalysis",
    args: tokenId !== undefined ? [BigInt(tokenId)] : undefined,
    query: { enabled: tokenId !== undefined },
  })

  return {
    needsAnalysis: needsAnalysis ?? true,
    lastAnalysis: lastAnalysis ? new Date(Number(lastAnalysis) * 1000) : null,
    refetch,
  }
}

export function useIsAgentAuthorized(agentAddress: `0x${string}` | undefined) {
  const chainId = useChainId()
  const contractAddress = getAgentRouterAddress(chainId)

  const { data: isAuthorized, refetch } = useReadContract({
    address: contractAddress,
    abi: AgentRouterABI,
    functionName: "isAgentAuthorized",
    args: agentAddress ? [agentAddress] : undefined,
    query: { enabled: !!agentAddress },
  })

  return {
    isAuthorized: isAuthorized ?? false,
    refetch,
  }
}

// Helper function to get strategy label
function getStrategyLabel(strategy: Strategy): string {
  const labels: Record<Strategy, string> = {
    [Strategy.Hold]: "Hold",
    [Strategy.Conservative]: "Conservative",
    [Strategy.Aggressive]: "Aggressive",
  }
  return labels[strategy] || "Unknown"
}
