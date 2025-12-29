# Faktory Contracts

Solidity smart contracts for the Faktory Protocol on Mantle Network.

## Contracts

| Contract | Description |
|----------|-------------|
| `InvoiceNFT` | ERC-721 tokenized invoices with privacy commitments |
| `YieldVault` | Manages yield strategies (Hold/Conservative/Aggressive) |
| `AgentRouter` | Routes AI agent decisions to execute strategies |
| `PythOracle` | Real-time price feeds via Pyth Network |
| `LendleYieldSource` | Integration with Lendle lending protocol |
| `FaktoryFactory` | Atomic deployment of entire protocol |

## Deployed (Mantle Sepolia)

```
InvoiceNFT:   0xf35be6ffebf91acc27a78696cf912595c6b08aaa
YieldVault:   0xd2cad31a080b0dae98d9d6427e500b50bcb92774
AgentRouter:  0xec5bfee9d17e25cc8d52b8cb7fb81d8cabb53c5f
```

## Quick Start

```bash
# Build
forge build

# Test (46 tests)
forge test

# Deploy locally
anvil &
forge script script/DeployFactory.s.sol --rpc-url http://localhost:8545 --broadcast

# Deploy to Mantle Sepolia
forge script script/DeployProduction.s.sol --rpc-url https://rpc.sepolia.mantle.xyz --broadcast
```

## Architecture

```
InvoiceNFT ←→ YieldVault ←→ AgentRouter
     ↓            ↓
  Oracle    LendleYieldSource
```

## Key Features

- **Privacy**: Invoice data stored as cryptographic commitments
- **Yield Strategies**: Simulated 0-7% APY based on strategy
- **AI Agent**: Authorized agents can execute strategy changes
- **Pagination**: Scalable queries with `getActiveInvoicesPaginated()`

## Security

- OpenZeppelin contracts for access control
- Pausable for emergency stops
- Rate limiting on agent decisions
- MAX_PRINCIPAL bounds on deposits
