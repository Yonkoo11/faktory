# Faktory Protocol

> Turn Invoices into Yield. Automatically.

**Live Demo:** https://faktory-app.vercel.app
**GitHub:** https://github.com/Yonkoo11/faktory
**Network:** Mantle L2 (Sepolia Testnet)

---

## The Problem

B2B freelancers, consultants, and agencies routinely wait **30-90 days** for invoice payment. That's significant capital sitting idle — doing nothing — while DeFi offers 3-7% APY on stablecoins.

**Example:** A freelancer with $50,000 in outstanding invoices loses ~$2,500/year in potential yield.

---

## The Solution

**Faktory** lets crypto-native freelancers earn DeFi yield on unpaid invoices while they wait for payment.

```
Mint Invoice → Deposit to Vault → Earn Yield → Withdraw When Paid
```

- **No lockups** — withdraw anytime
- **No credit checks** — your wallet is your identity
- **No KYC** — permissionless access
- **Privacy-first** — only cryptographic hashes on-chain

---

## How It Works

1. **Connect** — Link your wallet (Mantle L2)
2. **Mint** — Create an NFT representing your invoice (data stored as hash)
3. **Deposit** — Put equivalent USDC into yield vault
4. **Earn** — Vault generates 3.5-7% APY via Lendle Protocol
5. **Optimize** — AI agent automatically rebalances between strategies
6. **Withdraw** — Get principal + yield when your client pays

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Network** | Mantle L2 (low gas, fast transactions) |
| **Smart Contracts** | 5 Solidity contracts (Foundry) |
| **Frontend** | Next.js 15 + React 19 + wagmi |
| **AI Agent** | TypeScript (autonomous optimization) |
| **Yield Source** | Lendle Protocol integration |
| **Privacy** | Commitment scheme (keccak256 hashes) |

### Deployed Contracts (Mantle Sepolia)

| Contract | Address |
|----------|---------|
| InvoiceNFT | `0xf35be6ffebf91acc27a78696cf912595c6b08aaa` |
| YieldVault | `0xd2cad31a080b0dae98d9d6427e500b50bcb92774` |
| AgentRouter | `0xEde6Db2855BACF191E5B2E2d91B6276bB56bf183` |
| PrivacyRegistry | `0xec5bfee9d17e25cc8d52b8cb7fb81d8cabb53c5f` |
| MockOracle | `0xD0db0eb608107862E963737FE87ffdFF7f400e3C` |

---

## What Makes This Different

### Not Invoice Factoring
Traditional factoring advances 80-90% cash upfront. We don't provide liquidity — we **optimize yield** on capital you're already waiting for.

### AI-Powered Automation
Our autonomous agent monitors invoices 24/7, analyzing:
- Days until due date
- Risk scores
- Gas prices
- APY rates

High-confidence decisions (>70%) execute automatically.

### Privacy-First Design
Invoice details never go on-chain. Only cryptographic commitments are stored, enabling selective disclosure.

---

## Business Model (Future)

| Revenue Stream | Rate |
|----------------|------|
| Protocol fee on yields | 0.5-1% |
| Premium agent features | Subscription |
| NFT marketplace fees | Trading fees |

---

## Roadmap

### Phase 1: Hackathon (Current)
- Demo on Mantle Sepolia testnet
- Core flows working (mint, deposit, withdraw)
- AI agent integration

### Phase 2: Validation
- User interviews with crypto-native freelancers
- Product-market fit testing
- Real Lendle pool integration

### Phase 3: Production
- Smart contract audit ($30-50k)
- Mainnet deployment
- Regulatory analysis

---

## Target Users

**Ideal User:**
- Crypto-native freelancer or consultant
- Invoices other businesses (B2B)
- Net-30/60/90 payment terms
- $20K+ in outstanding receivables
- Already has a crypto wallet

**Not Our User:**
- Businesses needing cash advances (we don't lend)
- Non-crypto users (wallet required)
- Consumer-facing businesses

---

## Competitive Landscape

| Solution | Approach | Our Advantage |
|----------|----------|---------------|
| Lendle Direct | Manual yield farming | Invoice tracking, AI automation |
| Traditional Factoring | Cash advance, fees | No advance fees, keep full invoice value |
| Nothing (idle capital) | Wait and lose yield | Earn 3-7% APY automatically |

---

## Team

**Solo Builder** (Hackathon Submission)

Full-stack development including:
- Smart contract architecture (Solidity + Foundry)
- Frontend (Next.js + wagmi)
- AI agent service (TypeScript)
- DevOps (Vercel deployment)

---

## Honest Assessment

### What We Proved
- Invoice tokenization is technically feasible
- DeFi yields can be tracked per-invoice
- AI agents can automate strategy decisions
- Professional UI/UX is possible in Web3

### What Remains Unproven
- Product-market fit
- Unit economics
- Go-to-market strategy
- Competitive moat vs. using Lendle directly

**This project demonstrates technical competence and clean architecture, not yet validated business viability.**

---

## Links

- **Live Demo:** https://faktory-app.vercel.app
- **GitHub:** https://github.com/Yonkoo11/faktory
- **Contracts:** [Mantle Sepolia Explorer](https://sepolia.mantlescan.xyz/)

---

*Built for Mantle Global Hackathon 2025*
