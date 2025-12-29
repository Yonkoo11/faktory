# Faktory Frontend

Next.js 15 dashboard for the Faktory Protocol - tokenized invoice yield optimization on Mantle.

## Quick Start

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## Features

- **Dashboard**: Portfolio overview with real-time yield tracking
- **Invoice Minting**: Tokenize invoices with privacy-preserving commitments
- **Agent Monitor**: Watch AI agent decisions in real-time via WebSocket
- **Issuer Controls**: Privacy settings and selective disclosure

## Environment Variables

```bash
# Required for contract interaction
NEXT_PUBLIC_INVOICE_NFT_ADDRESS=0x...
NEXT_PUBLIC_YIELD_VAULT_ADDRESS=0x...
NEXT_PUBLIC_AGENT_ROUTER_ADDRESS=0x...

# Optional
NEXT_PUBLIC_CHAIN_ID=5003  # Mantle Sepolia
NEXT_PUBLIC_AGENT_WS_URL=ws://localhost:8080
```

## Tech Stack

- Next.js 15 (App Router)
- wagmi v3 + viem for Web3
- TailwindCSS + shadcn/ui
- React Query for data fetching

## Scripts

```bash
pnpm dev        # Development server
pnpm build      # Production build
pnpm lint       # ESLint
pnpm tsc        # Type check
```
