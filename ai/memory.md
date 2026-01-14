# Project Memory - Faktory Protocol

## Project Type & Relevant Plugins
- **Type:** Full-stack DeFi app (smart contracts + frontend + AI agent)
- **Has UI?** Yes (Next.js dashboard)
- **Plugins to use:**
  - [x] frontend-design (UI work) - **NOT USED** (process failure)
  - [x] code-simplifier (code cleanup) - **NOT USED** (process failure)
  - [ ] pyright-lsp (N/A - TypeScript, not Python)

## Plugin Usage Log
| Date | Plugin | Used On | Notes |
|------|--------|---------|-------|
| 2024-12-30 | frontend-design | SKIPPED | Should have been used during UX redesign |
| 2024-12-31 | code-simplifier | SKIPPED | Should have been run before shipping |
| 2026-01-14 | (retroactive logging) | N/A | Memory system created post-development |
| 2026-01-14 | frontend-design | Landing + Dashboard | Color consistency, visual polish |
| 2026-01-14 | code-simplifier | page.tsx, dashboard/page.tsx | Removed unused imports, cleaned up destructuring |

## Key Decisions

### Architecture
- **Monorepo structure:** contracts/ + agent/ + app/ in single repo
- **Network:** Mantle L2 (Sepolia testnet) for low gas costs
- **Yield source:** Simulated Lendle integration (not real for demo)
- **Privacy:** Commitment scheme (keccak256 hashes) instead of full ZK

### Why Mantle?
- Low gas fees for frequent transactions
- Growing DeFi ecosystem (Lendle, etc.)
- Hackathon target network

### Why NOT real Lendle integration?
- Time constraints (hackathon deadline)
- Would require audit before mainnet
- Demo works without real yields

## Learned Context

### Smart Contracts
- 5 contracts deployed on Mantle Sepolia
- InvoiceNFT: ERC-721 with privacy commitments
- YieldVault: Deposit/withdraw + strategy selection
- AgentRouter: AI decision recording
- MockOracle: Simulated risk scoring

### Frontend
- Next.js 15 + wagmi v3 for wallet integration
- shadcn/ui component library (75+ components)
- Light theme (Stripe/Linear aesthetic)

### Agent
- TypeScript service with WebSocket
- Claude AI for decision-making
- 30-second monitoring intervals
- Auto-execute when confidence > 80%

## Gotchas & Warnings

1. **Agent service runs locally** - Not deployed to production
2. **Yields are simulated** - No real Lendle pool connection
3. **QuickBooks OAuth works** but invoice import doesn't
4. **MockOracle** returns hardcoded values, not real data

## Process Failures

### 2026-01-14: Memory System Never Created
- Project started without `ai/` directory
- No session tracking or plugin usage logging
- Only discovered at hackathon submission time

### 2024-12-30: frontend-design Plugin Skipped
- UX redesign done manually
- Plugin would have provided additional design guidance
- Result was still good, but process wasn't followed

### 2024-12-31: code-simplifier Not Run
- Code shipped without final cleanup pass
- Should have been run before `/ship-checklist`

## Reflections

### What Worked
- Professional UI despite hackathon timeline
- Clean contract architecture
- Comprehensive documentation (README, DEMO.md, etc.)
- Honest about limitations (real vs simulated)

### What Didn't
- Process not followed (no ai/ directory, no plugins)
- Agent not deployed to production
- No real yield integration

### For Next Time
1. ALWAYS create `ai/` directory on first interaction
2. ALWAYS invoke plugins at their designated tier points
3. Use `/session-start` to begin every coding session properly
