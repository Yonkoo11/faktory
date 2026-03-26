# Faktory Protocol - Demo Guide

## What Is This?

Faktory lets crypto-native freelancers earn real DeFi yield on unpaid invoices while waiting for clients to pay. Not invoice factoring (we don't lend) - this is a yield optimizer for invoices you're already waiting on.

---

## Quick Demo Flow

### Prerequisites
- MetaMask installed
- Connected to any supported chain (Base, Arbitrum, Polygon, or SKALE)
- Test tokens for gas (chain-dependent)

### Step 1: Connect Wallet
Select your chain from the chain switcher. You'll see:
- Current APY from Aave V3 (real rates, not simulated)
- Gas cost indicator (SKALE shows "FREE")

### Step 2: Mint an Invoice
Fill in:
- **Invoice Amount:** e.g. $10,000
- **Due Date:** 30-90 days from today
- **Payer:** any name
- **Strategy:** Conservative (~2-4% APY) or Aggressive (~4-7% APY)

This creates an ERC721 NFT with privacy-preserving commitments.

### Step 3: Deposit to Vault
Enter principal amount and deposit. The vault deposits to Aave V3 (on Base/Arbitrum/Polygon) or holds funds (on SKALE).

### Step 4: Watch the Agent
Visit the Agent page. The AI agent:
- Monitors deposits every 30 seconds
- Analyzes risk using Pyth oracle data
- Recommends strategy changes with confidence scores
- Auto-executes decisions above 70% confidence

### Step 5: Withdraw
When your client pays, withdraw principal + real accrued yield.

---

## What's Real vs Simulated

### Real
- Smart contracts deployed on 4 chains
- Yield from Aave V3 (real DeFi protocol)
- Oracle prices from Pyth Network
- AI agent with Claude analysis
- WebSocket real-time updates

### Limitations
- SKALE has no yield source (Hold strategy only)
- Risk scoring uses simplified model
- No secondary market for invoice NFTs yet

---

## Running Locally

```bash
# Frontend
cd app && pnpm install && pnpm dev

# Agent (separate terminal)
cd agent && pnpm install && pnpm dev
```

Visit http://localhost:3000
