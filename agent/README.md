# Faktory Agent

> Autonomous AI agent for optimizing invoice yield strategies on Mantle L2

The Faktory Agent monitors deposited invoice NFTs and automatically rebalances yield strategies between Conservative (3.5% APY) and Aggressive (7% APY) based on time-to-due-date and market conditions.

---

## Features

- **Autonomous Monitoring** - Continuously scans active invoice deposits
- **AI-Powered Decisions** - Uses Claude AI to recommend optimal strategies
- **WebSocket API** - Real-time updates to frontend dashboard
- **Gas-Aware Execution** - Only executes when gas prices are favorable
- **Confidence Scoring** - Only auto-executes high-confidence decisions (>70%)

---

## Prerequisites

- **Node.js** 18+
- **pnpm** (or npm/yarn)
- **Mantle Sepolia testnet RPC access** (default: public RPC)
- **Anthropic API key** (optional - uses template mode if not provided)
- **Agent wallet with MNT** (optional - read-only mode if no private key)

---

## Quick Start

### 1. Install Dependencies

```bash
cd agent
pnpm install
```

### 2. Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your values
nano .env
```

**Minimum required (for read-only mode):**
```bash
MANTLE_RPC_URL=https://rpc.sepolia.mantle.xyz
INVOICE_NFT_ADDRESS=0xf35be6ffebf91acc27a78696cf912595c6b08aaa
YIELD_VAULT_ADDRESS=0xd2cad31a080b0dae98d9d6427e500b50bcb92774
AGENT_ROUTER_ADDRESS=0xec5bfee9d17e25cc8d52b8cb7fb81d8cabb53c5f
MOCK_ORACLE_ADDRESS=0xede6db2855bacf191e5b2e2d91b6276bb56bf183
```

**For full functionality (auto-execution):**
```bash
# Add wallet private key (REQUIRED for transactions)
AGENT_PRIVATE_KEY=0x1234...  # Must have MNT for gas

# Add Anthropic API key (optional - uses templates if missing)
ANTHROPIC_API_KEY=sk-ant-...
```

### 3. Start the Agent

```bash
pnpm dev
```

**Expected output:**
```
  ███████╗ █████╗ ██╗  ██╗████████╗ ██████╗ ██████╗ ██╗   ██╗
  ██╔════╝██╔══██╗██║ ██╔╝╚══██╔══╝██╔═══██╗██╔══██╗╚██╗ ██╔╝
  █████╗  ███████║█████╔╝    ██║   ██║   ██║██████╔╝ ╚████╔╝
  ██╔══╝  ██╔══██║██╔═██╗    ██║   ██║   ██║██╔══██╗  ╚██╔╝
  ██║     ██║  ██║██║  ██╗   ██║   ╚██████╔╝██║  ██║   ██║
  ╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝    ╚═════╝ ╚═╝  ╚═╝   ╚═╝

  Autonomous Invoice Yield Optimization on Mantle

============================================================
  📡 RPC: https://rpc.sepolia.mantle.xyz
  🔌 WebSocket: ws://localhost:8080
  🔑 Wallet: ✅ Configured
  🤖 LLM: ✅ Claude AI (Real)
============================================================

  Data Sources:
  📊 Oracle: ⚠️  Mock Oracle (Simulated)
  💰 Yield: ⚠️  Simulated Yield

  ⚠️  Running with SIMULATED data for demo.
  Set PYTH_ORACLE_ADDRESS and LENDLE_YIELD_ADDRESS for production.
============================================================

✅ Faktory Agent is live. Press Ctrl+C to stop.
```

### 4. Connect Frontend

In a separate terminal, start the frontend:
```bash
cd ../app
pnpm dev
```

Visit `http://localhost:3000/dashboard/agent` to see the agent in action.

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MANTLE_RPC_URL` | No | `https://rpc.sepolia.mantle.xyz` | Mantle Sepolia RPC endpoint |
| `AGENT_PRIVATE_KEY` | No | - | Wallet private key (required for auto-execution) |
| `ANTHROPIC_API_KEY` | No | - | Claude AI API key (uses templates if missing) |
| `WS_PORT` | No | `8080` | WebSocket server port |
| `INVOICE_NFT_ADDRESS` | Yes | - | InvoiceNFT contract address |
| `YIELD_VAULT_ADDRESS` | Yes | - | YieldVault contract address |
| `AGENT_ROUTER_ADDRESS` | Yes | - | AgentRouter contract address |
| `MOCK_ORACLE_ADDRESS` | Yes | - | Oracle contract address |
| `PYTH_ORACLE_ADDRESS` | No | - | Pyth Network oracle (production) |
| `LENDLE_YIELD_ADDRESS` | No | - | Lendle yield source (production) |

### Getting Required Values

**Contract Addresses:**
Already pre-filled in `.env.example` for Mantle Sepolia testnet.

**Agent Private Key:**
```bash
# Create new wallet (use for testnet only)
cast wallet new

# Fund with testnet MNT from faucet:
# https://faucet.sepolia.mantle.xyz/
```

**Anthropic API Key:**
1. Sign up at https://console.anthropic.com/
2. Create a new API key
3. Add to `.env`: `ANTHROPIC_API_KEY=sk-ant-...`

---

## How It Works

```
┌─────────────────────────────────────────────────────────┐
│  Faktory Agent                                          │
│                                                         │
│  1. Monitor YieldVault for active deposits             │
│  2. Analyze each invoice (due date, risk score, APY)   │
│  3. Ask Claude AI: "Conservative or Aggressive?"       │
│  4. Record decision in AgentRouter contract            │
│  5. Auto-execute if confidence > 70%                   │
│  6. Broadcast updates via WebSocket                    │
│                                                         │
│  Loop every 30 seconds                                 │
└─────────────────────────────────────────────────────────┘
```

### Decision Logic

**Conservative Strategy (3.5% APY):**
- Invoice due within 30 days
- High risk score (>70)
- Prefer capital preservation

**Aggressive Strategy (7% APY):**
- Invoice due in 60+ days
- Low risk score (<40)
- Maximize yield potential

**Claude AI considers:**
- Days until due date
- Risk score from oracle
- Payment probability
- Current strategy performance

---

## Troubleshooting

### Port 8080 Already in Use

```bash
# Find process using port 8080
lsof -ti:8080

# Kill it
lsof -ti:8080 | xargs kill

# Or change port in .env
WS_PORT=8081
```

### Contract Addresses Not Set

```
❌ Environment Validation Failed:
   - INVOICE_NFT_ADDRESS (InvoiceNFT contract) is required but not set
```

**Fix:** Update `.env` with deployed contract addresses (pre-filled in `.env.example`).

### WebSocket Connection Failed (Frontend)

**Check agent is running:**
```bash
# Should show agent process
lsof -i :8080
```

**Check firewall:**
```bash
# macOS: Allow incoming connections on port 8080
# System Settings → Network → Firewall → Options
```

**Frontend connecting to wrong port:**
```typescript
// app/src/app/dashboard/agent/page.tsx
const ws = new WebSocket('ws://localhost:8080') // ✅ Match WS_PORT
```

### "Insufficient funds for gas"

**Agent wallet needs MNT:**
```bash
# Check balance
cast balance $AGENT_ADDRESS --rpc-url https://rpc.sepolia.mantle.xyz --ether

# Fund from faucet
# https://faucet.sepolia.mantle.xyz/
```

### Anthropic API Rate Limits

```
⚠️  Claude AI rate limit exceeded
```

**Solutions:**
1. Reduce `analysisInterval` in `src/index.ts` (default: 30s)
2. Upgrade Anthropic plan
3. Run in template mode (remove `ANTHROPIC_API_KEY`)

### Agent Crashes During Rebalance

**Expected behavior:** Agent is single process, crashes lose in-memory state.

**Production solution:**
- Add job queue (Redis/Bull)
- Add database persistence (PostgreSQL)
- Add health monitoring

**For demo:** Just restart with `pnpm dev`

---

## Modes of Operation

### 1. Read-Only Mode (No Private Key)

```bash
# .env
AGENT_PRIVATE_KEY=  # Empty or not set
```

**Behavior:**
- ✅ Monitors deposits
- ✅ Analyzes invoices
- ✅ Records decisions in AgentRouter (via owner account)
- ❌ Cannot auto-execute strategy changes
- ✅ WebSocket updates work

**Use case:** Demo, testing, observation

### 2. Template Mode (No Anthropic Key)

```bash
# .env
ANTHROPIC_API_KEY=  # Empty or not set
```

**Behavior:**
- ✅ Monitors deposits
- ✅ Uses pre-defined decision templates
- ✅ Can auto-execute if private key set
- ❌ No AI reasoning/explanations

**Use case:** Cost-saving, testing logic

### 3. Full Mode (Private Key + Anthropic Key)

```bash
# .env
AGENT_PRIVATE_KEY=0x1234...
ANTHROPIC_API_KEY=sk-ant-...
```

**Behavior:**
- ✅ Everything works
- ✅ AI-powered decisions with reasoning
- ✅ Auto-execution
- ✅ Rich explanations in WebSocket feed

**Use case:** Production demo, hackathon judging

---

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start agent in watch mode (auto-reload on code changes) |
| `pnpm build` | Compile TypeScript to `dist/` |
| `pnpm start` | Run compiled agent (production) |
| `pnpm test` | Run test suite |
| `pnpm test:watch` | Run tests in watch mode |

---

## WebSocket API

**Endpoint:** `ws://localhost:8080`

**Message Types:**

**Server → Client:**
```json
{
  "type": "analysis",
  "tokenId": "1",
  "decision": {
    "strategy": "Aggressive",
    "confidence": 85,
    "reasoning": "Invoice due in 90 days with low risk score (35). Maximize yield."
  }
}
```

```json
{
  "type": "execution",
  "tokenId": "1",
  "txHash": "0xabc123...",
  "status": "success"
}
```

```json
{
  "type": "error",
  "message": "Gas price too high (120 gwei), waiting..."
}
```

**Client → Server:**
```json
{
  "type": "request_analysis",
  "tokenId": "1"
}
```

---

## Architecture

```
agent/
├── src/
│   ├── index.ts          # Entry point, env validation
│   ├── agent.ts          # Core agent logic
│   ├── blockchain.ts     # Contract interfaces (ethers.js)
│   ├── ai.ts             # Claude AI integration
│   └── websocket.ts      # WebSocket server
├── .env.example          # Template environment config
├── package.json          # Dependencies and scripts
└── tsconfig.json         # TypeScript config
```

### Key Components

**FaktoryAgent (`agent.ts`):**
- Main orchestrator
- Monitors vault every 30s
- Coordinates blockchain reads, AI decisions, contract writes

**Blockchain (`blockchain.ts`):**
- Ethers.js provider setup
- Contract ABIs and interfaces
- Read/write operations

**AI (`ai.ts`):**
- Anthropic Claude SDK
- Decision prompts
- Confidence scoring

**WebSocket (`websocket.ts`):**
- WS server on port 8080
- Broadcasts agent activity
- Handles client subscriptions

---

## Production Deployment

**This agent is NOT production-ready. Required improvements:**

### Infrastructure
- [ ] Job queue (Redis/Bull) for transaction reliability
- [ ] PostgreSQL for decision history persistence
- [ ] Multiple agent instances with leader election
- [ ] Health checks and auto-restart (PM2/Kubernetes)
- [ ] Monitoring (Datadog, Sentry)

### Security
- [ ] Secrets management (AWS Secrets Manager, Vault)
- [ ] Rate limiting on WebSocket connections
- [ ] Authentication/authorization for WS clients
- [ ] Audit logging for all transactions

### Reliability
- [ ] Idempotent transaction handling
- [ ] Retry logic with exponential backoff
- [ ] Circuit breakers for RPC failures
- [ ] Graceful degradation when AI unavailable

**Estimated effort:** 4-6 weeks of engineering time

---

## FAQ

**Q: Does the agent run automatically?**
A: No, you must start it manually with `pnpm dev`. For production, use process managers like PM2.

**Q: What happens if the agent crashes?**
A: In-memory state is lost. Restart with `pnpm dev`. Production should use database persistence.

**Q: Can multiple agents run simultaneously?**
A: Not safely. Current architecture assumes single instance. Use leader election for HA.

**Q: How much does Claude AI cost?**
A: ~$0.01 per analysis. At 30s intervals with 10 invoices = ~$0.30/hour = $7/day.

**Q: Can I use a different LLM?**
A: Yes, modify `src/ai.ts` to use OpenAI, local Llama, or template-based decisions.

**Q: Why not use AWS Lambda / serverless?**
A: WebSocket server requires persistent connection. Could split into:
- Lambda for periodic analysis
- Separate WS server for broadcasting

---

## License

MIT
