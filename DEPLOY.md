# Faktory Deployment Guide

## Prerequisites

1. **Node.js** 18+ and pnpm
2. **Foundry** - Install with `curl -L https://foundry.paradigm.xyz | bash && foundryup`
3. **MNT tokens** on Mantle Sepolia for gas

## Get Testnet MNT

1. Go to [Mantle Sepolia Faucet](https://faucet.sepolia.mantle.xyz/)
2. Connect your wallet
3. Request testnet MNT

## Step 1: Deploy Contracts

```bash
cd contracts

# Copy environment file
cp .env.example .env

# Edit .env and add your private key
# PRIVATE_KEY=0x...your_private_key...

# Deploy to Mantle Sepolia
make deploy-sepolia
```

Save the deployed addresses from the output.

## Step 2: Configure Frontend

Edit `app/.env`:

```env
# Contract addresses (from deployment)
NEXT_PUBLIC_INVOICE_NFT_ADDRESS=0x...
NEXT_PUBLIC_YIELD_VAULT_ADDRESS=0x...
NEXT_PUBLIC_PRIVACY_REGISTRY_ADDRESS=0x...
NEXT_PUBLIC_AGENT_ROUTER_ADDRESS=0x...
NEXT_PUBLIC_MOCK_ORACLE_ADDRESS=0x...

# Agent WebSocket URL
NEXT_PUBLIC_AGENT_WS_URL=ws://localhost:8080
```

## Step 3: Configure Agent

Edit `agent/.env`:

```env
# Mantle Sepolia RPC
MANTLE_RPC_URL=https://rpc.sepolia.mantle.xyz

# Agent wallet private key (needs MNT for gas)
AGENT_PRIVATE_KEY=0x...

# LLM API key (for AI explanations)
ANTHROPIC_API_KEY=your_api_key_here

# Contract addresses (from deployment)
INVOICE_NFT_ADDRESS=0x...
YIELD_VAULT_ADDRESS=0x...
AGENT_ROUTER_ADDRESS=0x...
MOCK_ORACLE_ADDRESS=0x...
```

## Step 4: Start the App

```bash
# Terminal 1: Start the agent
cd agent
pnpm install
pnpm start

# Terminal 2: Start the frontend
cd app
pnpm install
pnpm dev
```

## Step 5: Verify Configuration

After setting up, verify your configuration is correct:

**Contract Address Validation**:
- Open http://localhost:3000
- If you see a red error banner at the top, your contract addresses are invalid
- Check your `app/.env` file and ensure all addresses are correct (not 0x0000...)
- The banner will list which specific addresses are invalid

**Agent Health Check**:
- Navigate to http://localhost:3000/dashboard/agent
- Verify "Connected" status in top-right corner
- Watch for analysis cycles (every 30 seconds)
- If agent shows "Disconnected", check agent terminal for errors

## Step 6: Run End-to-End Tests

Use the comprehensive test checklist:

```bash
# Open the E2E test checklist
cat E2E_TEST_CHECKLIST.md
```

Complete the manual testing flows:
1. **Invoice Lifecycle**: Mint → Deposit → Agent Analysis → Change Strategy → Withdraw
2. **Error Handling**: Invalid addresses, timeouts, network disconnection
3. **UI/UX Verification**: Landing page, dashboard, agent activity
4. **Performance**: Build time, load time, transaction speed

**Expected Results**:
- All contract calls succeed
- Agent completes cycles in <30 seconds (timeout at 60s)
- No console errors
- Smooth UI transitions

## Video Demo Script (2-3 minutes)

### Opening Hook (0-15s)
**SCREEN**: Landing page with stats
**SAY**: "Businesses have $3 trillion locked in unpaid invoices. Instead of selling them at a discount to factoring companies, what if your invoices could earn yield while you wait?"

### Problem Statement (15-30s)
**SCREEN**: Scroll to "The Problem" section
**SAY**: "Traditional invoice factoring costs 2-5% and requires exposing sensitive client data. Faktory flips this — instead of paying middlemen, you earn DeFi yields."

### Connect & Dashboard (30-45s)
**SCREEN**: Click "Launch App" → Connect MetaMask → Dashboard appears
**SAY**: "Faktory runs on Mantle Network. Connect your wallet, and you're ready to tokenize invoices."

### Mint Invoice NFT (45-75s)
**SCREEN**: Click "Mint Invoice" → Fill form → Submit → See transaction
**SAY**: "Create an invoice — the client name, amount, and due date. When you submit, Faktory creates an NFT with a cryptographic privacy commitment. Your business data stays private, but the invoice is now a tradeable on-chain asset."
**SHOW**: Transaction confirmation, NFT appears in portfolio

### Deposit to Yield Vault (75-105s)
**SCREEN**: Click "Deposit" on the invoice → Strategy selection modal
**SAY**: "Now deposit the invoice value to our yield vault. Notice the APY — that's pulled live from Lendle, Mantle's native lending protocol. Choose Conservative for capital protection or Aggressive for higher yields."
**SHOW**: Live APY badge, approve transaction, deposit transaction

### Live Agent Reasoning (105-135s)
**SCREEN**: Navigate to "Agent" tab → Watch activity stream
**SAY**: "Here's where it gets interesting. An autonomous AI agent monitors your portfolio 24/7. Watch it analyze market conditions in real-time — it's checking oracle prices, calculating risk ratios, and deciding whether to rebalance."
**SHOW**: Agent activity cards streaming in, thinking/analysis/action types

### Market Stress Demo (135-155s)
**SCREEN**: Click "Simulate Market Crash" button
**SAY**: "What happens when markets crash? The agent detects risk through Pyth oracles and automatically switches to a defensive strategy. On Mantle, this costs less than a cent — making frequent AI decisions economically viable."
**SHOW**: Agent detecting crash, executing strategy change

### Closing Value Prop (155-180s)
**SCREEN**: Return to portfolio showing yield accrued
**SAY**: "Faktory transforms invoices from idle assets into yield-generating instruments. Privacy-preserving, AI-optimized, and built for Mantle's low-cost, high-throughput environment. Turn your receivables into revenue."

---

### Key Points for Judges

1. **Real Blockchain Integration** - All transactions write to Mantle Sepolia testnet
2. **Live DeFi Data** - APY rates fetched from Lendle protocol on Mantle mainnet
3. **Autonomous Agent** - Rule-based optimizer with LLM explanation layer
4. **Privacy Architecture** - Cryptographic commitments, ZK-ready design
5. **Mantle-Native** - Sub-cent gas enables frequent agent execution

## Troubleshooting

### "Insufficient funds"
Get more MNT from the faucet: https://faucet.sepolia.mantle.xyz/

### "Agent not connecting"
Make sure the agent is running and WS_PORT matches NEXT_PUBLIC_AGENT_WS_URL.
- Check agent terminal for errors
- Verify WebSocket port is not blocked by firewall
- Try restarting the agent service

### "Contract call failed"
Verify the contract addresses in .env match your deployment.
- The red error banner will show which addresses are invalid
- Ensure addresses are not 0x0000...
- Verify contracts are actually deployed to the network

### "Configuration Error" banner appears
Your environment variables are not set correctly:
1. Check `app/.env` file exists (copy from `app/.env.example`)
2. Ensure all `NEXT_PUBLIC_*_ADDRESS` variables are set
3. Verify addresses are valid checksummed Ethereum addresses
4. Restart the dev server after changing .env

### "Analysis cycle timed out"
The agent's analysis cycle exceeded 60 seconds:
- This is normal if RPC is slow or network is congested
- The agent will automatically retry on the next cycle
- Circuit breaker will trip after repeated timeouts
- Check Mantle Sepolia network status

### "WebSocket disconnected"
The agent WebSocket connection dropped:
- Agent will automatically reconnect with exponential backoff
- Max 5 reconnection attempts
- If persistent, check agent service logs
- Verify NEXT_PUBLIC_AGENT_WS_URL is correct

### "Transaction underpriced"
Gas price too low for current network conditions:
- MetaMask will suggest a higher gas price
- Accept the suggested price
- Mantle gas is extremely cheap, even at higher prices

---

## Production Deployment

### Frontend (Vercel)
```bash
cd app
vercel --prod
```

Set environment variables in Vercel dashboard:
- All `NEXT_PUBLIC_*` variables from `.env`

### Agent Service (Railway/Render)
```bash
cd agent
# Push to Railway or Render
# Set environment variables in platform dashboard
```

Required environment variables:
- `MANTLE_RPC_URL`
- `AGENT_PRIVATE_KEY`
- `ANTHROPIC_API_KEY`
- All contract addresses

Update frontend `NEXT_PUBLIC_AGENT_WS_URL` to point to production agent.
