// Contract ABIs for Faktory Protocol
// Generated from contracts/src/*.sol

export const InvoiceNFTABI = [
  // Core functions
  {
    name: "mint",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "dataCommitment", type: "bytes32" },
      { name: "amountCommitment", type: "bytes32" },
      { name: "dueDate", type: "uint256" },
    ],
    outputs: [{ name: "tokenId", type: "uint256" }],
  },
  {
    name: "updateStatus",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "tokenId", type: "uint256" },
      { name: "newStatus", type: "uint8" },
    ],
    outputs: [],
  },
  {
    name: "updateRiskMetrics",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "tokenId", type: "uint256" },
      { name: "riskScore", type: "uint8" },
      { name: "paymentProbability", type: "uint8" },
    ],
    outputs: [],
  },
  {
    name: "authorizeReveal",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "tokenId", type: "uint256" },
      { name: "authorized", type: "address" },
    ],
    outputs: [],
  },
  {
    name: "verifyReveal",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "tokenId", type: "uint256" },
      { name: "invoiceData", type: "bytes" },
      { name: "salt", type: "bytes32" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  // View functions
  {
    name: "getInvoice",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "dataCommitment", type: "bytes32" },
          { name: "amountCommitment", type: "bytes32" },
          { name: "dueDate", type: "uint256" },
          { name: "createdAt", type: "uint256" },
          { name: "issuer", type: "address" },
          { name: "status", type: "uint8" },
          { name: "riskScore", type: "uint8" },
          { name: "paymentProbability", type: "uint8" },
        ],
      },
    ],
  },
  {
    name: "getDaysUntilDue",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "int256" }],
  },
  {
    name: "isActive",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "totalInvoices",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "getActiveInvoices",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256[]" }],
  },
  // ERC721 functions
  {
    name: "ownerOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "address" }],
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "tokenOfOwnerByIndex",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "index", type: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "tokenId", type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "setApprovalForAll",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "operator", type: "address" },
      { name: "approved", type: "bool" },
    ],
    outputs: [],
  },
  {
    name: "transferFrom",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "tokenId", type: "uint256" },
    ],
    outputs: [],
  },
  // State variables
  {
    name: "yieldVault",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    name: "invoices",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [
      { name: "dataCommitment", type: "bytes32" },
      { name: "amountCommitment", type: "bytes32" },
      { name: "dueDate", type: "uint256" },
      { name: "createdAt", type: "uint256" },
      { name: "issuer", type: "address" },
      { name: "status", type: "uint8" },
      { name: "riskScore", type: "uint8" },
      { name: "paymentProbability", type: "uint8" },
    ],
  },
  // Events
  {
    name: "InvoiceMinted",
    type: "event",
    inputs: [
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "issuer", type: "address", indexed: true },
      { name: "dataCommitment", type: "bytes32", indexed: false },
      { name: "dueDate", type: "uint256", indexed: false },
    ],
  },
  {
    name: "InvoiceStatusUpdated",
    type: "event",
    inputs: [
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "oldStatus", type: "uint8", indexed: false },
      { name: "newStatus", type: "uint8", indexed: false },
    ],
  },
  {
    name: "RiskScoreUpdated",
    type: "event",
    inputs: [
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "riskScore", type: "uint8", indexed: false },
      { name: "paymentProbability", type: "uint8", indexed: false },
    ],
  },
] as const

export const YieldVaultABI = [
  // Core functions
  {
    name: "deposit",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "tokenId", type: "uint256" },
      { name: "strategy", type: "uint8" },
      { name: "simulatedPrincipal", type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "withdraw",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [],
  },
  {
    name: "changeStrategy",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "tokenId", type: "uint256" },
      { name: "newStrategy", type: "uint8" },
    ],
    outputs: [],
  },
  {
    name: "executeAgentAction",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "tokenId", type: "uint256" },
      { name: "strategy", type: "uint8" },
      { name: "actionDescription", type: "string" },
    ],
    outputs: [],
  },
  {
    name: "updateAllYields",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  // View functions
  {
    name: "getDeposit",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "tokenId", type: "uint256" },
          { name: "owner", type: "address" },
          { name: "strategy", type: "uint8" },
          { name: "depositTime", type: "uint256" },
          { name: "principal", type: "uint256" },
          { name: "accruedYield", type: "uint256" },
          { name: "lastYieldUpdate", type: "uint256" },
          { name: "active", type: "bool" },
        ],
      },
    ],
  },
  {
    name: "getAccruedYield",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "getActiveDeposits",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256[]" }],
  },
  {
    name: "getActiveDepositsCount",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "getStrategyName",
    type: "function",
    stateMutability: "pure",
    inputs: [{ name: "strategy", type: "uint8" }],
    outputs: [{ name: "", type: "string" }],
  },
  {
    name: "deposits",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [
      { name: "tokenId", type: "uint256" },
      { name: "owner", type: "address" },
      { name: "strategy", type: "uint8" },
      { name: "depositTime", type: "uint256" },
      { name: "principal", type: "uint256" },
      { name: "accruedYield", type: "uint256" },
      { name: "lastYieldUpdate", type: "uint256" },
      { name: "active", type: "bool" },
    ],
  },
  // Constants
  {
    name: "HOLD_APY",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "CONSERVATIVE_APY",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "AGGRESSIVE_APY",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "totalValueLocked",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "totalYieldGenerated",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "invoiceNFT",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    name: "agentRouter",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  // Events
  {
    name: "Deposited",
    type: "event",
    inputs: [
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "owner", type: "address", indexed: true },
      { name: "strategy", type: "uint8", indexed: false },
      { name: "principal", type: "uint256", indexed: false },
    ],
  },
  {
    name: "Withdrawn",
    type: "event",
    inputs: [
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "owner", type: "address", indexed: true },
      { name: "principal", type: "uint256", indexed: false },
      { name: "yield", type: "uint256", indexed: false },
    ],
  },
  {
    name: "StrategyChanged",
    type: "event",
    inputs: [
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "oldStrategy", type: "uint8", indexed: false },
      { name: "newStrategy", type: "uint8", indexed: false },
    ],
  },
  {
    name: "YieldAccrued",
    type: "event",
    inputs: [
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "yield", type: "uint256", indexed: false },
      { name: "totalAccrued", type: "uint256", indexed: false },
    ],
  },
  {
    name: "AgentAction",
    type: "event",
    inputs: [
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "action", type: "string", indexed: false },
      { name: "data", type: "bytes", indexed: false },
    ],
  },
] as const

export const AgentRouterABI = [
  // Core functions
  {
    name: "recordDecision",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "tokenId", type: "uint256" },
      { name: "strategy", type: "uint8" },
      { name: "confidence", type: "uint256" },
      { name: "reasoning", type: "string" },
    ],
    outputs: [{ name: "decisionIndex", type: "uint256" }],
  },
  {
    name: "executeDecision",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "tokenId", type: "uint256" },
      { name: "decisionIndex", type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "batchRecordAndExecute",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "tokenIds", type: "uint256[]" },
      { name: "strategies", type: "uint8[]" },
      { name: "confidences", type: "uint256[]" },
      { name: "reasonings", type: "string[]" },
    ],
    outputs: [],
  },
  {
    name: "requestAnalysis",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [],
  },
  // Admin functions
  {
    name: "authorizeAgent",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "agent", type: "address" }],
    outputs: [],
  },
  {
    name: "deauthorizeAgent",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "agent", type: "address" }],
    outputs: [],
  },
  {
    name: "updateConfig",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "minConfidence", type: "uint256" },
      { name: "maxGasPrice", type: "uint256" },
      { name: "autoExecute", type: "bool" },
    ],
    outputs: [],
  },
  {
    name: "setActive",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "active", type: "bool" }],
    outputs: [],
  },
  // View functions
  {
    name: "getDecisionHistory",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        components: [
          { name: "tokenId", type: "uint256" },
          { name: "recommendedStrategy", type: "uint8" },
          { name: "reasoning", type: "string" },
          { name: "confidence", type: "uint256" },
          { name: "timestamp", type: "uint256" },
          { name: "executed", type: "bool" },
        ],
      },
    ],
  },
  {
    name: "getLatestDecision",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "tokenId", type: "uint256" },
          { name: "recommendedStrategy", type: "uint8" },
          { name: "reasoning", type: "string" },
          { name: "confidence", type: "uint256" },
          { name: "timestamp", type: "uint256" },
          { name: "executed", type: "bool" },
        ],
      },
    ],
  },
  {
    name: "getDecisionCount",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "isAgentAuthorized",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "agent", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "getConfig",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "minConfidence", type: "uint256" },
          { name: "maxGasPrice", type: "uint256" },
          { name: "autoExecute", type: "bool" },
          { name: "active", type: "bool" },
        ],
      },
    ],
  },
  {
    name: "needsAnalysis",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "tokenId", type: "uint256" },
      { name: "maxAge", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "totalDecisions",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "lastAnalysis",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "authorizedAgents",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "agent", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "config",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { name: "minConfidence", type: "uint256" },
      { name: "maxGasPrice", type: "uint256" },
      { name: "autoExecute", type: "bool" },
      { name: "active", type: "bool" },
    ],
  },
  // Events
  {
    name: "AgentAuthorized",
    type: "event",
    inputs: [{ name: "agent", type: "address", indexed: true }],
  },
  {
    name: "AgentDeauthorized",
    type: "event",
    inputs: [{ name: "agent", type: "address", indexed: true }],
  },
  {
    name: "DecisionRecorded",
    type: "event",
    inputs: [
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "strategy", type: "uint8", indexed: false },
      { name: "confidence", type: "uint256", indexed: false },
      { name: "reasoning", type: "string", indexed: false },
    ],
  },
  {
    name: "DecisionExecuted",
    type: "event",
    inputs: [
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "strategy", type: "uint8", indexed: false },
      { name: "executor", type: "address", indexed: true },
    ],
  },
  {
    name: "AnalysisRequested",
    type: "event",
    inputs: [
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "requester", type: "address", indexed: true },
    ],
  },
  {
    name: "ConfigUpdated",
    type: "event",
    inputs: [
      { name: "minConfidence", type: "uint256", indexed: false },
      { name: "maxGasPrice", type: "uint256", indexed: false },
      { name: "autoExecute", type: "bool", indexed: false },
    ],
  },
] as const

// Enum types matching the contracts
export enum InvoiceStatus {
  Active = 0,
  InYield = 1,
  Paid = 2,
  Defaulted = 3,
  Cancelled = 4,
}

export enum Strategy {
  Hold = 0,
  Conservative = 1,
  Aggressive = 2,
}

// Type helpers
export type Invoice = {
  dataCommitment: `0x${string}`
  amountCommitment: `0x${string}`
  dueDate: bigint
  createdAt: bigint
  issuer: `0x${string}`
  status: InvoiceStatus
  riskScore: number
  paymentProbability: number
}

export type Deposit = {
  tokenId: bigint
  owner: `0x${string}`
  strategy: Strategy
  depositTime: bigint
  principal: bigint
  accruedYield: bigint
  lastYieldUpdate: bigint
  active: boolean
}

export type AgentDecision = {
  tokenId: bigint
  recommendedStrategy: Strategy
  reasoning: string
  confidence: bigint
  timestamp: bigint
  executed: boolean
}

export type AgentConfig = {
  minConfidence: bigint
  maxGasPrice: bigint
  autoExecute: boolean
  active: boolean
}
