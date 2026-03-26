# Faktory Protocol

> Turn Invoices into Yield. Automatically.

**GitHub:** https://github.com/Yonkoo11/faktory

---

## The Problem

B2B freelancers, consultants, and agencies routinely wait **30-90 days** for invoice payment. That's significant capital sitting idle while DeFi offers 2-7% APY on stablecoins.

**Example:** A freelancer with $50,000 in outstanding invoices loses ~$2,500/year in potential yield.

---

## The Solution

**Faktory** lets crypto-native freelancers earn DeFi yield on unpaid invoices while they wait for payment.

```
Mint Invoice -> Deposit to Vault -> Earn Yield -> Withdraw When Paid
```

- **No lockups** - withdraw anytime
- **No credit checks** - your wallet is your identity
- **No KYC** - permissionless access
- **Privacy-first** - only cryptographic hashes on-chain
- **Multichain** - deploy where your users are

---

## How It Works

1. **Connect** - Link your wallet on any supported chain
2. **Mint** - Create an NFT representing your invoice (data stored as hash)
3. **Deposit** - Put equivalent USDC into yield vault
4. **Earn** - Vault generates real yield via Aave V3
5. **Optimize** - AI agent automatically rebalances between strategies
6. **Withdraw** - Get principal + yield when your client pays

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Networks** | Base, Arbitrum, Polygon, SKALE |
| **Smart Contracts** | Solidity (Foundry) |
| **Frontend** | Next.js 15 + React 19 + wagmi |
| **AI Agent** | TypeScript (autonomous optimization) |
| **Yield Source** | Aave V3 (real DeFi yields) |
| **Oracle** | Pyth Network (real-time prices) |
| **Privacy** | Commitment scheme (keccak256 hashes) |

---

## Supported Chains

| Chain | Yield Source | Gas | Status |
|-------|-------------|-----|--------|
| Base | Aave V3 | Low | Active |
| Arbitrum | Aave V3 | Low | Active |
| Polygon | Aave V3 | Low | Active |
| SKALE | Hold only | FREE | Active |

---

## What Makes This Different

### Not Invoice Factoring
Traditional factoring advances 80-90% cash upfront. We don't provide liquidity - we **optimize yield** on capital you're already waiting for.

### AI-Powered Automation
Our autonomous agent monitors invoices 24/7, analyzing:
- Days until due date
- Risk scores from Pyth oracle data
- Gas prices
- Real-time APY rates from Aave V3

High-confidence decisions (>70%) execute automatically.

### Privacy-First Design
Invoice details never go on-chain. Only cryptographic commitments are stored, enabling selective disclosure.

---

## Target Users

**Ideal User:**
- Crypto-native freelancer or consultant
- Invoices other businesses (B2B)
- Net-30/60/90 payment terms
- $20K+ in outstanding receivables
- Already has a crypto wallet

---

## Honest Assessment

### What Works
- Invoice tokenization with privacy commitments
- Real DeFi yield via Aave V3 (not simulated)
- AI agent with real LLM analysis
- Multichain deployment (4 chains)

### What Remains Unproven
- Product-market fit with real users
- Unit economics at scale
- Competitive moat vs. using Aave directly

---

## Links

- **GitHub:** https://github.com/Yonkoo11/faktory

---

*Originally built for Cronos x402 PayTech Hackathon ($3K winner). Now rebuilt as a multichain product.*
