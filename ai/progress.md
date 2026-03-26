# Faktory - Progress

## Current State (2026-03-27)
Phases 0-2 complete. Phase 3 (agent production) is next.

## What's Done

### Phase 0: Clean Slate (commit 8af2cbc)
- Moved from ~/Archive to ~/Projects/faktory
- Committed hackathon snapshot (026f620)
- Removed: Remotion, disabled API routes, MantleYieldStrategy, DeployProduction, DeployCronos, mockups, stale docs

### Phase 1: Multichain Contracts (commits ae623fc, d4897bb)
- AaveV3YieldSource.sol: real yield via Aave V3 deposits (deposit/withdraw/getCurrentYield/getCurrentAPY)
- DeployMultichain.s.sol: chain-agnostic deployer (PythOracle + AaveV3, env-configured)
- Chain configs: contracts/script/config/{ethereum,bsc,base,arbitrum,polygon,skale}.json
- PythOracle: chain-agnostic (removed MNT, added BNB feed, getNativeUsdPrice)
- aave-v3-core installed as git submodule
- All 70 tests passing across 5 suites

### Phase 2: Frontend Multichain (commits ae623fc, 978621e)
- wagmi.ts: 6 mainnet chains (ETH, BSC, Base, Arbitrum, Polygon, SKALE) + 4 testnets
- addresses.ts: per-chain registry with ChainMeta (explorer URLs, gas labels, Aave/Pyth flags)
- dashboard-header.tsx: chain switcher dropdown with status indicators
- All Cronos/Mantle/Lendle references removed from app/src and agent/src
- Frontend builds clean

## What's Next

### Phase 3: Agent Production
- Kill demo mode (remove DEMO_THOUGHTS, demo fallbacks)
- Multichain agent (WebSocket per chain, route decisions to correct AgentRouter)
- Real LLM analysis (stop falling back to templates)
- Deploy to Railway
- Agent persistence (PostgreSQL for decision history)

### Phase 4: E2E Verification
- Test full flow per chain on testnets
- Fork tests against real Aave V3

### Phase 5: Mainnet Deploy
- Deploy to mainnets, verify, demo video

## Architecture
- 6 chains: Ethereum, BSC, Base, Arbitrum, Polygon, SKALE
- Yield: Aave V3 only (SKALE = Hold only)
- Oracle: Pyth Network (SKALE = no oracle)
- Agent: Railway deployment target
- Frontend: Next.js 15 + wagmi multichain
