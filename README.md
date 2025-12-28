# Faktory

> **Your invoices shouldn't just sit there. They should work for you.**

**[Live Demo](https://faktory-app.vercel.app/)** | Built for Mantle Global Hackathon 2025 | RWA/RealFi Track

## The Problem

**Businesses lose $180B annually** to invoice financing friction:

| Pain Point | Impact |
|------------|--------|
| **Waiting 30-90 days** for payment | Cash flow crisis, missed opportunities |
| **Factoring fees of 2-5%** | $50B+ extracted by middlemen yearly |
| **Privacy exposure** | Must reveal clients, amounts, contracts to get financing |
| **No yield on receivables** | $3T in invoices sitting idle, earning nothing |

Traditional invoice factoring is slow, expensive, and requires trusting third parties with sensitive business data.

## The Solution

**Faktory** turns invoices into yield-generating assets on Mantle Network:

```
Invoice Created → Tokenized as NFT → Deposited to Vault → AI Optimizes Yield → Invoice Paid → Withdraw Principal + Yield
```

Instead of selling your invoice at a discount (factoring), you **keep ownership** while earning yield on the underlying value. An autonomous AI agent monitors risk in real-time and adjusts strategies automatically.

## Why Faktory Wins

| Traditional Factoring | Faktory |
|-----------------------|---------|
| 2-5% fee to middlemen | Earn 3-8% yield instead |
| Days of paperwork | Tokenize in minutes |
| Expose all business data | Privacy-preserving commitments |
| One-time transaction | Continuous optimization |
| Human decision-making | AI agent with real-time oracle data |

## Key Features

- **Invoice NFTs**: ERC-721 tokens with cryptographic privacy - only you control disclosure
- **Autonomous Agent**: 24/7 strategy optimization using Pyth oracle price feeds
- **Live Reasoning**: Watch the AI think in real-time via WebSocket streaming
- **Real Yield**: Integrated with Lendle protocol for actual DeFi returns
- **Mantle-Native**: Sub-cent transaction costs enable frequent agent actions

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              FAKTORY PROTOCOL                                 │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                         FRONTEND (Next.js 16)                           │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────────┐   │ │
│  │  │   Landing   │  │  Dashboard  │  │    Mint     │  │ Agent Monitor │   │ │
│  │  │    Page     │  │  Portfolio  │  │   Invoice   │  │  Live Feed    │   │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └───────────────┘   │ │
│  └────────────────────────────┬────────────────────────────────────────────┘ │
│                               │                                              │
│                    WebSocket ◄┼► wagmi/viem                                  │
│                               │                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                      AI AGENT (TypeScript)                              │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────────┐   │ │
│  │  │   Market    │  │    Risk     │  │  Strategy   │  │   Execution   │   │ │
│  │  │  Monitor    │  │  Analyzer   │  │  Optimizer  │  │    Engine     │   │ │
│  │  │ (Pyth API)  │  │ (ML Model)  │  │ (Rule-based)│  │  (ethers.js)  │   │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └───────────────┘   │ │
│  │                           │                                             │ │
│  │                    ┌──────┴──────┐                                      │ │
│  │                    │ LLM Explainer│ ◄── Claude API                      │ │
│  │                    │ (Reasoning) │                                      │ │
│  │                    └─────────────┘                                      │ │
│  └────────────────────────────┬────────────────────────────────────────────┘ │
│                               │                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                     SMART CONTRACTS (Solidity)                          │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────────┐   │ │
│  │  │ InvoiceNFT  │  │ YieldVault  │  │ AgentRouter │  │  PythOracle   │   │ │
│  │  │  (ERC-721)  │  │  (Deposits) │  │ (Decisions) │  │ (Price Feeds) │   │ │
│  │  │ Commitment  │  │  Strategies │  │ Rate Limit  │  │  Risk Data    │   │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └───────────────┘   │ │
│  └────────────────────────────┬────────────────────────────────────────────┘ │
│                               │                                              │
├───────────────────────────────┼──────────────────────────────────────────────┤
│                               ▼                                              │
│                    ┌─────────────────────┐                                   │
│                    │   MANTLE NETWORK    │                                   │
│                    │  ~$0.002 per tx     │                                   │
│                    │  Fast finality      │                                   │
│                    └─────────────────────┘                                   │
│                               │                                              │
│              ┌────────────────┼────────────────┐                             │
│              ▼                ▼                ▼                             │
│        ┌──────────┐    ┌──────────┐    ┌──────────┐                          │
│        │  Lendle  │    │   mETH   │    │   Pyth   │                          │
│        │ Protocol │    │  Staking │    │  Oracle  │                          │
│        │  3-8% APY│    │  Yield   │    │  Prices  │                          │
│        └──────────┘    └──────────┘    └──────────┘                          │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
1. User mints Invoice NFT ──► Commitment hash stored on-chain
                                        │
2. User deposits to YieldVault ─────────┼──► Principal locked
                                        │
3. Agent monitors every 30s ────────────┼──► Reads Pyth oracle
                                        │
4. Agent analyzes risk ─────────────────┼──► ML model + market data
                                        │
5. Agent optimizes strategy ────────────┼──► Execute via AgentRouter
                                        │
6. User withdraws ──────────────────────┴──► Principal + yield returned
```

## 🎬 Demo for Judges

**Try Faktory in under 5 minutes:**

### Quick Demo (No Setup Required)

1. **Visit the live demo**: [Coming Soon - Deploy URL]
2. **Connect your wallet** to Mantle Sepolia testnet
3. **Get testnet MNT** from [Mantle Sepolia Faucet](https://faucet.sepolia.mantle.xyz/)

### Demo Flow

```
1. Landing Page → Connect Wallet → Dashboard
2. Click "Mint Invoice" → Create a test invoice (any amount, any client)
3. See your invoice appear as an NFT in Portfolio
4. Click "Deposit" → Choose a yield strategy → Approve & Deposit
5. Navigate to "Agent" tab → Watch AI reasoning in real-time
6. See live Lendle APY rates fetched from Mantle mainnet
```

### What to Look For

- **Real blockchain transactions** - All actions write to Mantle Sepolia
- **Live APY data** - Rates fetched from Lendle protocol on Mantle mainnet
- **AI agent reasoning** - Watch decision-making stream via WebSocket
- **Privacy commitments** - Invoice data hashed on-chain, details off-chain

---

## Deployed Contracts (Mantle Sepolia)

| Contract | Address |
|----------|---------|
| InvoiceNFT | `0xf35be6ffebf91acc27a78696cf912595c6b08aaa` |
| YieldVault | `0xd2cad31a080b0dae98d9d6427e500b50bcb92774` |
| AgentRouter | `0xec5bfee9d17e25cc8d52b8cb7fb81d8cabb53c5f` |
| MockOracle | `0xede6db2855bacf191e5b2e2d91b6276bb56bf183` |
| PythOracle | `0xd0db0eb608107862e963737fe87ffdff7f400e3c` |

View on [Mantle Sepolia Explorer](https://sepolia.mantlescan.xyz/)

---

## Quick Start (Local Development)

### Prerequisites

- Node.js 18+
- pnpm
- Foundry
- LLM API key (optional, for AI explanations)

### Installation

```bash
# Clone and install
cd faktory
pnpm install

# Install contract dependencies
cd contracts && forge install && cd ..

# Copy environment files
cp app/.env.example app/.env
cp agent/.env.example agent/.env

# Update .env files with the deployed contract addresses above
```

### Run the App

```bash
# Terminal 1: Start the agent
cd agent && pnpm dev

# Terminal 2: Start the frontend
cd app && pnpm dev
```

Visit `http://localhost:3000`

### Deploy Your Own Contracts (Optional)

```bash
# Set your private key
export PRIVATE_KEY=your_private_key

# Deploy to Mantle Sepolia
cd contracts
forge script script/Deploy.s.sol --rpc-url https://rpc.sepolia.mantle.xyz --broadcast
```

## Project Structure

```
faktory/
├── contracts/           # Solidity smart contracts (Foundry)
│   ├── src/
│   │   ├── InvoiceNFT.sol        # ERC-721 invoice tokenization
│   │   ├── YieldVault.sol        # Yield strategy management
│   │   ├── PrivacyRegistry.sol   # Commitment + Merkle proofs
│   │   ├── AgentRouter.sol       # Agent decision execution
│   │   └── MockOracle.sol        # Simulated risk oracle
│   └── test/
├── agent/               # TypeScript agent service
│   └── src/
│       ├── agent.ts              # Main agent loop
│       ├── optimizer.ts          # Rule-based strategy optimizer
│       ├── llm.ts                # LLM integration (Claude)
│       ├── websocket.ts          # Live streaming server
│       └── blockchain.ts         # Contract interactions
├── app/                 # Next.js frontend
│   └── src/
│       ├── components/
│       │   ├── AgentActivity.tsx # Live agent reasoning feed
│       │   ├── InvoiceForm.tsx   # Invoice tokenization form
│       │   └── Portfolio.tsx     # User's invoice portfolio
│       └── lib/
│           ├── wagmi.ts          # Web3 config
│           └── abi.ts            # Contract ABIs
└── README.md
```

## Hackathon Track: RWA/RealFi

**Primary Focus**: Tokenized invoices as yield-generating real-world assets

Faktory demonstrates how RWAs can be more than static tokens - they can be **active, optimized assets** managed by autonomous agents. This is the future of RealFi: assets that work for you 24/7.

**Supporting Technologies**:
- **AI & Oracles**: Pyth Network price feeds drive real-time risk assessment
- **Privacy**: Cryptographic commitments protect sensitive business data

## Why Mantle?

Faktory isn't just *deployed* on Mantle — it's **purpose-built** for Mantle's unique advantages:

### The Problem with Other Chains

| Challenge | Ethereum L1 | Other L2s | Mantle |
|-----------|-------------|-----------|--------|
| Agent tx every 30s | $50-200/day | $5-20/day | **$0.50/day** |
| Real-time optimization | Prohibitive | Expensive | **Economical** |
| Native yield sources | Scattered | Limited | **Lendle + mETH** |

### Why Sub-Cent Transactions Matter

Our AI agent makes **2,880 transactions per day** (one every 30 seconds):
- **On Ethereum L1**: $100-500/day in gas fees → **Not viable**
- **On Mantle**: ~$0.50/day → **Continuous optimization becomes possible**

This isn't a nice-to-have — it's the **core enabler** of real-time invoice yield optimization.

### Mantle-Native Integrations

```
┌─────────────────────────────────────────────────────────────────┐
│                        MANTLE ECOSYSTEM                         │
├─────────────────────────────────────────────────────────────────┤
│  Lendle Protocol    │  Native lending → Real APY (3-8%)        │
│  mETH/cmETH         │  Liquid staking → Additional yield       │
│  Pyth Network       │  Real-time oracles → Risk assessment     │
│  MNT Gas Token      │  Sub-cent costs → Frequent agent actions │
└─────────────────────────────────────────────────────────────────┘
```

### The Mantle Advantage

1. **Economic Viability**: Agent-driven strategies that would cost $100+/day on L1 cost pennies on Mantle
2. **Native DeFi**: Lendle provides real yield, not inflationary token emissions
3. **Composability**: mETH/cmETH integration ready for enhanced yield strategies
4. **Speed**: Fast finality enables responsive risk management

> "We didn't choose Mantle because it's an L2. We chose it because it's the **only chain** where real-time AI yield optimization is economically viable."

## Tech Stack

- **Network**: Mantle (low-cost L2 for frequent agent execution)
- **Smart Contracts**: Solidity + Foundry
- **Agent**: TypeScript + ethers.js + LLM integration
- **Frontend**: Next.js + wagmi + viem + Tailwind CSS
- **Privacy**: Cryptographic commitments (hash-based privacy, ZK-ready architecture)

## Demo

[Video Link - Coming Soon]

---

## One-Pager Pitch

### Problem
Businesses have **$3 trillion** locked in unpaid invoices globally. Traditional invoice factoring charges 2-5% fees, requires extensive paperwork, and exposes sensitive client data to third parties.

### Solution
Faktory tokenizes invoices as privacy-preserving NFTs and deploys them into yield-generating DeFi strategies on Mantle Network. An autonomous AI agent monitors risk 24/7 and optimizes returns in real-time.

### Business Model
- **Transaction Fees**: 0.5% on deposits/withdrawals
- **Performance Fee**: 10% of yield generated above baseline
- **Premium Features**: Advanced analytics, custom strategies

### Roadmap
1. **Q1 2025**: Testnet launch, security audit
2. **Q2 2025**: Mainnet deployment with Lendle integration
3. **Q3 2025**: Multi-asset support (USDT, mETH, cmETH)
4. **Q4 2025**: Institutional API, credit scoring integration

---

## Team

**[Your Name]** - Full-stack Developer
Background in DeFi and smart contract development. Previously built [relevant experience].

*Contact: [your-email@example.com] | [Twitter/X handle] | [GitHub]*

---

## Compliance Declaration

This project involves **tokenized invoices as real-world assets (RWA)**. Key compliance considerations:

- **No securities offering**: Invoice NFTs represent claims on future receivables, not investment contracts
- **Privacy by design**: Sensitive business data stored as cryptographic commitments, not on-chain
- **KYC-ready architecture**: Framework supports integration with identity verification providers
- **Jurisdiction awareness**: Smart contracts include pause functionality for regulatory compliance

*This is a hackathon prototype. Production deployment would require legal review and appropriate licensing based on target jurisdictions.*

---

## License

MIT
