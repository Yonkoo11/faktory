// Contract ABIs

export const InvoiceNFTABI = [
  {
    type: 'function',
    name: 'mint',
    inputs: [
      { name: 'dataCommitment', type: 'bytes32' },
      { name: 'amountCommitment', type: 'bytes32' },
      { name: 'dueDate', type: 'uint256' },
    ],
    outputs: [{ name: 'tokenId', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getInvoice',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [
      {
        type: 'tuple',
        components: [
          { name: 'dataCommitment', type: 'bytes32' },
          { name: 'amountCommitment', type: 'bytes32' },
          { name: 'dueDate', type: 'uint256' },
          { name: 'createdAt', type: 'uint256' },
          { name: 'issuer', type: 'address' },
          { name: 'status', type: 'uint8' },
          { name: 'riskScore', type: 'uint8' },
          { name: 'paymentProbability', type: 'uint8' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'totalInvoices',
    inputs: [],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getActiveInvoices',
    inputs: [],
    outputs: [{ type: 'uint256[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'ownerOf',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'approve',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getDaysUntilDue',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ type: 'int256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'InvoiceMinted',
    inputs: [
      { name: 'tokenId', type: 'uint256', indexed: true },
      { name: 'issuer', type: 'address', indexed: true },
      { name: 'dataCommitment', type: 'bytes32', indexed: false },
      { name: 'dueDate', type: 'uint256', indexed: false },
    ],
  },
] as const;

export const YieldVaultABI = [
  {
    type: 'function',
    name: 'deposit',
    inputs: [
      { name: 'tokenId', type: 'uint256' },
      { name: 'strategy', type: 'uint8' },
      { name: 'simulatedPrincipal', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'withdraw',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getDeposit',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [
      {
        type: 'tuple',
        components: [
          { name: 'tokenId', type: 'uint256' },
          { name: 'owner', type: 'address' },
          { name: 'strategy', type: 'uint8' },
          { name: 'depositTime', type: 'uint256' },
          { name: 'principal', type: 'uint256' },
          { name: 'accruedYield', type: 'uint256' },
          { name: 'lastYieldUpdate', type: 'uint256' },
          { name: 'active', type: 'bool' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getAccruedYield',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getActiveDeposits',
    inputs: [],
    outputs: [{ type: 'uint256[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'totalValueLocked',
    inputs: [],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'totalYieldGenerated',
    inputs: [],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getActiveDepositsCount',
    inputs: [],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'HOLD_APY',
    inputs: [],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'CONSERVATIVE_APY',
    inputs: [],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'AGGRESSIVE_APY',
    inputs: [],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'changeStrategy',
    inputs: [
      { name: 'tokenId', type: 'uint256' },
      { name: 'newStrategy', type: 'uint8' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    name: 'Deposited',
    inputs: [
      { name: 'tokenId', type: 'uint256', indexed: true },
      { name: 'owner', type: 'address', indexed: true },
      { name: 'strategy', type: 'uint8', indexed: false },
      { name: 'principal', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'StrategyChanged',
    inputs: [
      { name: 'tokenId', type: 'uint256', indexed: true },
      { name: 'oldStrategy', type: 'uint8', indexed: false },
      { name: 'newStrategy', type: 'uint8', indexed: false },
    ],
  },
] as const;

export const PrivacyRegistryABI = [
  {
    type: 'function',
    name: 'registerCommitment',
    inputs: [{ name: 'commitment', type: 'bytes32' }],
    outputs: [{ name: 'commitmentId', type: 'bytes32' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'verifyCommitment',
    inputs: [
      { name: 'commitmentId', type: 'bytes32' },
      { name: 'data', type: 'bytes' },
      { name: 'salt', type: 'bytes32' },
    ],
    outputs: [{ type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'computeCommitment',
    inputs: [
      { name: 'data', type: 'bytes' },
      { name: 'salt', type: 'bytes32' },
    ],
    outputs: [{ type: 'bytes32' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    name: 'isVerified',
    inputs: [{ name: 'invoiceHash', type: 'bytes32' }],
    outputs: [{ type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getMerkleRoot',
    inputs: [],
    outputs: [{ type: 'bytes32' }],
    stateMutability: 'view',
  },
] as const;

export const AgentRouterABI = [
  {
    type: 'function',
    name: 'getDecisionHistory',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [
      {
        type: 'tuple[]',
        components: [
          { name: 'tokenId', type: 'uint256' },
          { name: 'recommendedStrategy', type: 'uint8' },
          { name: 'reasoning', type: 'string' },
          { name: 'confidence', type: 'uint256' },
          { name: 'timestamp', type: 'uint256' },
          { name: 'executed', type: 'bool' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getLatestDecision',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [
      {
        type: 'tuple',
        components: [
          { name: 'tokenId', type: 'uint256' },
          { name: 'recommendedStrategy', type: 'uint8' },
          { name: 'reasoning', type: 'string' },
          { name: 'confidence', type: 'uint256' },
          { name: 'timestamp', type: 'uint256' },
          { name: 'executed', type: 'bool' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'totalDecisions',
    inputs: [],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'DecisionRecorded',
    inputs: [
      { name: 'tokenId', type: 'uint256', indexed: true },
      { name: 'strategy', type: 'uint8', indexed: false },
      { name: 'confidence', type: 'uint256', indexed: false },
      { name: 'reasoning', type: 'string', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'DecisionExecuted',
    inputs: [
      { name: 'tokenId', type: 'uint256', indexed: true },
      { name: 'strategy', type: 'uint8', indexed: false },
      { name: 'executor', type: 'address', indexed: true },
    ],
  },
] as const;

// Strategy enum
export const Strategy = {
  Hold: 0,
  Conservative: 1,
  Aggressive: 2,
} as const;

export const StrategyNames = ['Hold', 'Conservative', 'Aggressive'] as const;

// Invoice status enum
export const InvoiceStatus = {
  Active: 0,
  InYield: 1,
  Paid: 2,
  Defaulted: 3,
  Cancelled: 4,
} as const;

export const InvoiceStatusNames = ['Active', 'In Yield', 'Paid', 'Defaulted', 'Cancelled'] as const;
