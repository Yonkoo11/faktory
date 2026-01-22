# Faktory Protocol

> AI-Managed B2B Payments on Cronos

Faktory demonstrates AI-driven PayTech by letting autonomous agents optimize yield strategies for tokenized B2B invoices. Mint your invoice as an NFT, let the AI agent manage yield exposure while waiting for payment, and settle on-chain when your client pays. Your invoice details stay private — only cryptographic hashes go on-chain.

**[Live Demo](https://faktory-app.vercel.app/)** · Built for Cronos x402 PayTech Hackathon

---

## x402: Agentic Finance in Action

Faktory showcases the x402 vision of autonomous financial agents:

- **AI Agent Monitors 24/7** — Continuously analyzes invoice health, risk scores, and yield opportunities
- **Autonomous Strategy Recommendations** — Agent evaluates Conservative vs Aggressive yield strategies based on invoice due dates and payment probability
- **Human-in-the-Loop** — Auto-executes only above 70% confidence; user approves lower-confidence decisions
- **On-Chain Payments** — Clients pay invoices directly via smart contract, settling the entire lifecycle on Cronos

This is what happens when machines handle real financial decisions autonomously.

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
Connect Wallet → Mint Invoice → Deposit to Vault → AI Manages Yield → Client Pays On-Chain → Withdraw
```

1. **Mint** — Create an NFT representing your invoice
2. **Deposit** — Put equivalent CRO into a yield vault
3. **AI Agent** — Monitors and optimizes your yield strategy
4. **Pay** — Client pays invoice directly on-chain via x402
5. **Withdraw** — Get principal + yield when payment settles

---

## What Faktory Does NOT Do

- **Advance cash** — We don't lend against invoices
- **Collect payments** — We don't chase your clients
- **Verify invoices** — We trust what you enter
- **Guarantee returns** — DeFi yields fluctuate
- **Support fiat** — Crypto only
- **Onboard non-crypto users** — Wallet required

---

## Success Criteria

This project succeeds if:
- User can mint an invoice in < 2 minutes
- User can deposit and see yield accruing
- AI agent analyzes and recommends strategies
- Client can pay invoice on-chain
- User can withdraw principal + yield without issues

---

## Scope

**In scope (what we built):**
- Wallet connection (Cronos Testnet)
- Invoice minting (manual entry)
- On-chain payment (x402 pay invoice)
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
| Network | Cronos (Chain ID 338) |
| Contracts | Solidity (Foundry) |
| Frontend | Next.js + wagmi + Tailwind |
| Agent | TypeScript + WebSocket |
| Yield | Simulated (for demo) |
| Oracles | MockOracle (for demo) |

---

## Deployed Contracts (Cronos Testnet)

**Chain ID:** 338
**Deployment Date:** 2026-01-22

| Contract | Address |
|----------|---------|
| InvoiceNFT | [`0xEde6Db2855BACF191E5B2E2d91B6276bB56bf183`](https://explorer.cronos.org/testnet3/address/0xEde6Db2855BACF191E5B2E2d91B6276bB56bf183) |
| YieldVault | [`0xD0db0eb608107862E963737FE87ffdFF7f400e3C`](https://explorer.cronos.org/testnet3/address/0xD0db0eb608107862E963737FE87ffdFF7f400e3C) |
| AgentRouter | [`0xb8F4546e24e437779bC09c3b70ce70Ff9542bdD4`](https://explorer.cronos.org/testnet3/address/0xb8F4546e24e437779bC09c3b70ce70Ff9542bdD4) |
| PrivacyRegistry | [`0xf9e5a9E147856D9B26aB04202D79C2c3dA4a326B`](https://explorer.cronos.org/testnet3/address/0xf9e5a9E147856D9B26aB04202D79C2c3dA4a326B) |
| MockOracle | [`0x9A6d36A0487EA52df43E7704a97F47844C4Eac4E`](https://explorer.cronos.org/testnet3/address/0x9A6d36A0487EA52df43E7704a97F47844C4Eac4E) |

[View on Cronos Explorer](https://explorer.cronos.org/testnet3)

---

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm
- Foundry (for contracts)
- MetaMask with Cronos Testnet configured

### Add Cronos Testnet to MetaMask

| Setting | Value |
|---------|-------|
| Network Name | Cronos Testnet |
| RPC URL | https://evm-t3.cronos.org |
| Chain ID | 338 |
| Symbol | TCRO |
| Explorer | https://explorer.cronos.org/testnet3 |

Get test CRO from the [Cronos Faucet](https://cronos.org/faucet).

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
forge script script/DeployCronos.s.sol --rpc-url https://evm-t3.cronos.org --broadcast --slow
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

## x402 Payment Flow

The `payInvoice` function enables on-chain invoice settlement:

```solidity
function payInvoice(uint256 tokenId) external payable {
    // Validates invoice is payable (Active or InYield)
    // Transfers payment to invoice owner
    // Updates status to Paid
    // Emits InvoicePaid event
}
```

Clients can pay invoices directly through the UI or programmatically via the smart contract.

---

## Known Limitations (Hackathon Prototype)

**This is a demonstration project built for Cronos x402 PayTech Hackathon.**

### What's Real vs Simulated

#### Fully Functional
- Smart contracts deployed on Cronos Testnet
- Wallet connection and transaction signing
- Invoice NFT minting and ownership tracking
- On-chain invoice payment (x402)
- Deposit/withdrawal flows
- Dashboard UI and data visualization
- Agent service with WebSocket communication

#### Simulated for Demo
**Yields are SIMULATED:**
- YieldVault uses hardcoded APY rates:
  - Conservative: 3.5% APY (constant)
  - Aggressive: 7.0% APY (constant)
- Yield calculation: `(principal × APY × time) / (365 days × 10000)` on-chain
- Real DeFi integration exists in contract architecture but not activated for demo

**Why simulated?** Integrating live DeFi pools requires production addresses, mainnet liquidity, and complex error handling. For hackathon purposes, simulated yields demonstrate the mechanism.

#### Partial Implementation
**Agent Service:**
- Runs as single Node.js process (port 8080)
- No database persistence (in-memory state only)
- Production would require job queue, PostgreSQL, and monitoring

**Privacy Commitments:**
- Invoice data stored as `keccak256` hashes on-chain
- Reveal verification exists but not used in UI
- True privacy would require zero-knowledge proofs

### Security & Legal Disclaimers

**Not Production-Ready:**
- Smart contracts are **NOT audited**
- No formal security review performed
- Use **testnet only** — do not deposit real funds
- Deployer retains admin privileges

### Honest Assessment

**What we proved:**
- Invoice tokenization is technically feasible
- On-chain payments work (x402)
- AI agents can automate strategy decisions
- Clean architecture and professional UI/UX are possible in Web3

**What we didn't prove:**
- Product-market fit
- Unit economics
- Go-to-market strategy

**This project demonstrates technical competence in agentic finance.**

---

## License

MIT
