# Faktory - Technical MVP Documentation

> Turn Invoices into Yield. Automatically.

**Version**: 1.0.0-mvp
**Network**: Mantle Sepolia (Testnet) / Mantle Mainnet
**Last Updated**: December 2024

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Architecture](#2-system-architecture)
3. [Smart Contracts](#3-smart-contracts)
4. [Agent Service](#4-agent-service)
5. [Frontend Application](#5-frontend-application)
6. [Privacy Layer](#6-privacy-layer)
7. [API Reference](#7-api-reference)
8. [Deployment Guide](#8-deployment-guide)
9. [Configuration](#9-configuration)
10. [Testing](#10-testing)
11. [Security Considerations](#11-security-considerations)
12. [Future Roadmap](#12-future-roadmap)

---

## 1. Executive Summary

### 1.1 Problem Statement

Small businesses and freelancers face a $3T+ global cash flow problem: invoices typically have 30-90 day payment terms, leaving capital locked while waiting for payment. Traditional invoice factoring is expensive (2-5% fees), bureaucratic, and exposes sensitive business data.

### 1.2 Solution

Faktory tokenizes invoices as Real-World Assets (RWAs) on Mantle Network, then deploys an autonomous AI agent to:

- **Optimize yield** on tokenized invoices (3-8% APY)
- **Protect privacy** using cryptographic commitments
- **Automate management** with continuous AI-driven strategy optimization
- **Reduce costs** by leveraging Mantle's low gas fees

### 1.3 Key Innovation

The "Living Agent" architecture streams AI reasoning in real-time via WebSocket, allowing users to observe the agent's decision-making process as it analyzes invoices and executes yield strategies.

### 1.4 Track Alignment

| Track | Implementation |
|-------|---------------|
| **RWA/RealFi** | Invoice NFTs as yield-generating real-world assets |
| **AI & Oracles** | Autonomous agent with oracle-fed risk assessment |
| **ZK & Privacy** | Hash commitments + Merkle proofs (ZK-ready architecture) |

---

## 2. System Architecture

### 2.1 High-Level Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER INTERFACE                                  │
│                           (Next.js Frontend)                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Invoice   │  │  Portfolio  │  │    Stats    │  │   Agent Activity    │ │
│  │    Form     │  │  Dashboard  │  │   Display   │  │   (Live Stream)     │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘ │
└─────────┼────────────────┼────────────────┼────────────────────┼────────────┘
          │                │                │                    │
          │ wagmi/viem     │                │                    │ WebSocket
          │                │                │                    │
┌─────────▼────────────────▼────────────────▼────────────────────┼────────────┐
│                         MANTLE NETWORK                         │            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │            │
│  │ InvoiceNFT  │  │ YieldVault  │  │  Privacy    │            │            │
│  │  (ERC-721)  │◄─┤             │  │  Registry   │            │            │
│  └─────────────┘  └──────┬──────┘  └─────────────┘            │            │
│                          │                                     │            │
│  ┌─────────────┐  ┌──────▼──────┐                             │            │
│  │ MockOracle  │  │ AgentRouter │◄────────────────────────────┘            │
│  └─────────────┘  └─────────────┘                                          │
└────────────────────────────────────────────────────────────────────────────┘
                                    ▲
                                    │ ethers.js
                                    │
┌───────────────────────────────────┴────────────────────────────────────────┐
│                           AGENT SERVICE                                     │
│                         (TypeScript/Node.js)                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐│
│  │  Optimizer  │  │     LLM     │  │  WebSocket  │  │    Blockchain       ││
│  │(Rule-based) │  │  (Claude)   │  │   Server    │  │     Service         ││
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────┘│
└────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow

```
1. TOKENIZATION FLOW
   User → InvoiceForm → InvoiceNFT.mint() → NFT Created
                      ↓
              PrivacyRegistry.registerCommitment()

2. YIELD FLOW
   User → Approve NFT → YieldVault.deposit() → Strategy Activated
                                 ↓
                      Agent monitors via getActiveDeposits()

3. AGENT DECISION FLOW
   Agent Loop → Fetch Invoice Data → Analyze Risk → Generate Recommendation
       ↓                                                    ↓
   WebSocket ←── Stream Reasoning ←── LLM Explanation ←────┘
       ↓
   AgentRouter.recordDecision() → YieldVault.executeAgentAction()

4. WITHDRAWAL FLOW
   User → YieldVault.withdraw() → NFT Returned + Yield Claimed
```

### 2.3 Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Network | Mantle Sepolia/Mainnet | Low-cost L2 execution |
| Contracts | Solidity 0.8.24 + Foundry | Smart contract development |
| Agent | TypeScript + Node.js | Autonomous agent runtime |
| LLM | Claude API (Haiku) | Natural language explanations |
| Frontend | Next.js 14 + React 19 | User interface |
| Web3 | wagmi + viem | Blockchain interactions |
| Styling | Tailwind CSS 4 | UI components |
| Real-time | WebSocket (ws) | Live agent streaming |

---

## 3. Smart Contracts

### 3.1 Contract Overview

| Contract | Address (Sepolia) | Purpose |
|----------|-------------------|---------|
| InvoiceNFT | TBD | ERC-721 invoice tokenization |
| YieldVault | TBD | Yield strategy management |
| PrivacyRegistry | TBD | Commitment + Merkle proofs |
| AgentRouter | TBD | Agent decision execution |
| MockOracle | TBD | Simulated risk data |

### 3.2 InvoiceNFT.sol

**Purpose**: Tokenizes invoices as ERC-721 NFTs with privacy-preserving metadata.

#### Data Structures

```solidity
struct Invoice {
    bytes32 dataCommitment;      // hash(invoiceData + salt)
    bytes32 amountCommitment;    // hash(amount + salt)
    uint256 dueDate;             // Unix timestamp
    uint256 createdAt;           // Mint timestamp
    address issuer;              // Original owner
    InvoiceStatus status;        // Active, InYield, Paid, etc.
    uint8 riskScore;             // 0-100 (from oracle)
    uint8 paymentProbability;    // 0-100 (from oracle)
}

enum InvoiceStatus {
    Active,     // Available for deposit
    InYield,    // Currently in YieldVault
    Paid,       // Invoice settled
    Defaulted,  // Payment failed
    Cancelled   // Invoice voided
}
```

#### Key Functions

| Function | Access | Description |
|----------|--------|-------------|
| `mint(dataCommitment, amountCommitment, dueDate)` | Public | Creates new invoice NFT |
| `updateStatus(tokenId, status)` | YieldVault/Owner | Updates invoice status |
| `updateRiskMetrics(tokenId, riskScore, paymentProb)` | Oracle/Agent | Updates risk data |
| `authorizeReveal(tokenId, address)` | Owner | Grants reveal permission |
| `verifyReveal(tokenId, data, salt)` | View | Verifies commitment reveal |
| `getActiveInvoices()` | View | Returns all active token IDs |

#### Events

```solidity
event InvoiceMinted(uint256 indexed tokenId, address indexed issuer, bytes32 dataCommitment, uint256 dueDate);
event InvoiceStatusUpdated(uint256 indexed tokenId, InvoiceStatus oldStatus, InvoiceStatus newStatus);
event RiskScoreUpdated(uint256 indexed tokenId, uint8 riskScore, uint8 paymentProbability);
event RevealAuthorized(uint256 indexed tokenId, address indexed authorizedAddress);
```

### 3.3 YieldVault.sol

**Purpose**: Manages yield strategies for deposited invoice NFTs.

#### Data Structures

```solidity
enum Strategy {
    Hold,           // 0% APY - No yield optimization
    Conservative,   // 3.5% APY - Low-risk lending
    Aggressive      // 7% APY - Higher-yield pools
}

struct Deposit {
    uint256 tokenId;
    address owner;
    Strategy strategy;
    uint256 depositTime;
    uint256 principal;        // Simulated value in wei
    uint256 accruedYield;     // Accumulated yield
    uint256 lastYieldUpdate;  // Last calculation timestamp
    bool active;
}
```

#### Key Functions

| Function | Access | Description |
|----------|--------|-------------|
| `deposit(tokenId, strategy, principal)` | NFT Owner | Deposits invoice for yield |
| `withdraw(tokenId)` | Deposit Owner | Withdraws NFT + claims yield |
| `changeStrategy(tokenId, strategy)` | Owner/Agent | Updates yield strategy |
| `executeAgentAction(tokenId, strategy, reason)` | AgentRouter | Agent-initiated change |
| `updateAllYields()` | Public | Batch updates yield accrual |
| `getAccruedYield(tokenId)` | View | Returns current yield |

#### Yield Calculation

```solidity
// APY rates in basis points (100 = 1%)
uint256 public constant HOLD_APY = 0;
uint256 public constant CONSERVATIVE_APY = 350;   // 3.5%
uint256 public constant AGGRESSIVE_APY = 700;     // 7%

// Yield formula
yield = (principal * apy * timeElapsed) / (365 days * 10000)
```

### 3.4 PrivacyRegistry.sol

**Purpose**: Manages cryptographic commitments and Merkle proofs for invoice privacy.

#### Commitment Scheme

```solidity
struct Commitment {
    bytes32 commitment;      // hash(data + salt)
    address owner;
    uint256 timestamp;
    bool revealed;
    bytes32 revealedHash;    // hash(revealed_data)
}

// Create commitment
commitment = keccak256(abi.encodePacked(data, salt))

// Verify reveal
computed = keccak256(abi.encodePacked(data, salt))
valid = (computed == stored_commitment)
```

#### Merkle Tree

- Verified invoices are added to a Merkle tree
- Root is stored on-chain and updated on each addition
- Inclusion proofs allow proving invoice validity without revealing details

#### Key Functions

| Function | Access | Description |
|----------|--------|-------------|
| `registerCommitment(commitment)` | Public | Registers new commitment |
| `revealCommitment(id, data, salt)` | Owner | Reveals commitment data |
| `verifyCommitment(id, data, salt)` | View | Verifies without revealing |
| `addVerifiedInvoice(hash)` | Verifier | Adds to Merkle tree |
| `verifyInclusion(hash, proof)` | View | Verifies Merkle proof |
| `computeCommitment(data, salt)` | Pure | Helper for frontend |

### 3.5 AgentRouter.sol

**Purpose**: Routes and executes AI agent decisions on-chain.

#### Data Structures

```solidity
struct AgentDecision {
    uint256 tokenId;
    Strategy recommendedStrategy;
    string reasoning;           // Human-readable explanation
    uint256 confidence;         // 0-100
    uint256 timestamp;
    bool executed;
}

struct AgentConfig {
    uint256 minConfidence;      // Minimum to auto-execute (default: 70)
    uint256 maxGasPrice;        // Max gas for execution
    bool autoExecute;           // Auto-execute high-confidence decisions
    bool active;                // Agent enabled/disabled
}
```

#### Key Functions

| Function | Access | Description |
|----------|--------|-------------|
| `recordDecision(tokenId, strategy, confidence, reasoning)` | Agent | Records agent decision |
| `executeDecision(tokenId, decisionIndex)` | Public | Manually execute decision |
| `batchRecordAndExecute(...)` | Agent | Batch operations |
| `authorizeAgent(address)` | Owner | Authorizes agent address |
| `updateConfig(...)` | Owner | Updates agent parameters |

### 3.6 MockOracle.sol

**Purpose**: Simulates off-chain risk assessment data for demo purposes.

#### Key Functions

| Function | Access | Description |
|----------|--------|-------------|
| `setRiskData(tokenId, riskScore, paymentProb)` | Provider | Sets risk metrics |
| `simulateRiskAssessment(tokenId)` | Public | Auto-generates risk data |
| `getRiskScore(tokenId)` | View | Returns risk score |
| `getPaymentProbability(tokenId)` | View | Returns payment probability |

#### Risk Simulation Logic

```solidity
// Risk varies based on days until due
if (daysUntilDue < 0)      → riskScore: 30, paymentProb: 40  // Overdue
if (daysUntilDue < 7)      → riskScore: 60, paymentProb: 70  // Due soon
if (daysUntilDue < 30)     → riskScore: 75, paymentProb: 85  // Medium term
if (daysUntilDue >= 30)    → riskScore: 85, paymentProb: 92  // Long term

// Plus pseudo-random variation of ±10
```

---

## 4. Agent Service

### 4.1 Architecture

```
agent/
├── src/
│   ├── index.ts          # Entry point
│   ├── agent.ts          # Main agent class
│   ├── optimizer.ts      # Rule-based strategy optimizer
│   ├── llm.ts            # LLM integration (Claude)
│   ├── websocket.ts      # WebSocket server
│   ├── blockchain.ts     # Contract interactions
│   └── types.ts          # TypeScript interfaces
├── package.json
└── tsconfig.json
```

### 4.2 Agent Loop

```typescript
class FaktoryAgent {
  async runLoop() {
    while (running) {
      // 1. Fetch active deposits
      const deposits = await blockchain.getActiveDeposits();

      // 2. Analyze each invoice
      for (const tokenId of deposits) {
        const analysis = await this.analyzeInvoice(tokenId);

        // 3. Stream reasoning via WebSocket
        await this.streamThoughts(analysis);

        // 4. Execute if conditions met
        if (analysis.shouldAct && config.autoExecute) {
          await this.executeDecision(analysis);
        }
      }

      // 5. Wait for next cycle
      await sleep(config.analysisInterval); // Default: 30s
    }
  }
}
```

### 4.3 Strategy Optimizer

The optimizer uses a rule-based scoring system:

```typescript
function optimizeStrategy(context: OptimizationContext): StrategyRecommendation {
  let score = 0;
  const factors: string[] = [];

  // Factor 1: Risk Score (0-100)
  if (riskScore >= 80) score += 30;      // High confidence
  else if (riskScore >= 60) score += 15; // Moderate
  else if (riskScore >= 40) score += 5;  // Below average
  else score -= 10;                       // High risk

  // Factor 2: Payment Probability
  if (paymentProb >= 90) score += 25;
  else if (paymentProb >= 75) score += 15;
  else if (paymentProb >= 50) score += 5;
  else score -= 15;

  // Factor 3: Time until due
  if (daysUntilDue >= 60) score += 20;   // Long duration
  else if (daysUntilDue >= 30) score += 15;
  else if (daysUntilDue >= 14) score += 5;
  else if (daysUntilDue < 0) score -= 30; // Overdue

  // Strategy selection
  if (score >= 60) return Strategy.Aggressive;
  if (score >= 30) return Strategy.Conservative;
  return Strategy.Hold;
}
```

### 4.4 LLM Integration

```typescript
class LLMService {
  async generateExplanation(analysis: AnalysisResult): Promise<string> {
    if (!this.enabled) {
      return this.generateTemplateExplanation(analysis);
    }

    const response = await this.client.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 300,
      system: `You are an AI financial advisor explaining invoice yield decisions.
               Keep explanations under 3 sentences. Be direct and actionable.`,
      messages: [{
        role: 'user',
        content: this.buildPrompt(analysis)
      }]
    });

    return response.content[0].text;
  }
}
```

### 4.5 WebSocket Protocol

#### Message Types

```typescript
interface WebSocketMessage {
  type: 'thought' | 'decision' | 'execution' | 'status' | 'error';
  payload: AgentThought | AgentDecision | { status: string };
}

interface AgentThought {
  type: 'thinking' | 'analysis' | 'decision' | 'execution' | 'error';
  tokenId: string;
  message: string;
  timestamp: number;
  data?: Record<string, unknown>;
}
```

#### Example Message Sequence

```json
// 1. Agent starts analysis
{"type": "thought", "payload": {
  "type": "thinking",
  "tokenId": "0",
  "message": "🔍 Analyzing Invoice #0...",
  "timestamp": 1703318400000
}}

// 2. Risk assessment
{"type": "thought", "payload": {
  "type": "analysis",
  "tokenId": "0",
  "message": "📈 Risk Score: 85/100 | Payment Probability: 92%",
  "timestamp": 1703318400500,
  "data": {"riskScore": 85, "paymentProbability": 92, "daysUntilDue": 45}
}}

// 3. Strategy evaluation
{"type": "thought", "payload": {
  "type": "analysis",
  "tokenId": "0",
  "message": "🎯 Evaluating: Hold → Aggressive (87% confidence)",
  "timestamp": 1703318401000
}}

// 4. Decision
{"type": "thought", "payload": {
  "type": "decision",
  "tokenId": "0",
  "message": "Upgrading to Aggressive strategy for higher yields (6-8% APY). Strong fundamentals make this a confident move.",
  "timestamp": 1703318401500
}}

// 5. Execution
{"type": "execution", "payload": {
  "type": "execution",
  "tokenId": "0",
  "message": "✅ Strategy updated to Aggressive",
  "data": {"txHash": "0x..."}
}}
```

---

## 5. Frontend Application

### 5.1 Component Structure

```
app/src/
├── app/
│   ├── layout.tsx        # Root layout with providers
│   ├── page.tsx          # Main dashboard
│   └── globals.css       # Global styles
├── components/
│   ├── Providers.tsx     # wagmi + react-query setup
│   ├── ConnectWallet.tsx # Wallet connection button
│   ├── AgentActivity.tsx # Live agent reasoning feed
│   ├── InvoiceForm.tsx   # Invoice tokenization form
│   ├── Portfolio.tsx     # User's invoice portfolio
│   └── Stats.tsx         # Protocol statistics
└── lib/
    ├── wagmi.ts          # Web3 configuration
    └── abi.ts            # Contract ABIs
```

### 5.2 Key Components

#### AgentActivity (The "Wow Factor")

Real-time streaming of agent thoughts via WebSocket:

```typescript
function AgentActivity() {
  const [thoughts, setThoughts] = useState<AgentThought[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const ws = new WebSocket(AGENT_WS_URL);

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'thought') {
        setThoughts(prev => [...prev.slice(-49), message.payload]);
      }
    };

    return () => ws.close();
  }, []);

  return (
    <div className="h-96 overflow-y-auto">
      {thoughts.map((thought, i) => (
        <ThoughtCard key={i} thought={thought} />
      ))}
    </div>
  );
}
```

#### InvoiceForm (Privacy-Preserving Minting)

```typescript
function InvoiceForm() {
  const handleSubmit = async (formData) => {
    // Generate random salt
    const salt = keccak256(toHex(crypto.randomUUID()));

    // Create commitments (not raw data)
    const dataCommitment = keccak256(
      encodePacked(['string', 'bytes32'], [invoiceData, salt])
    );

    // Store salt locally for future reveals
    localStorage.setItem('invoiceSalts', JSON.stringify({
      [dataCommitment]: { salt, data: invoiceData }
    }));

    // Mint with commitments only
    writeContract({
      functionName: 'mint',
      args: [dataCommitment, amountCommitment, dueDate]
    });
  };
}
```

### 5.3 State Management

- **wagmi**: Wallet connection, contract reads/writes
- **@tanstack/react-query**: Caching, refetching, optimistic updates
- **Local state**: Form data, UI state
- **WebSocket**: Real-time agent activity

---

## 6. Privacy Layer

### 6.1 Commitment Scheme

Invoice data is never stored on-chain in plain text. Instead:

```
COMMITMENT CREATION:
1. User enters invoice data: {client: "Acme", amount: 10000, ...}
2. Generate random salt: salt = keccak256(randomUUID())
3. Create commitment: commitment = keccak256(data || salt)
4. Store commitment on-chain, keep salt locally

VERIFICATION (without revealing):
1. Verifier has: commitment (on-chain)
2. Owner provides: data + salt (off-chain)
3. Verifier computes: keccak256(data || salt)
4. Compare: computed == stored → valid

SELECTIVE REVEAL:
1. Owner authorizes specific address
2. Shares data + salt with authorized party only
3. On-chain verification confirms authenticity
```

### 6.2 Merkle Tree for Verified Invoices

```
Purpose: Prove invoice membership in "verified" set without revealing which invoice

STRUCTURE:
                    [Root]
                   /      \
              [H1-2]      [H3-4]
              /    \      /    \
           [H1]  [H2]  [H3]  [H4]
            |     |     |     |
        Invoice1 Invoice2 Invoice3 Invoice4

VERIFICATION:
- Prover knows: Invoice2 hash, Merkle proof [H1, H3-4]
- Verifier has: Root (on-chain)
- Verification: hash(hash(H1, Invoice2), H3-4) == Root
- Result: Invoice2 is in verified set (without revealing Invoice2's data)
```

### 6.3 ZK-Ready Architecture

Current implementation uses hash commitments. The architecture is designed for ZK upgrade:

```
FUTURE ZK IMPLEMENTATION (Noir):

fn main(
    // Private inputs
    invoice_amount: Field,
    due_date: Field,
    owner_secret: Field,

    // Public inputs
    min_amount: Field,
    owner_commitment: Field
) {
    // Prove amount > minimum without revealing exact amount
    assert(invoice_amount > min_amount);

    // Prove ownership
    assert(hash(owner_secret) == owner_commitment);
}

OUTPUT: Zero-knowledge proof that invoice meets criteria
```

---

## 7. API Reference

### 7.1 Contract ABIs

Full ABIs are available in `/app/src/lib/abi.ts`. Key function signatures:

#### InvoiceNFT

```typescript
// Mint new invoice
function mint(
  dataCommitment: bytes32,
  amountCommitment: bytes32,
  dueDate: uint256
) returns (uint256 tokenId)

// Get invoice details
function getInvoice(uint256 tokenId) returns (Invoice)

// Verify commitment reveal
function verifyReveal(
  uint256 tokenId,
  bytes data,
  bytes32 salt
) returns (bool valid)
```

#### YieldVault

```typescript
// Deposit invoice for yield
function deposit(
  uint256 tokenId,
  uint8 strategy,      // 0=Hold, 1=Conservative, 2=Aggressive
  uint256 principal    // Simulated value in wei
)

// Withdraw and claim yield
function withdraw(uint256 tokenId)

// Get current yield
function getAccruedYield(uint256 tokenId) returns (uint256)
```

### 7.2 WebSocket API

**Endpoint**: `ws://localhost:8080` (configurable)

**Client → Server Messages**:
```typescript
// Request analysis of specific invoice
{ "type": "requestAnalysis", "tokenId": "0" }
```

**Server → Client Messages**:
```typescript
// Agent thought/activity
{ "type": "thought", "payload": AgentThought }

// Decision recorded
{ "type": "decision", "payload": AgentDecision }

// Execution result
{ "type": "execution", "payload": { "tokenId", "success", "txHash" } }

// Connection status
{ "type": "status", "payload": { "status": "connected" } }
```

---

## 8. Deployment Guide

### 8.1 Prerequisites

- Node.js 18+
- pnpm 8+
- Foundry (forge, cast, anvil)
- Mantle Sepolia testnet ETH ([Faucet](https://faucet.sepolia.mantle.xyz/))
- (Optional) Anthropic API key for LLM features

### 8.2 Contract Deployment

```bash
# 1. Navigate to contracts
cd /Users/yonko/invoiceagent/contracts

# 2. Set environment
export PRIVATE_KEY=your_private_key_here
export MANTLE_SEPOLIA_RPC=https://rpc.sepolia.mantle.xyz

# 3. Deploy
forge script script/Deploy.s.sol \
  --rpc-url $MANTLE_SEPOLIA_RPC \
  --broadcast \
  --verify

# 4. Note deployed addresses from output:
# InvoiceNFT: 0x...
# YieldVault: 0x...
# PrivacyRegistry: 0x...
# AgentRouter: 0x...
# MockOracle: 0x...
```

### 8.3 Agent Configuration

```bash
# 1. Navigate to agent
cd /Users/yonko/invoiceagent/agent

# 2. Create .env
cp .env.example .env

# 3. Edit .env with deployed addresses
MANTLE_RPC_URL=https://rpc.sepolia.mantle.xyz
AGENT_PRIVATE_KEY=your_agent_wallet_private_key
ANTHROPIC_API_KEY=your_anthropic_key  # Optional
WS_PORT=8080

INVOICE_NFT_ADDRESS=0x...
YIELD_VAULT_ADDRESS=0x...
AGENT_ROUTER_ADDRESS=0x...
MOCK_ORACLE_ADDRESS=0x...

# 4. Authorize agent on AgentRouter
cast send $AGENT_ROUTER_ADDRESS \
  "authorizeAgent(address)" \
  $AGENT_WALLET_ADDRESS \
  --rpc-url $MANTLE_SEPOLIA_RPC \
  --private-key $DEPLOYER_PRIVATE_KEY
```

### 8.4 Frontend Configuration

```bash
# 1. Navigate to app
cd /Users/yonko/invoiceagent/app

# 2. Create .env
cp .env.example .env

# 3. Edit .env
NEXT_PUBLIC_INVOICE_NFT_ADDRESS=0x...
NEXT_PUBLIC_YIELD_VAULT_ADDRESS=0x...
NEXT_PUBLIC_PRIVACY_REGISTRY_ADDRESS=0x...
NEXT_PUBLIC_AGENT_ROUTER_ADDRESS=0x...
NEXT_PUBLIC_MOCK_ORACLE_ADDRESS=0x...
NEXT_PUBLIC_AGENT_WS_URL=ws://localhost:8080
```

### 8.5 Running the System

```bash
# Terminal 1: Start agent
cd agent && pnpm dev

# Terminal 2: Start frontend
cd app && pnpm dev

# Access at http://localhost:3000
```

---

## 9. Configuration

### 9.1 Agent Configuration

| Parameter | Default | Description |
|-----------|---------|-------------|
| `minConfidence` | 70 | Minimum confidence to auto-execute |
| `analysisInterval` | 30000ms | Time between analysis cycles |
| `maxConcurrentAnalyses` | 5 | Max parallel invoice analyses |
| `autoExecute` | true | Auto-execute high-confidence decisions |

### 9.2 Yield Rates

| Strategy | APY | Risk Level |
|----------|-----|------------|
| Hold | 0% | None |
| Conservative | 3.5% | Low |
| Aggressive | 7% | Medium |

### 9.3 Network Configuration

| Network | Chain ID | RPC |
|---------|----------|-----|
| Mantle Sepolia | 5003 | https://rpc.sepolia.mantle.xyz |
| Mantle Mainnet | 5000 | https://rpc.mantle.xyz |

---

## 10. Testing

### 10.1 Smart Contract Tests

```bash
cd contracts

# Run all tests
forge test

# Run with verbosity
forge test -vvv

# Run specific test
forge test --match-test test_FullFlow

# Gas report
forge test --gas-report
```

**Test Coverage**:
- InvoiceNFT: Minting, status updates, reveal verification
- YieldVault: Deposits, withdrawals, strategy changes, yield calculation
- PrivacyRegistry: Commitments, reveals, Merkle proofs
- AgentRouter: Decision recording, execution, authorization
- MockOracle: Risk data setting, simulation
- Integration: Full flow from mint → deposit → agent decision → withdraw

### 10.2 Agent Tests

```bash
cd agent

# Type check
pnpm exec tsc --noEmit

# Run (manual testing)
pnpm dev
```

### 10.3 Frontend Tests

```bash
cd app

# Type check
pnpm exec tsc --noEmit

# Build (catches errors)
pnpm build
```

---

## 11. Security Considerations

### 11.1 Smart Contract Security

| Risk | Mitigation |
|------|------------|
| Reentrancy | ReentrancyGuard on YieldVault |
| Access Control | Ownable + role-based modifiers |
| Integer Overflow | Solidity 0.8+ built-in checks |
| Front-running | Agent decisions are informational |

### 11.2 Privacy Considerations

| Data | Storage | Access |
|------|---------|--------|
| Invoice details | Off-chain (user's device) | User only |
| Commitments | On-chain | Public (but meaningless without salt) |
| Salts | Local storage | User only |
| Risk scores | On-chain | Public |

### 11.3 Agent Security

| Risk | Mitigation |
|------|------------|
| Unauthorized execution | Agent authorization required |
| Gas griefing | maxGasPrice config |
| Bad decisions | Rule-based logic (auditable), confidence thresholds |

### 11.4 Known Limitations (MVP)

1. **Mock Oracle**: Risk data is simulated, not from real sources
2. **Simulated Yield**: No actual DeFi integration (future: Lendle)
3. **Local Salt Storage**: Production would use secure storage/encryption
4. **Single Agent**: No redundancy or failover

---

## 12. Future Roadmap

### Phase 1: MVP (Current)
- [x] Invoice tokenization with commitments
- [x] Yield vault with simulated APY
- [x] Autonomous agent with live reasoning
- [x] Privacy-preserving architecture

### Phase 2: Real DeFi Integration
- [ ] Lendle protocol integration for actual yield
- [ ] mETH staking for idle capital
- [ ] RedStone oracle integration for real risk data

### Phase 3: ZK Privacy
- [ ] Noir circuit for amount range proofs
- [ ] zkPass integration for KYC
- [ ] Private invoice verification

### Phase 4: Production
- [ ] Multi-sig custody
- [ ] Secondary market for invoice NFTs
- [ ] Institutional compliance features
- [ ] Multi-chain deployment

---

## Appendix A: Contract Addresses

| Contract | Mantle Sepolia | Mantle Mainnet |
|----------|---------------|----------------|
| InvoiceNFT | TBD | TBD |
| YieldVault | TBD | TBD |
| PrivacyRegistry | TBD | TBD |
| AgentRouter | TBD | TBD |
| MockOracle | TBD | TBD |

---

## Appendix B: Error Codes

### Smart Contracts

| Error | Contract | Meaning |
|-------|----------|---------|
| "Only YieldVault" | InvoiceNFT | Caller is not YieldVault |
| "Only Agent or Oracle" | InvoiceNFT | Unauthorized risk update |
| "Not token owner" | InvoiceNFT | Caller doesn't own NFT |
| "Already deposited" | YieldVault | Invoice already in vault |
| "Not active" | YieldVault | Deposit not active |
| "Not authorized agent" | AgentRouter | Agent not authorized |

### Agent Service

| Error | Meaning |
|-------|---------|
| "Agent not active" | Agent is disabled |
| "No private key" | Running in read-only mode |
| "LLM error" | Claude API call failed |
| "WebSocket error" | Connection issue |

---

## Appendix C: Gas Estimates

| Operation | Estimated Gas | Cost @ 0.02 gwei |
|-----------|--------------|------------------|
| mint() | ~250,000 | ~0.000005 MNT |
| deposit() | ~300,000 | ~0.000006 MNT |
| withdraw() | ~200,000 | ~0.000004 MNT |
| recordDecision() | ~150,000 | ~0.000003 MNT |
| changeStrategy() | ~100,000 | ~0.000002 MNT |

*Mantle's low gas costs enable frequent agent execution*

---

**Document Version**: 1.0.0
**Last Updated**: December 2024
**Authors**: Built with AI assistance for Mantle Global Hackathon 2025
