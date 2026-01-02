# Faktory Protocol

> Earn yield on unpaid invoices while you wait to get paid.

Faktory lets B2B businesses earn DeFi yield on outstanding invoices. Mint your invoice as an NFT, deposit to a yield vault, and withdraw your principal plus earnings when your client pays. Your invoice details stay private — only cryptographic hashes go on-chain.

**[Live Demo](https://faktory-app.vercel.app/)** · Built for Mantle Global Hackathon 2025

---

## Who This Is For

Crypto-native freelancers, consultants, and small agencies who:
- Invoice other businesses on net-30/60/90 terms
- Have $20K+ in outstanding receivables regularly
- Already have a crypto wallet

**Not our user:**
- Businesses that need cash advances (we don't lend)
- Non-crypto users (wallet required, no fiat on-ramp)
- Consumer-facing businesses (B2B invoices only)

---

## What Faktory Does

```
Connect Wallet → Mint Invoice → Deposit to Vault → Earn Yield → Withdraw
```

1. **Mint** — Create an NFT representing your invoice
2. **Deposit** — Put equivalent USDC into a yield vault
3. **Earn** — Vault generates 3-7% APY via Lendle Protocol
4. **Withdraw** — Get principal + yield when your client pays

---

## What Faktory Does NOT Do

- **Advance cash** — We don't lend against invoices
- **Collect payments** — We don't chase your clients
- **Verify invoices** — We trust what you enter
- **Guarantee returns** — DeFi yields fluctuate
- **Support fiat** — Crypto only (USDC/USDT)
- **Onboard non-crypto users** — Wallet required

---

## Success Criteria

This project succeeds if:
- User can mint an invoice in < 2 minutes
- User can deposit and see yield accruing
- User can withdraw principal + yield without issues
- User understands what's happening at every step

---

## Scope

**In scope (what we built):**
- Wallet connection
- Invoice minting (manual entry)
- Deposit to yield vault
- Dashboard (portfolio, yield tracking)
- Withdrawal flow
- AI agent monitoring

**Out of scope (not pursuing):**
- QuickBooks production integration
- Multi-chain support
- Team/org accounts
- Fiat on-ramp
- Mobile app

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Network | Mantle L2 |
| Contracts | Solidity (Foundry) |
| Frontend | Next.js + wagmi + Tailwind |
| Agent | TypeScript + WebSocket |
| Yield | Lendle Protocol |
| Oracles | Pyth Network |

---

## Deployed Contracts (Mantle Sepolia)

**Deployment Date:** 2026-01-02

| Contract | Address |
|----------|---------|
| InvoiceNFT | [`0xf35be6ffebf91acc27a78696cf912595c6b08aaa`](https://sepolia.mantlescan.xyz/address/0xf35be6ffebf91acc27a78696cf912595c6b08aaa) |
| YieldVault | [`0xd2cad31a080b0dae98d9d6427e500b50bcb92774`](https://sepolia.mantlescan.xyz/address/0xd2cad31a080b0dae98d9d6427e500b50bcb92774) |
| AgentRouter | [`0xede6db2855bacf191e5b2e2d91b6276bb56bf183`](https://sepolia.mantlescan.xyz/address/0xede6db2855bacf191e5b2e2d91b6276bb56bf183) |
| PrivacyRegistry | [`0xec5bfee9d17e25cc8d52b8cb7fb81d8cabb53c5f`](https://sepolia.mantlescan.xyz/address/0xec5bfee9d17e25cc8d52b8cb7fb81d8cabb53c5f) |
| MockOracle | [`0xd0db0eb608107862e963737fe87ffdff7f400e3c`](https://sepolia.mantlescan.xyz/address/0xd0db0eb608107862e963737fe87ffdff7f400e3c) |

[View on Mantle Sepolia Explorer](https://sepolia.mantlescan.xyz/)

---

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm
- Foundry (for contracts)

### Run Locally

```bash
# Install dependencies
pnpm install

# Start frontend
cd app && pnpm dev

# Start agent (separate terminal)
cd agent && pnpm dev
```

Visit `http://localhost:3000`

### Deploy Contracts

```bash
cd contracts
forge script script/Deploy.s.sol --rpc-url https://rpc.sepolia.mantle.xyz --broadcast
```

---

## Project Structure

```
faktory/
├── app/          # Next.js frontend
├── agent/        # TypeScript agent service
├── contracts/    # Solidity smart contracts
└── README.md
```

---

## Known Limitations (Hackathon Prototype)

**This is a demonstration project built for Mantle Global Hackathon 2025.**

### What's Real vs Simulated

#### ✅ Fully Functional
- Smart contracts deployed on Mantle Sepolia testnet
- Wallet connection and transaction signing
- Invoice NFT minting and ownership tracking
- Deposit/withdrawal flows
- Dashboard UI and data visualization
- Agent service with WebSocket communication

#### ⚠️ Simulated for Demo
**Yields are SIMULATED:**
- YieldVault uses hardcoded APY rates:
  - Conservative: 3.5% APY (constant)
  - Aggressive: 7.0% APY (constant)
- Yield calculation: `(principal × APY × time) / (365 days × 10000)` on-chain
- Real Lendle integration exists in contract architecture but not activated
- TVL and yield numbers shown in dashboard are for demonstration only

**Why simulated?** Integrating live Lendle pools requires:
- Production Lendle deployment addresses on Mantle
- Mainnet USDC/USDT liquidity
- Ongoing gas costs for rebalancing
- Complex error handling for pool liquidity changes

For hackathon purposes, simulated yields demonstrate the mechanism without those dependencies.

#### ⚠️ Partial Implementation
**QuickBooks Integration:**
- OAuth flow exists and connects successfully
- Invoice data import/parsing NOT implemented
- Users must manually enter invoice details after OAuth
- Production would require QuickBooks API SDK integration and field mapping

**Agent Service:**
- Runs as single Node.js process (port 8080)
- No database persistence (in-memory state only)
- No automatic restart on failure
- Requires manual startup: `cd agent && pnpm dev`
- Production would require:
  - Job queue (Redis/Bull) for reliability
  - PostgreSQL for decision history
  - Multiple instances with leader election
  - Health monitoring and auto-restart

**Privacy Commitments:**
- Invoice data stored as `keccak256` hashes on-chain
- Reveal verification function exists but not used in UI
- API endpoints still return full invoice metadata
- True privacy would require zero-knowledge proofs or selective disclosure UI

### What This Is NOT

**This is NOT invoice factoring:**
- We do not advance cash to businesses
- We do not provide liquidity against invoices
- We do not assume default risk
- Traditional factoring pays 80-90% upfront; we pay nothing upfront

**This IS a yield optimizer:**
- For crypto-native freelancers who already have invoices
- Earns DeFi yield while waiting for client payment
- Equivalent to depositing into Lendle directly, with invoice tracking

**Why not just use Lendle?**
- Invoice NFTs provide better accounting (track which yield came from which client)
- Agent automates rebalancing between Conservative/Aggressive strategies
- Future composability (NFTs can be traded, used as collateral)
- For single invoices, Lendle direct is simpler; for 10+ invoices, Faktory adds value

### Security & Legal Disclaimers

**Not Production-Ready:**
- Smart contracts are **NOT audited** (cost: $30-50k)
- No formal security review performed
- Use **testnet only** — do not deposit real funds
- Deployer retains admin privileges (pause, emergency withdraw)

**Regulatory Risks:**
- Invoice factoring is regulated in most jurisdictions
- May require state-by-state licensing in the US
- Securities law considerations (is invoice NFT a security?)
- AML/KYC requirements not implemented

**Technical Risks:**
- Agent service is single point of failure
- No monitoring or alerting infrastructure
- Race conditions possible in frontend-blockchain-API state sync
- Gas price spikes could make transactions uneconomical

### Production Deployment Requirements

To go from hackathon demo to production would require:

**Security:**
- Professional smart contract audit ($30-50k)
- Penetration testing of frontend and agent
- Formal threat modeling
- Bug bounty program

**Legal:**
- Legal entity formation
- Regulatory compliance review
- State licenses (if required)
- Terms of Service and Privacy Policy
- Securities law analysis

**Infrastructure:**
- Multi-region deployment
- Database (PostgreSQL) for metadata
- Job queue (Redis) for agent reliability
- Monitoring (Datadog/Sentry)
- Error tracking and alerting
- Load balancing and auto-scaling

**Integration:**
- Real Lendle pool integration with error handling
- Live Pyth oracle integration for risk scoring
- QuickBooks API SDK for invoice import
- Webhook handlers for external updates

**Capital:**
- Liquidity provision mechanism (if pursuing factoring model)
- Treasury management
- Insurance for smart contract risk

**Estimated cost:** $200k-500k and 6-12 months of engineering time.

### Honest Assessment

**What we proved:**
- Invoice tokenization is technically feasible
- DeFi yields can be tracked per-invoice
- AI agents can automate strategy decisions
- Clean architecture and professional UI/UX are possible in Web3

**What we didn't prove:**
- Product-market fit (do crypto-native freelancers want this?)
- Unit economics (no revenue model defined)
- Go-to-market (how to reach target users?)
- Competitive advantage (why not use Lendle directly?)

**This project demonstrates technical competence, not business viability.**

---

## License

MIT
