# Elsa's Agentic Fellowship - Submission Draft

> Form: https://tally.so/r/PdEG21
> Status: DRAFT - needs personal details before submitting
> Last updated: 2026-03-19

---

## Page 1: Project Overview

### Project Name
Faktory

### Project X Handle
@soligxbt

### Github Repository
https://github.com/Yonkoo11/faktory

### Brief description of your project

Faktory is an autonomous treasury agent for crypto freelancers. You create an invoice, the agent tokenizes it as a privacy-preserving NFT, deposits collateral into a yield vault, and manages that idle capital until the client pays. The agent runs on a loop - it scores invoice risk, reads market conditions, picks between yield strategies, and auto-executes when it's confident enough. Below 70% confidence, it asks you first.

The stack is Solidity contracts (Foundry, all OpenZeppelin - chain-agnostic), a TypeScript agent service using Claude for reasoning, and a Next.js frontend. Contracts are deployed on Cronos testnet today, porting to Base for x402 integration.

### What problem are you solving?

Crypto freelancers and small agencies carry $20-100K in unpaid invoices at any time. Net-30/60/90 terms mean that money sits dead for weeks. Most people don't optimize it because the per-invoice amounts feel too small to bother with, and manually rotating yield positions across 5-10 open invoices is tedious. The ones who do try usually just dump everything in one vault and forget about it, missing better opportunities when conditions change. Faktory's agent handles the monitoring and rebalancing work so the freelancer doesn't think about it.

---

## Page 2: Founder & Team Information

### Founder Full Name
Alex <!-- TODO: add your last name -->

### Email Address
<!-- TODO: your email -->

### Telegram Handle
<!-- TODO: your telegram -->

### X (Twitter) Profile
https://x.com/soligxbt

### LinkedIn Profile
<!-- TODO: your LinkedIn URL -->

### Total Number of Team Members
1 (Solo founder)

### Details of Each Team Member

Alex (solo founder) - Full-stack developer shipping across DeFi, smart contracts, and AI agents. 34 public repos on GitHub. Recent work includes cipher-pol (ZK private payments for AI agents on Starknet using Groth16 proofs and x402), a Curve-style StableSwap DEX on Polkadot, an autonomous ERC-8004 trust scoring agent for Celo, and an SPL token rescue bot for compromised Solana wallets. Built Faktory end-to-end: Solidity contracts, TypeScript agent with Claude integration, and Next.js frontend.

### What relevant experience does your team have?

I've built and shipped across the stack that Faktory needs. On the smart contract side: DEX contracts (polkadot-stableswap), prediction markets (flashbets on Base with Chainlink), and ZK circuits (cipher-pol on Starknet). On the agent side: sentinel8004 (autonomous trust scoring agent on Celo), hermes-dojo (self-improving agent system), and Faktory's own yield agent using the Anthropic SDK. I've worked with x402 before - cipher-pol uses it for private agent payments. I build fast, ship to testnet, and iterate from there.

---

## Page 3: Competitive Advantage (Moat)

### What gives your project a long-term competitive advantage?

Two things. First, the agent's decision log. Every analysis records the invoice risk profile, market regime, strategy chosen, confidence score, and whether the outcome was good or bad. That data compounds - an agent that's processed 1,000 invoices makes better calls than one running on static rules. Second, the privacy layer. Invoice amounts and counterparties are stored as keccak256 hashes on-chain, not plaintext. Businesses won't put their billing rates on a public ledger.

### Why would it be difficult for others to replicate?

The contracts are open source, anyone can fork the vaults. What's hard to replicate is the agent's track record. An optimizer that's been right on 800 out of 1,000 calls is worth something. A fresh fork starts cold with zero history. Same dynamic as copy-trading - the strategy is visible but the track record isn't forkable.

### How do you plan to use Elsa x402 in your project?

Three specific integration points.

1. Yield discovery. The agent currently uses hardcoded yield sources. Replacing that with Elsa's get_yield_suggestions endpoint ($0.02/call) so it discovers opportunities across protocols in real time instead of me manually adding each one.

2. Price feeds and portfolio tracking. The agent needs token prices and balance data to score risk and time rebalances. Elsa's get_token_price ($0.002/call) and get_portfolio ($0.01/call) replace the mock oracle I built for the hackathon.

3. Swap execution. When the agent moves capital between strategies, it calls get_swap_quote + execute_swap ($0.03 total) with slippage protection across 20+ DEXs. Better than integrating each DEX individually.

x402 is the right model because the agent runs autonomously. It shouldn't depend on a human managing API subscriptions or rotating keys. Pay-per-call in USDC means the agent's cost scales with activity and is fully on-chain transparent.

### Network effects, proprietary data, or technological advantages?

The decision history is the proprietary dataset. Each analysis records: risk score, days until due, market regime (bull/bear/volatile/stable), strategy chosen, confidence level, and outcome. More invoices = better pattern matching = higher yields = more users. Eventually that data could train a specialized model, but right now it's a lookup table that gets denser with use.

---

## Page 4: Roadmap

### Key milestones for the next 3 months

- Deploy contracts on Base. The Solidity is pure OpenZeppelin with zero chain-specific code - verified this, it's a redeploy not a rewrite.
- Wire the agent to Elsa x402 endpoints for yield data, price feeds, and swap execution. Replace all mocked data sources.
- Run the agent on Base testnet against real protocols with test capital. Measure whether the optimizer picks better strategies than a static single-vault approach.
- Ship a working end-to-end loop: mint invoice, agent discovers yield via x402, executes strategy, client pays, user withdraws principal + yield. No human in the loop.

### Goals for 6-12 months

- Mainnet launch on Base with real capital. Starting small - $5-10K personal funds to prove it works before asking others to trust it.
- Onboard 10-20 crypto freelancers with real invoices. Source from freelancer communities, not cold outreach.
- Add multi-chain yield discovery using Elsa's cross-chain portfolio endpoints.
- Open-source the agent framework so other devs can build specialized agents on the same vault infrastructure.

### What will success look like in one year?

$500K in total invoice volume through the vaults. A small group of repeat users who depend on it for their business cash flow. The agent running for weeks without intervention and maintaining a yield track record that beats the "dump in one vault" approach by 1-2%. Not world-changing numbers, but proof that an autonomous treasury agent is a real product and not a hackathon demo.

---

## Page 5: Funding & Budget

### How much funding are you seeking?
$5,000

### Breakdown of how funds will be used

- $1,500 - Base deployment + gas for testing (multiple deploy cycles, agent transactions during development)
- $1,000 - Elsa x402 API usage during dev and testing (yield queries, swap execution, price feeds across thousands of test runs)
- $1,500 - Test capital seeded into vaults for the agent to execute real strategies against live protocols (stays in project treasury)
- $1,000 - Infrastructure (RPC access, agent hosting, domain)

### How will this funding accelerate your development?


### Wallet Address
<!-- TODO: your Base network wallet address (must accept USDC) -->

---

## Pre-Submit Checklist

- [ ] Fill in all TODO fields above (personal details, X handle, wallet)
- [ ] Write team member details and experience in your own voice
- [ ] Push uncommitted changes to GitHub (27 files pending)
- [ ] Verify GitHub repo is public and README looks current
- [ ] Consider: test one Elsa x402 endpoint before submitting (strengthens credibility)
- [ ] Review live site (faktory-app.vercel.app) - still shows Cronos, which is fine if README explains the Base port plan
- [ ] Copy each section into the Tally form
- [ ] Submit

---

## Honest Assessment

**What this application has going for it:**
- Real code (7,400+ lines across contracts/agent/frontend)
- Deployed contracts (Cronos testnet, chain-agnostic Solidity)
- x402 integration references actual endpoints and pricing
- Modest funding ask signals builder not grant-hunter
- Honest about simulated yields and testnet state

**What a judge would push back on:**
- Solo dev with 16 commits since January. Sparse activity.
- Two chain pivots already (Mantle -> Cronos -> Base). Looks opportunistic if not framed well.
- No evidence of user conversations or customer discovery.
- The optimizer "learning" is logged but there's no feedback loop coded yet.
- Haven't actually called an x402 endpoint. Claiming integration plans from docs alone.

**What I (Claude) did NOT verify:**
- Whether the Vercel deployment currently works
- Whether the GitHub repo README matches what judges would expect to see
- Whether any of the 27 uncommitted files contain breaking changes
- Whether the agent service actually runs today (last tested January)
