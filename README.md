# Faktory

> Turn Invoices into Yield. Automatically.

Built for Mantle Global Hackathon 2025

## Overview

Faktory solves the $3T+ invoice financing problem by tokenizing invoices as RWAs on Mantle Network, then deploying an autonomous AI agent to optimize yield strategies while protecting sensitive business data with cryptographic commitments.

## Features

- **Invoice Tokenization**: Mint invoices as ERC-721 NFTs with privacy-preserving commitments
- **Autonomous AI Agent**: Continuously analyzes and optimizes yield strategies
- **Live Reasoning**: Watch the agent think in real-time via WebSocket streaming
- **Privacy Layer**: Cryptographic commitments + Merkle proofs for selective disclosure
- **Yield Vault**: Deposit invoice NFTs to earn yield (3-8% APY depending on strategy)
- **Low-Cost Execution**: Built on Mantle for affordable frequent agent actions

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                       │
│  Invoice Upload | Portfolio Dashboard | Live Agent Activity    │
└─────────────────────────────────────────────────────────────────┘
                              │ WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     FAKTORY AGENT (TypeScript)                  │
│  Rule-based Optimizer | LLM Explainer | Strategy Executor      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   SMART CONTRACTS (Solidity)                    │
│  InvoiceNFT | YieldVault | PrivacyRegistry | AgentRouter       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    [ Mantle Network ]
```

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm
- Foundry
- Anthropic API key (optional, for LLM explanations)

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
```

### Deploy Contracts

```bash
# Set your private key
export PRIVATE_KEY=your_private_key

# Deploy to Mantle Sepolia
cd contracts
forge script script/Deploy.s.sol --rpc-url https://rpc.sepolia.mantle.xyz --broadcast

# Copy deployed addresses to .env files
```

### Run the App

```bash
# Terminal 1: Start the agent
cd agent && pnpm dev

# Terminal 2: Start the frontend
cd app && pnpm dev
```

Visit `http://localhost:3000`

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

## Hackathon Tracks

- **RWA/RealFi**: Tokenized invoices as yield-generating real-world assets
- **AI & Oracles**: Autonomous AI agent with oracle data integration
- **ZK & Privacy**: Cryptographic commitments for invoice data privacy

## Tech Stack

- **Network**: Mantle (low-cost L2 for frequent agent execution)
- **Smart Contracts**: Solidity + Foundry
- **Agent**: TypeScript + ethers.js + Claude API
- **Frontend**: Next.js + wagmi + viem + Tailwind CSS
- **Privacy**: Hash commitments + Merkle proofs

## Demo

[Video Link - Coming Soon]

## Team

Built with AI assistance for Mantle Global Hackathon 2025.

## License

MIT
