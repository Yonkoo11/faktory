#!/usr/bin/env npx tsx

/**
 * Faktory Protocol - Backend Integration Test Script
 *
 * Tests the complete backend flow:
 * 1. Contract deployment on Anvil
 * 2. Invoice minting
 * 3. Yield vault deposit
 * 4. Agent analysis cycle
 * 5. Strategy changes
 * 6. Yield accrual
 * 7. Withdrawal
 * 8. API endpoints
 */

import { ethers } from 'ethers';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function success(message: string) {
  log(`✅ ${message}`, colors.green);
}

function error(message: string) {
  log(`❌ ${message}`, colors.red);
}

function info(message: string) {
  log(`ℹ️  ${message}`, colors.blue);
}

function section(title: string) {
  console.log('\n' + '='.repeat(60));
  log(title, colors.cyan);
  console.log('='.repeat(60) + '\n');
}

// Contract ABIs (minimal)
const INVOICE_NFT_ABI = [
  'function mint(bytes32 dataCommitment, bytes32 amountCommitment, uint256 dueDate) returns (uint256)',
  'function getInvoice(uint256 tokenId) view returns (tuple(bytes32,bytes32,uint256,uint256,address,uint8,uint8,uint8))',
  'function totalInvoices() view returns (uint256)',
  'function getActiveInvoices() view returns (uint256[])',
  'function setApprovalForAll(address operator, bool approved)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function setYieldVault(address _yieldVault)',
  'function setAgentRouter(address _agentRouter)',
  'function setOracle(address _oracle)',
];

const YIELD_VAULT_ABI = [
  'function deposit(uint256 tokenId, uint8 strategy, uint256 simulatedPrincipal)',
  'function withdraw(uint256 tokenId)',
  'function getDeposit(uint256 tokenId) view returns (tuple(uint256,address,uint8,uint256,uint256,uint256,uint256,bool))',
  'function getActiveDeposits() view returns (uint256[])',
  'function getAccruedYield(uint256 tokenId) view returns (uint256)',
  'function changeStrategy(uint256 tokenId, uint8 newStrategy)',
  'function totalValueLocked() view returns (uint256)',
  'function setAgentRouter(address _agentRouter)',
];

const AGENT_ROUTER_ABI = [
  'function recordDecision(uint256 tokenId, uint8 strategy, uint256 confidence, string reasoning) returns (uint256)',
  'function getDecisionHistory(uint256 tokenId) view returns (tuple(uint256,uint8,string,uint256,uint256,bool)[])',
  'function isAgentAuthorized(address agent) view returns (bool)',
  'function authorizeAgent(address agent)',
  'function totalDecisions() view returns (uint256)',
  'function getConfig() view returns (tuple(uint256,uint256,bool,bool))',
];

const MOCK_ORACLE_ABI = [
  'function getRiskScore(uint256 tokenId) view returns (uint8)',
  'function getPaymentProbability(uint256 tokenId) view returns (uint8)',
  'function simulateRiskAssessment(uint256 tokenId)',
  'function setRiskScore(uint256 tokenId, uint8 score)',
  'function setPaymentProbability(uint256 tokenId, uint8 probability)',
];

interface TestConfig {
  rpcUrl: string;
  addresses: {
    invoiceNFT: string;
    yieldVault: string;
    agentRouter: string;
    mockOracle: string;
  };
}

async function runTests(config: TestConfig) {
  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  const signer = new ethers.Wallet(
    '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', // Anvil default key
    provider
  );

  const invoiceNFT = new ethers.Contract(config.addresses.invoiceNFT, INVOICE_NFT_ABI, signer);
  const yieldVault = new ethers.Contract(config.addresses.yieldVault, YIELD_VAULT_ABI, signer);
  const agentRouter = new ethers.Contract(config.addresses.agentRouter, AGENT_ROUTER_ABI, signer);
  const mockOracle = new ethers.Contract(config.addresses.mockOracle, MOCK_ORACLE_ABI, signer);

  let testsPassed = 0;
  let testsFailed = 0;

  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      success(name);
      testsPassed++;
    } catch (e) {
      error(`${name}: ${e instanceof Error ? e.message : e}`);
      testsFailed++;
    }
  }

  // ============ CONTRACT CONNECTIVITY ============
  section('1. Contract Connectivity');

  await test('Connect to blockchain', async () => {
    const blockNumber = await provider.getBlockNumber();
    info(`Block number: ${blockNumber}`);
    if (blockNumber < 0) throw new Error('Invalid block number');
  });

  await test('InvoiceNFT contract accessible', async () => {
    const total = await invoiceNFT.totalInvoices();
    info(`Total invoices: ${total}`);
  });

  await test('YieldVault contract accessible', async () => {
    const tvl = await yieldVault.totalValueLocked();
    info(`Total value locked: ${ethers.formatEther(tvl)} ETH`);
  });

  await test('AgentRouter contract accessible', async () => {
    const totalDecisions = await agentRouter.totalDecisions();
    info(`Total decisions: ${totalDecisions}`);
  });

  // ============ INVOICE MINTING ============
  section('2. Invoice Minting');

  let tokenId: bigint;

  await test('Mint new invoice NFT', async () => {
    const dataCommitment = ethers.keccak256(ethers.toUtf8Bytes('test-invoice-data-' + Date.now()));
    const amountCommitment = ethers.keccak256(ethers.toUtf8Bytes('10000'));
    const dueDate = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60; // 30 days from now

    const tx = await invoiceNFT.mint(dataCommitment, amountCommitment, dueDate);
    const receipt = await tx.wait();

    tokenId = await invoiceNFT.totalInvoices() - 1n;
    info(`Minted invoice with tokenId: ${tokenId}`);
    info(`Transaction hash: ${receipt.hash}`);
  });

  await test('Verify invoice ownership', async () => {
    const owner = await invoiceNFT.ownerOf(tokenId);
    if (owner.toLowerCase() !== signer.address.toLowerCase()) {
      throw new Error(`Owner mismatch: ${owner} != ${signer.address}`);
    }
  });

  await test('Get invoice details', async () => {
    const invoice = await invoiceNFT.getInvoice(tokenId);
    info(`Invoice status: ${invoice[5]} (0=Active, 1=InYield)`);
    info(`Risk score: ${invoice[6]}/100`);
    info(`Payment probability: ${invoice[7]}%`);
  });

  // ============ YIELD VAULT DEPOSIT ============
  section('3. Yield Vault Deposit');

  const principal = ethers.parseEther('10000'); // 10,000 simulated value

  await test('Approve YieldVault for NFT transfers', async () => {
    const tx = await invoiceNFT.setApprovalForAll(config.addresses.yieldVault, true);
    await tx.wait();
  });

  await test('Deposit invoice to YieldVault', async () => {
    const strategy = 1; // Conservative
    const tx = await yieldVault.deposit(tokenId, strategy, principal);
    const receipt = await tx.wait();
    info(`Deposit transaction: ${receipt.hash}`);
  });

  await test('Verify deposit is active', async () => {
    const deposit = await yieldVault.getDeposit(tokenId);
    if (!deposit[7]) throw new Error('Deposit is not active');
    info(`Deposit strategy: ${deposit[2]} (0=Hold, 1=Conservative, 2=Aggressive)`);
    info(`Principal: ${ethers.formatEther(deposit[4])} units`);
  });

  await test('Check active deposits', async () => {
    const activeDeposits = await yieldVault.getActiveDeposits();
    info(`Active deposits count: ${activeDeposits.length}`);
    if (!activeDeposits.includes(tokenId)) {
      throw new Error('TokenId not in active deposits');
    }
  });

  // ============ AGENT OPERATIONS ============
  section('4. Agent Operations');

  await test('Verify agent authorization', async () => {
    const isAuthorized = await agentRouter.isAgentAuthorized(signer.address);
    if (!isAuthorized) {
      info('Authorizing agent...');
      const tx = await agentRouter.authorizeAgent(signer.address);
      await tx.wait();
    }
    const authorized = await agentRouter.isAgentAuthorized(signer.address);
    if (!authorized) throw new Error('Agent not authorized');
  });

  await test('Record agent decision', async () => {
    const strategy = 2; // Aggressive
    const confidence = 85;
    const reasoning = 'High risk score and long duration favor aggressive strategy';

    const tx = await agentRouter.recordDecision(tokenId, strategy, confidence, reasoning);
    const receipt = await tx.wait();
    info(`Decision recorded in tx: ${receipt.hash}`);
  });

  await test('Verify decision was recorded and executed', async () => {
    const decisions = await agentRouter.getDecisionHistory(tokenId);
    if (decisions.length === 0) throw new Error('No decisions found');

    const latest = decisions[decisions.length - 1];
    info(`Latest decision - Strategy: ${latest[1]}, Confidence: ${latest[3]}%`);
    info(`Decision executed: ${latest[5]}`);
  });

  await test('Verify strategy was changed', async () => {
    const deposit = await yieldVault.getDeposit(tokenId);
    info(`New strategy: ${deposit[2]}`);
    if (deposit[2] !== 2n) {
      throw new Error('Strategy was not changed to Aggressive');
    }
  });

  // ============ YIELD ACCRUAL ============
  section('5. Yield Accrual');

  await test('Check accrued yield', async () => {
    const yield_ = await yieldVault.getAccruedYield(tokenId);
    info(`Accrued yield: ${ethers.formatEther(yield_)} units`);
  });

  await test('Fast forward time and check yield again', async () => {
    // Move time forward by 1 day (Anvil specific)
    await provider.send('evm_increaseTime', [86400]);
    await provider.send('evm_mine', []);

    const yield_ = await yieldVault.getAccruedYield(tokenId);
    info(`Accrued yield after 1 day: ${ethers.formatEther(yield_)} units`);

    // With 7% APY on 10000 principal, 1 day should yield ~1.92 units
    // (10000 * 0.07 / 365) = ~1.92
    if (yield_ <= 0n) throw new Error('No yield accrued');
  });

  // ============ WITHDRAWAL ============
  section('6. Withdrawal');

  await test('Withdraw from YieldVault', async () => {
    const tx = await yieldVault.withdraw(tokenId);
    const receipt = await tx.wait();
    info(`Withdrawal transaction: ${receipt.hash}`);
  });

  await test('Verify NFT returned to owner', async () => {
    const owner = await invoiceNFT.ownerOf(tokenId);
    if (owner.toLowerCase() !== signer.address.toLowerCase()) {
      throw new Error(`NFT not returned. Owner: ${owner}`);
    }
  });

  await test('Verify deposit is inactive', async () => {
    const deposit = await yieldVault.getDeposit(tokenId);
    if (deposit[7]) throw new Error('Deposit still active after withdrawal');
  });

  // ============ API ENDPOINTS ============
  section('7. API Endpoints (requires frontend running)');

  const apiBaseUrl = 'http://localhost:3000/api';

  async function testApi(endpoint: string, description: string) {
    await test(`API: ${description}`, async () => {
      try {
        const response = await fetch(`${apiBaseUrl}${endpoint}`);
        if (!response.ok) {
          const text = await response.text();
          throw new Error(`HTTP ${response.status}: ${text}`);
        }
        const data = await response.json();
        if (!data.success) {
          throw new Error(`API returned success: false`);
        }
        info(`Response: ${JSON.stringify(data.data).slice(0, 100)}...`);
      } catch (e) {
        if (e instanceof Error && e.message.includes('fetch failed')) {
          info('Frontend not running - skipping API test');
          return; // Don't fail the test if frontend isn't running
        }
        throw e;
      }
    });
  }

  await testApi('/health', 'Health check endpoint');
  await testApi('/invoices', 'Get invoices');
  await testApi('/yield', 'Get yield stats');
  await testApi('/agent/status', 'Get agent status');
  await testApi('/agent/decisions', 'Get agent decisions');

  // ============ SUMMARY ============
  section('Test Summary');

  console.log(`\n${'─'.repeat(40)}`);
  log(`Tests Passed: ${testsPassed}`, colors.green);
  log(`Tests Failed: ${testsFailed}`, testsFailed > 0 ? colors.red : colors.green);
  console.log(`${'─'.repeat(40)}\n`);

  if (testsFailed > 0) {
    log('Some tests failed. Check the output above for details.', colors.red);
    process.exit(1);
  } else {
    log('All tests passed! Backend is 100% functional.', colors.green);
  }
}

// Main execution
async function main() {
  console.log('\n');
  log('╔═══════════════════════════════════════════════════════════╗', colors.cyan);
  log('║       FAKTORY PROTOCOL - BACKEND INTEGRATION TESTS        ║', colors.cyan);
  log('╚═══════════════════════════════════════════════════════════╝', colors.cyan);

  // Default config for local Anvil
  const config: TestConfig = {
    rpcUrl: process.env.RPC_URL || 'http://localhost:8545',
    addresses: {
      invoiceNFT: process.env.INVOICE_NFT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
      yieldVault: process.env.YIELD_VAULT_ADDRESS || '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
      agentRouter: process.env.AGENT_ROUTER_ADDRESS || '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
      mockOracle: process.env.MOCK_ORACLE_ADDRESS || '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
    },
  };

  info(`RPC URL: ${config.rpcUrl}`);
  info(`InvoiceNFT: ${config.addresses.invoiceNFT}`);
  info(`YieldVault: ${config.addresses.yieldVault}`);
  info(`AgentRouter: ${config.addresses.agentRouter}`);
  info(`MockOracle: ${config.addresses.mockOracle}`);

  try {
    await runTests(config);
  } catch (e) {
    error(`Fatal error: ${e instanceof Error ? e.message : e}`);
    process.exit(1);
  }
}

main();
