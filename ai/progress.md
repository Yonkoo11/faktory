# Faktory Protocol - Progress

## Last Session Summary
- **Date:** 2026-03-19
- **What was done:**
  - Applied to HeyElsa Agentic Fellowship (Tally form submitted)
  - Drafted and submitted all 24 form fields
  - Submission file: `ai/heyelsa-fellowship-submission.md`
  - Verified contracts are chain-agnostic (pure OpenZeppelin, zero Cronos-specific Solidity)
  - Identified 4 frontend files needing changes for Base port (addresses.ts, wagmi.ts, server.ts, errors.ts)
  - Confirmed 27 uncommitted files in repo

- **What's next:**
  1. Wait for HeyElsa fellowship response
  2. If accepted: port contracts to Base, wire agent to x402 endpoints
  3. Push uncommitted changes to GitHub (27 files still pending)
  4. PITCH.md and DEMO.md still reference Mantle (never updated)

- **Blockers/Issues:**
  - Demo video doesn't exist - biggest blocker
  - Live site (faktory-app.vercel.app) still shows Mantle, not Cronos
  - PITCH.md and DEMO.md reference old Mantle hackathon

## Handover Notes

### Submission Deadline: TODAY (Jan 23, 2026)

### DoraHacks Form Status:
| Field | Status |
|-------|--------|
| BUIDL name | Ready: "Faktory Protocol" |
| Logo | Have banner, need 480x480 square crop |
| Vision | Ready (see below) |
| Is AI Agent? | Yes |
| GitHub | Ready: https://github.com/Yonkoo11/faktory |
| Website | https://faktory-app.vercel.app (needs redeploy) |
| Demo video | MISSING - required |
| Social links | Need from user |

### Vision Statement (ready to paste):
> B2B freelancers and agencies wait 30-90 days for invoice payment while that capital sits idle. Faktory solves this by letting them earn 3-7% DeFi yield on unpaid invoices through an autonomous AI treasury agent. The agent monitors invoices 24/7, analyzes risk, and auto-executes yield strategies via x402 payment rails on Cronos. When clients pay, x402 enables direct on-chain settlement - machines paying machines.

### Tracks to submit:
- Main Track (x402 Applications) - Yes
- x402 Agentic Finance Track - Strong fit
- Crypto.com X Cronos Ecosystem - Maybe

### Deployed Contracts (Cronos Testnet - Chain ID 338):
- InvoiceNFT: 0xEde6Db2855BACF191E5B2E2d91B6276bB56bf183
- YieldVault: 0xD0db0eb608107862E963737FE87ffdFF7f400e3C
- AgentRouter: 0xb8F4546e24e437779bC09c3b70ce70Ff9542bdD4
- PrivacyRegistry: 0xf9e5a9E147856D9B26aB04202D79C2c3dA4a326B
- MockOracle: 0x9A6d36A0487EA52df43E7704a97F47844C4Eac4E

### Files to Update for Cronos:
- PITCH.md (still says Mantle)
- DEMO.md (still says Mantle)

### Uncommitted Changes:
```
M app/package.json
M app/src/app/dashboard/agent/page.tsx
M app/src/app/dashboard/invoice/[id]/page.tsx
M app/src/app/dashboard/mint/page.tsx
M app/src/app/dashboard/page.tsx
D app/src/app/globals-faktory.css
M app/src/app/globals.css
M app/src/app/layout.tsx
M app/src/app/page.tsx
+ many more...
```

### Remotion Setup:
There's a `/app/src/remotion/` folder - could potentially use for programmatic demo video generation.
