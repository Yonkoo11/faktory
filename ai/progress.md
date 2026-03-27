# Faktory - Progress

## Current State (2026-03-27)
All code phases complete. Ready for testnet deployment.

## Completed

### Phase 0: Clean Slate
- Removed: Remotion, disabled APIs, MantleYieldStrategy, old deploy scripts, stale docs

### Phase 1: Multichain Contracts
- AaveV3YieldSource.sol: real Aave V3 deposit/withdraw/getCurrentAPY
- DeployMultichain.s.sol: chain-agnostic deployer via env vars
- 6 chain configs (Ethereum, BSC, Base, Arbitrum, Polygon, SKALE)
- PythOracle: chain-agnostic, BNB feed added
- Fork tests: AaveV3Integration.t.sol (runs against Base mainnet fork)
- 70 unit tests pass, fork tests skip gracefully without RPC

### Phase 2: Frontend Multichain
- wagmi: 6 mainnets + 4 testnets
- Per-chain address registry with ChainMeta
- Chain switcher in header
- Dynamic explorer URLs per chain
- use-yield.ts: reads real Aave V3 APY via getReserveData, falls back to simulated

### Phase 3: Agent Production
- Demo mode killed (38 fake thoughts, market simulation removed)
- Agent shows "offline" honestly
- Railway config: Dockerfile, railway.toml, health endpoint
- Oracle: prefers Pyth, falls back to MockOracle
- mockOracle now optional in ContractAddresses

## Deployment Steps

### 1. Deploy to Base Sepolia
```bash
cd contracts
export PRIVATE_KEY=0x...
export BASE_SEPOLIA_RPC=https://...

# Deploy with Pyth + Aave
PYTH=0xA2aa501b19aff244D90cc15a4Cf739D2725B5729 \
AAVE_POOL=0x07eA79F68B2B3df564D0A34F8e19D9B1e339814b \
forge script script/DeployMultichain.s.sol -f $BASE_SEPOLIA_RPC --broadcast

# Copy addresses to app/src/lib/contracts/addresses.ts
```

### 2. Run fork tests
```bash
BASE_RPC=https://... forge test --match-contract AaveV3Integration -vv
```

### 3. Start agent
```bash
cd agent
RPC_URL=$BASE_SEPOLIA_RPC \
INVOICE_NFT_ADDRESS=0x... \
YIELD_VAULT_ADDRESS=0x... \
AGENT_ROUTER_ADDRESS=0x... \
PYTH_ORACLE_ADDRESS=0x... \
AAVE_YIELD_ADDRESS=0x... \
pnpm dev
```

### 4. Start frontend
```bash
cd app
NEXT_PUBLIC_BASE_SEPOLIA_RPC=$BASE_SEPOLIA_RPC \
NEXT_PUBLIC_NETWORK_MODE=testnet \
pnpm dev
```

### 5. Deploy agent to Railway
```bash
cd agent && railway up
# Set env vars in Railway dashboard
```
