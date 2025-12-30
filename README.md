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

| Contract | Address |
|----------|---------|
| InvoiceNFT | `0xf35be6ffebf91acc27a78696cf912595c6b08aaa` |
| YieldVault | `0xd2cad31a080b0dae98d9d6427e500b50bcb92774` |
| AgentRouter | `0xec5bfee9d17e25cc8d52b8cb7fb81d8cabb53c5f` |

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

## Risks & Limitations

**This is a hackathon prototype.**

- Smart contracts are **not audited**
- No security review has been performed
- Use testnet only — do not deposit real funds
- Yields are estimates, not guarantees

Production deployment would require:
- Professional security audit
- Legal review for securities compliance
- Proper key management infrastructure

---

## License

MIT
