# Faktory - Progress

## Current State (2026-03-27)
Phase 0 (cleanup) complete. Phase 1 (multichain contracts) in progress.

## What's Done
- Moved from archive to ~/Projects/faktory
- Committed hackathon snapshot (026f620)
- Removed: Remotion, disabled API routes, MantleYieldStrategy, DeployProduction, DeployCronos, mockups, screenshot scripts, stale docs
- Updated PITCH.md, DEMO.md, DEMO_SCRIPT.md (removed all Mantle/Cronos references)
- Updated foundry.toml with 6-chain RPC config (Ethereum, BSC, Base, Arbitrum, Polygon, SKALE)
- Created chain configs: contracts/script/config/{ethereum,bsc,base,arbitrum,polygon,skale}.json
- Updated Deploy.s.sol (local-only, MockOracle)

## What's In Progress
- Phase 1: AaveV3YieldSource.sol, DeployMultichain.s.sol, install aave-v3-core lib
- Phase 2: Frontend multichain wagmi config, address registry

## Target Chains
| Chain | Aave V3 | Pyth | Gas |
|-------|---------|------|-----|
| Ethereum | Yes | Yes | High |
| BSC | Yes | Yes | Low |
| Base | Yes | Yes | Low |
| Arbitrum | Yes | Yes | Low |
| Polygon | Yes | Yes | Low |
| SKALE | No (Hold only) | No | FREE |

## Architecture Decisions
- Yield: Aave V3 only (one integration done right)
- Agent: Railway deployment (persistent WebSocket service)
- Oracle: Pyth Network on all chains except SKALE
- SKALE: Hold strategy only (no yield, free gas)
- BSC testnet: no Aave V3, use mainnet fork for testing
