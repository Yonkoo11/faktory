# Faktory Protocol - AI Memory

## What This Project Is

Autonomous AI Treasury Agent for B2B Commerce on Cronos. Freelancers mint invoices as NFTs, deposit to yield vaults, AI agent monitors and optimizes yield strategies, clients pay via x402 on-chain settlement.

## Key Decisions

- **Light theme UI** - Breaks from dark crypto aesthetic, Stripe/Linear inspired
- **Simulated yields for hackathon** - Real DeFi integration exists in architecture but uses hardcoded APY (3.5%/7%) for demo
- **Privacy via hash commitments** - Invoice data stored as keccak256 hashes, not plaintext
- **70% confidence threshold** - Agent auto-executes above this, human approves below
- **Cronos Testnet deployment** - Originally built for Mantle, pivoted to Cronos for x402 hackathon

## Architecture

```
faktory/
├── app/          # Next.js 15 + React 19 frontend
├── agent/        # TypeScript AI agent service (port 8080)
├── contracts/    # Solidity smart contracts (Foundry)
└── ai/           # Project memory (this folder)
```

### Smart Contracts (Cronos Testnet):
- InvoiceNFT - ERC721 with privacy commitments
- YieldVault - Deposit/withdraw + yield accrual
- AgentRouter - AI decision recording + execution
- PrivacyRegistry - Hash-based privacy layer
- MockOracle - Price feeds (simulated)

### Tech Stack:
- Frontend: Next.js 15, React 19, wagmi, viem, Tailwind
- Agent: TypeScript, ethers.js, Anthropic SDK, WebSocket
- Contracts: Solidity 0.8.24, Foundry
- Network: Cronos Testnet (Chain ID 338)

## Learned Context

- wagmi config is in `/app/src/lib/wagmi.ts`
- Contract addresses centralized in `/app/src/lib/contracts/addresses.ts`
- Agent runs as standalone Node.js service, communicates via WebSocket
- Vercel deployment at faktory-app.vercel.app
- Has Remotion setup for potential video generation

## Gotchas & Warnings

- PITCH.md and DEMO.md still reference Mantle (old hackathon) - need updating
- Live Vercel deployment shows Mantle, not Cronos - needs redeploy
- Yields are SIMULATED - don't promise real DeFi returns
- Contracts NOT audited - testnet only

## Reflections

- The pivot from Mantle to Cronos went smoothly at code level, but documentation/deployment lags behind
- Having centralized contract addresses made the chain switch easy
