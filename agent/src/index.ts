// Faktory Agent Service Entry Point

import 'dotenv/config';
import { FaktoryAgent } from './agent.js';
import { ContractAddresses } from './blockchain.js';

// Load configuration from environment
const RPC_URL = process.env.MANTLE_RPC_URL || 'https://rpc.sepolia.mantle.xyz';
const PRIVATE_KEY = process.env.AGENT_PRIVATE_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const WS_PORT = parseInt(process.env.WS_PORT || '8080');

// Contract addresses (update after deployment)
const ADDRESSES: ContractAddresses = {
  invoiceNFT: process.env.INVOICE_NFT_ADDRESS || '0x0000000000000000000000000000000000000000',
  yieldVault: process.env.YIELD_VAULT_ADDRESS || '0x0000000000000000000000000000000000000000',
  agentRouter: process.env.AGENT_ROUTER_ADDRESS || '0x0000000000000000000000000000000000000000',
  mockOracle: process.env.MOCK_ORACLE_ADDRESS || '0x0000000000000000000000000000000000000000',
};

async function main() {
  console.log('');
  console.log('  ███████╗ █████╗ ██╗  ██╗████████╗ ██████╗ ██████╗ ██╗   ██╗');
  console.log('  ██╔════╝██╔══██╗██║ ██╔╝╚══██╔══╝██╔═══██╗██╔══██╗╚██╗ ██╔╝');
  console.log('  █████╗  ███████║█████╔╝    ██║   ██║   ██║██████╔╝ ╚████╔╝ ');
  console.log('  ██╔══╝  ██╔══██║██╔═██╗    ██║   ██║   ██║██╔══██╗  ╚██╔╝  ');
  console.log('  ██║     ██║  ██║██║  ██╗   ██║   ╚██████╔╝██║  ██║   ██║   ');
  console.log('  ╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝    ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ');
  console.log('');
  console.log('  Autonomous Invoice Yield Optimization on Mantle');
  console.log('');
  console.log('='.repeat(60));
  console.log(`  📡 RPC: ${RPC_URL}`);
  console.log(`  🔌 WebSocket: ws://localhost:${WS_PORT}`);
  console.log(`  🔑 Wallet: ${PRIVATE_KEY ? '✅ Configured' : '❌ Read-only mode'}`);
  console.log(`  🤖 LLM: ${ANTHROPIC_API_KEY ? '✅ Claude API' : '⚡ Template mode'}`);
  console.log('='.repeat(60));

  // Validate contract addresses
  const zeroAddress = '0x0000000000000000000000000000000000000000';
  if (ADDRESSES.invoiceNFT === zeroAddress) {
    console.warn('\n⚠️  Contract addresses not configured.');
    console.log('   Set environment variables after deployment.\n');
  }

  // Create agent instance
  const agent = new FaktoryAgent(RPC_URL, ADDRESSES, {
    privateKey: PRIVATE_KEY,
    anthropicApiKey: ANTHROPIC_API_KEY,
    wsPort: WS_PORT,
    config: {
      minConfidence: 70,
      analysisInterval: 30000, // 30 seconds
      maxConcurrentAnalyses: 5,
      autoExecute: !!PRIVATE_KEY, // Only auto-execute if we have a key
    },
  });

  // Start the agent
  await agent.start();

  // Handle graceful shutdown
  const shutdown = () => {
    console.log('\n🛑 Shutting down Faktory Agent...');
    agent.stop();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  // Keep process alive
  console.log('\n✅ Faktory Agent is live. Press Ctrl+C to stop.\n');
}

// Run
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
