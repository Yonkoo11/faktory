# Faktory - Progress

## Current State (2026-03-27)
Phases 0-3 complete (code changes). Phase 4 (E2E testing) and Phase 5 (deployment) require real RPCs and chain access.

## What's Done

### Phase 0: Clean Slate
- Moved from ~/Archive to ~/Projects/faktory
- Removed: Remotion, disabled API routes, MantleYieldStrategy, old deploy scripts, stale docs
- Updated PITCH.md, DEMO.md, DEMO_SCRIPT.md

### Phase 1: Multichain Contracts
- AaveV3YieldSource.sol: real Aave V3 yield (deposit/withdraw/getCurrentAPY)
- DeployMultichain.s.sol: chain-agnostic deployer (env-configured)
- 6 chain configs: Ethereum, BSC, Base, Arbitrum, Polygon, SKALE
- PythOracle: chain-agnostic, 70 tests passing

### Phase 2: Frontend Multichain
- wagmi.ts: 6 mainnets + 4 testnets
- addresses.ts: per-chain registry with ChainMeta
- Chain switcher dropdown in header
- All Cronos/Mantle references purged

### Phase 3: Agent Production
- Killed demo mode: removed 38 fake DEMO_THOUGHTS, triggerDemoScenario, simulateMarketDrop
- UI shows "Agent offline" honestly when agent is down
- Railway config: Dockerfile, railway.toml, health endpoint at /health
- Dynamic explorer URLs per chain

## What's Next

### Phase 4: E2E Testing (needs real RPCs)
1. Deploy contracts to Base Sepolia with: PYTH=... AAVE_POOL=... forge script DeployMultichain -f $BASE_SEPOLIA_RPC --broadcast
2. Update addresses.ts with deployed addresses
3. Test full mint->deposit->yield->withdraw flow
4. Run fork tests: forge test --fork-url $BASE_RPC

### Phase 5: Mainnet Deploy
1. Deploy to each mainnet
2. Start agent on Railway
3. Record demo video

## Git Log
```
4255bac Phase 3: Kill demo mode, add Railway deploy, fix explorer URLs
978621e Remove all Cronos/Mantle references, make codebase chain-agnostic
d4897bb Make PythOracle chain-agnostic, remove Mantle-specific feeds
ae623fc Add multichain contract infrastructure and frontend chain support
8af2cbc Phase 0: Clean slate for production rebuild
026f620 Snapshot hackathon state before production rebuild
```
