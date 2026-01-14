#!/bin/bash

# Faktory Demo Launcher
# Run this script to start the complete demo environment

set -e

echo "
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║     ███████╗ █████╗ ██╗  ██╗████████╗ ██████╗ ██████╗ ██╗   ██║
║     ██╔════╝██╔══██╗██║ ██╔╝╚══██╔══╝██╔═══██╗██╔══██╗╚██╗ ██╔╝
║     █████╗  ███████║█████╔╝    ██║   ██║   ██║██████╔╝ ╚████╔╝ ║
║     ██╔══╝  ██╔══██║██╔═██╗    ██║   ██║   ██║██╔══██╗  ╚██╔╝  ║
║     ██║     ██║  ██║██║  ██╗   ██║   ╚██████╔╝██║  ██║   ██║   ║
║     ╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝    ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ║
║                                                               ║
║          Turn Invoices into Yield. Automatically.             ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
"

echo "🚀 Starting Faktory Demo Environment..."
echo ""

# Check if running from correct directory
if [ ! -f "package.json" ] && [ ! -d "contracts" ]; then
    echo "❌ Please run this script from the faktory root directory"
    exit 1
fi

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down Faktory..."
    kill $(jobs -p) 2>/dev/null
    exit 0
}
trap cleanup SIGINT SIGTERM

# Step 1: Start Anvil (local blockchain)
echo "📦 Step 1/4: Starting local blockchain (Anvil)..."
cd contracts
anvil --chain-id 31337 --block-time 2 > /tmp/anvil.log 2>&1 &
ANVIL_PID=$!
sleep 3

# Check if Anvil started
if ! kill -0 $ANVIL_PID 2>/dev/null; then
    echo "❌ Failed to start Anvil. Is Foundry installed?"
    exit 1
fi
echo "✅ Anvil running on http://127.0.0.1:8545"

# Step 2: Deploy contracts
echo ""
echo "📦 Step 2/4: Deploying smart contracts..."
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
forge script script/Deploy.s.sol:DeployScript --rpc-url http://127.0.0.1:8545 --broadcast > /tmp/deploy.log 2>&1

# Extract addresses from deployment log
INVOICE_NFT=$(grep "InvoiceNFT deployed at:" /tmp/deploy.log | awk '{print $NF}')
YIELD_VAULT=$(grep "YieldVault deployed at:" /tmp/deploy.log | awk '{print $NF}')
PRIVACY_REGISTRY=$(grep "PrivacyRegistry deployed at:" /tmp/deploy.log | awk '{print $NF}')
AGENT_ROUTER=$(grep "AgentRouter deployed at:" /tmp/deploy.log | awk '{print $NF}')
MOCK_ORACLE=$(grep "MockOracle deployed at:" /tmp/deploy.log | awk '{print $NF}')

echo "✅ Contracts deployed:"
echo "   InvoiceNFT:      $INVOICE_NFT"
echo "   YieldVault:      $YIELD_VAULT"
echo "   AgentRouter:     $AGENT_ROUTER"
cd ..

# Step 3: Update environment files
echo ""
echo "📦 Step 3/4: Configuring environment..."

# Update app .env
cat > app/.env << EOF
# Contract addresses (local Anvil deployment)
NEXT_PUBLIC_INVOICE_NFT_ADDRESS=$INVOICE_NFT
NEXT_PUBLIC_YIELD_VAULT_ADDRESS=$YIELD_VAULT
NEXT_PUBLIC_PRIVACY_REGISTRY_ADDRESS=$PRIVACY_REGISTRY
NEXT_PUBLIC_AGENT_ROUTER_ADDRESS=$AGENT_ROUTER
NEXT_PUBLIC_MOCK_ORACLE_ADDRESS=$MOCK_ORACLE

# Agent WebSocket URL
NEXT_PUBLIC_AGENT_WS_URL=ws://localhost:8080
EOF

# Update agent .env (preserve API key if exists)
ANTHROPIC_KEY=$(grep ANTHROPIC_API_KEY agent/.env 2>/dev/null | cut -d'=' -f2 || echo "")
cat > agent/.env << EOF
# Local Anvil RPC
MANTLE_RPC_URL=http://127.0.0.1:8545

# Agent wallet private key (Anvil account 1)
AGENT_PRIVATE_KEY=0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d

# Anthropic API key (for LLM explanations)
ANTHROPIC_API_KEY=$ANTHROPIC_KEY

# WebSocket server port
WS_PORT=8080

# Contract addresses (local Anvil deployment)
INVOICE_NFT_ADDRESS=$INVOICE_NFT
YIELD_VAULT_ADDRESS=$YIELD_VAULT
AGENT_ROUTER_ADDRESS=$AGENT_ROUTER
MOCK_ORACLE_ADDRESS=$MOCK_ORACLE
EOF

echo "✅ Environment configured"

# Step 4: Start services
echo ""
echo "📦 Step 4/4: Starting services..."

# Start agent
echo "   Starting AI Agent..."
cd agent
pnpm start > /tmp/agent.log 2>&1 &
AGENT_PID=$!
cd ..
sleep 3

# Start frontend
echo "   Starting Frontend..."
cd app
pnpm dev > /tmp/app.log 2>&1 &
APP_PID=$!
cd ..
sleep 5

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "🎉 FAKTORY IS RUNNING!"
echo ""
echo "   🌐 Frontend:    http://localhost:3000"
echo "   🤖 Agent WS:    ws://localhost:8080"
echo "   ⛓️  Blockchain:  http://127.0.0.1:8545"
echo ""
echo "   📋 Demo Wallet (Anvil Account 0):"
echo "   Address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
echo "   Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "🎬 DEMO FLOW:"
echo "   1. Open http://localhost:3000"
echo "   2. Connect wallet (import Anvil account above)"
echo "   3. Tokenize an invoice"
echo "   4. Deposit to yield vault"
echo "   5. Watch AI agent analyze in real-time"
echo "   6. Click 'Crash' to demo market response"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Keep script running
wait
