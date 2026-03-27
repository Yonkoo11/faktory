# Faktory - Progress

## Current State (2026-03-27)
Deployed to Base Sepolia. All flows verified on-chain and in UI. Agent runs with real Pyth + Claude analysis.

## Verified Working (with evidence)

### On-chain (Base Sepolia, chain 84532)
- **Mint**: InvoiceNFT.mint() -> token 0 created, ownerOf confirmed
- **Deposit**: approve + deposit -> NFT transferred to vault, status InYield, TVL updated
- **Yield accrual**: getAccruedYield returned 355149670218163 wei after ~30s
- **Withdraw**: NFT returned to owner, TVL back to 0, status Active
- **All contracts wired**: InvoiceNFT <-> YieldVault <-> AgentRouter confirmed via cast calls

### Agent
- Connects to Base Sepolia, reads contracts, detects invoices
- Pyth Oracle: fetched real ETH price ($2063-2064)
- Claude Haiku 4.5: generates real analysis (not templates)
- Health endpoint works at :3001/health
- No errors (event filters disabled, polling-only)

### Frontend
- All 5 routes return 200: /, /dashboard, /dashboard/agent, /dashboard/mint, /dashboard/issuer
- Landing page renders with terminal aesthetic
- Dashboard shows portfolio stats from on-chain data
- Agent page shows ONLINE status, LIVE activity feed
- basePath issue fixed (was serving under /faktory/ prefix from GitHub Pages config)

## Deployed Addresses (Base Sepolia)
```
InvoiceNFT:       0x515ab226DD7917612eeDd439A9Cfb0b4b1731440
YieldVault:       0xacBeB5f58604A4A9A8B9a74EC39ebCA1117bC326
PrivacyRegistry:  0xaA9e2C3DF776c3d552E2358AcF8155C91929EF1B
AgentRouter:      0xEe9AD131A155E7669004056F01fFb26964637Fd4
PythOracle:       0xA0E9510fBe1Ee857B255B2960438122fdA0b32E3
AaveV3YieldSource:0x447De96C1c3E15af485a41fb1B5Fde888B02d9eF
```

## Remaining Issues (honest)
- USDC APY on landing page shows 57.59% (simulated fallback, not real Aave data)
  - Root cause: wallet not connected, so Aave read is disabled, falls back to simulated
  - Fix: either show "simulated" label clearly, or fetch APY without wallet connection
- CRO asset in useYieldMarkets() is a leftover from Cronos
- use-yield.ts backward-compat aliases (useLendleAPY, useLendleMarkets) still exist
- LendleYieldSource.sol still in contracts/src/ (unused but present)
- No mainnet deployments yet
- Agent persistence (PostgreSQL) not implemented
- WalletConnect projectId is "dummy-project-id" (needs real one for production)

## Deployer Wallet
Address: 0x8dd7b3f45695Fe6a7C03183F5E3AE5237fb957e8
Balance: ~0.000946 ETH (Base Sepolia)
