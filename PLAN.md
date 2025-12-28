# Faktory Protocol - Completion Plan

> Following the **Explore → Plan → Code → Commit** workflow

## Overview

This plan addresses all gaps identified during the comprehensive codebase exploration.
Each phase is designed to be completed independently with atomic commits.

---

## Phase 1: Documentation & Project Structure

### Goal
Establish project conventions and configuration before code changes.

### Tasks

#### 1.1 Create CLAUDE.md
**Status**: Not started
**Priority**: P0
**Effort**: 30 min

```markdown
# Contents to include:
- Project overview and architecture
- Development workflow (Explore → Plan → Code → Commit)
- Code conventions (TypeScript, Solidity)
- Testing requirements
- Commit message format
- Environment setup
```

#### 1.2 Create app/.env.example
**Status**: Not started
**Priority**: P0
**Effort**: 15 min

```bash
# Required variables:
NEXT_PUBLIC_INVOICE_NFT_ADDRESS=
NEXT_PUBLIC_YIELD_VAULT_ADDRESS=
NEXT_PUBLIC_AGENT_ROUTER_ADDRESS=
NEXT_PUBLIC_CHAIN_ID=5003
NEXT_PUBLIC_MANTLE_RPC=https://rpc.sepolia.mantle.xyz
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_AGENT_WS_URL=ws://localhost:8080
NEXT_PUBLIC_QUICKBOOKS_CLIENT_ID=
NEXT_PUBLIC_QUICKBOOKS_REALM_ID=
```

#### 1.3 Centralize Strategy Constants
**Status**: Not started
**Priority**: P1
**Effort**: 45 min

Create `shared/constants.ts`:
```typescript
export const STRATEGIES = {
  HOLD: { id: 0, name: 'Hold', apy: 0 },
  CONSERVATIVE: { id: 1, name: 'Conservative', apy: 3.5 },
  AGGRESSIVE: { id: 2, name: 'Aggressive', apy: 7.0 },
} as const;
```

**Commit**: `docs: add project documentation and centralize constants`

---

## Phase 2: Smart Contracts - Critical Fixes

### Goal
Make contracts production-ready with proper safety mechanisms.

### Tasks

#### 2.1 Add Pausable/Emergency Controls
**Status**: Not started
**Priority**: P0
**Effort**: 2-3 hours

**Files to modify**:
- `contracts/src/YieldVault.sol`
- `contracts/src/AgentRouter.sol`

**Changes**:
```solidity
// Add to YieldVault.sol
import "@openzeppelin/contracts/utils/Pausable.sol";

contract YieldVault is Ownable, ReentrancyGuard, Pausable, IERC721Receiver {

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function deposit(...) external nonReentrant whenNotPaused {
        // existing logic
    }

    function emergencyWithdraw(uint256 tokenId) external onlyOwner {
        // Force withdraw stuck NFTs
    }
}
```

**Tests to add**:
- `test_PauseBlocksDeposits()`
- `test_PauseBlocksWithdrawals()`
- `test_EmergencyWithdraw()`
- `test_OnlyOwnerCanPause()`

**Commit**: `feat(contracts): add Pausable and emergency controls to YieldVault`

---

#### 2.2 Implement Default/Liquidation Mechanism
**Status**: Not started
**Priority**: P0
**Effort**: 4-5 hours

**Files to modify**:
- `contracts/src/YieldVault.sol`
- `contracts/src/InvoiceNFT.sol`

**New functionality**:
```solidity
// In YieldVault.sol
uint256 public constant GRACE_PERIOD = 7 days;
uint256 public constant SLASH_PERCENTAGE = 1000; // 10%

function markDefault(uint256 tokenId) external {
    Deposit storage dep = deposits[tokenId];
    require(dep.active, "Not active");

    (, , uint256 dueDate, , ) = invoiceNFT.getInvoice(tokenId);
    require(block.timestamp > dueDate + GRACE_PERIOD, "Not overdue");

    // Slash yield as penalty
    uint256 slashAmount = (dep.accruedYield * SLASH_PERCENTAGE) / 10000;
    dep.accruedYield -= slashAmount;

    // Update status
    invoiceNFT.updateStatus(tokenId, InvoiceNFT.InvoiceStatus.Defaulted);

    emit InvoiceDefaulted(tokenId, slashAmount);
}
```

**Tests to add**:
- `test_MarkDefaultAfterGracePeriod()`
- `test_RevertMarkDefaultBeforeGracePeriod()`
- `test_SlashCalculation()`

**Commit**: `feat(contracts): implement default handling with grace period and slashing`

---

#### 2.3 Integrate LendleYieldSource with YieldVault
**Status**: Not started
**Priority**: P1
**Effort**: 3-4 hours

**Files to modify**:
- `contracts/src/YieldVault.sol`
- `contracts/script/DeployProduction.s.sol`

**Changes**:
```solidity
// In YieldVault.sol
LendleYieldSource public lendleYieldSource;
bool public useRealYield;

function setLendleYieldSource(address _source) external onlyOwner {
    lendleYieldSource = LendleYieldSource(_source);
    useRealYield = true;
}

function _getAPY(Strategy strategy) internal view returns (uint256) {
    if (useRealYield && address(lendleYieldSource) != address(0)) {
        return lendleYieldSource.getCurrentAPY(strategy);
    }
    // Fallback to simulated
    if (strategy == Strategy.Conservative) return CONSERVATIVE_APY;
    if (strategy == Strategy.Aggressive) return AGGRESSIVE_APY;
    return HOLD_APY;
}
```

**Commit**: `feat(contracts): integrate LendleYieldSource for real DeFi yields`

---

#### 2.4 Add Rate Limiting to AgentRouter
**Status**: Not started
**Priority**: P1
**Effort**: 1-2 hours

**Files to modify**:
- `contracts/src/AgentRouter.sol`

**Changes**:
```solidity
uint256 public constant MIN_DECISION_INTERVAL = 5 minutes;
mapping(uint256 => uint256) public lastDecisionTime;

function recordDecision(...) external onlyAuthorizedAgent {
    require(
        block.timestamp >= lastDecisionTime[tokenId] + MIN_DECISION_INTERVAL,
        "Decision too frequent"
    );
    lastDecisionTime[tokenId] = block.timestamp;
    // existing logic
}
```

**Commit**: `feat(contracts): add rate limiting to AgentRouter decisions`

---

#### 2.5 Optimize O(n) Operations
**Status**: Not started
**Priority**: P2
**Effort**: 2-3 hours

**Files to modify**:
- `contracts/src/YieldVault.sol` (line 250-258)
- `contracts/src/InvoiceNFT.sol` (line 218-241)

**Use EnumerableSet**:
```solidity
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

using EnumerableSet.UintSet for EnumerableSet.UintSet;
EnumerableSet.UintSet private _activeDeposits;

function _removeFromActiveDeposits(uint256 tokenId) internal {
    _activeDeposits.remove(tokenId); // O(1) instead of O(n)
}
```

**Commit**: `perf(contracts): optimize O(n) operations with EnumerableSet`

---

#### 2.6 Add Tests for PythOracle and LendleYieldSource
**Status**: Not started
**Priority**: P1
**Effort**: 2-3 hours

**Files to create/modify**:
- `contracts/test/PythOracle.t.sol` (new)
- `contracts/test/LendleYieldSource.t.sol` (new)

**Tests to add**:
- `test_PythOracleRiskAssessment()`
- `test_PythOracleFallbackPrices()`
- `test_LendleYieldSourceDeposit()`
- `test_LendleYieldSourceWithdraw()`
- `test_LendleAPYCalculation()`

**Commit**: `test(contracts): add tests for PythOracle and LendleYieldSource`

---

## Phase 3: Agent Service - Critical Fixes

### Goal
Make agent production-ready with proper event handling and error recovery.

### Tasks

#### 3.1 Implement Contract Event Listeners
**Status**: Not started
**Priority**: P0
**Effort**: 1-2 hours

**Files to modify**:
- `agent/src/agent.ts`
- `agent/src/blockchain.ts`

**Changes in agent.ts**:
```typescript
async start(): Promise<void> {
    // ... existing code ...

    // Add event listeners
    this.blockchain.onDecisionRecorded((tokenId, strategy, confidence) => {
        this.broadcastThought({
            type: 'execution',
            tokenId: tokenId.toString(),
            message: `📝 Decision recorded on-chain: Strategy ${STRATEGY_NAMES[strategy]}`,
            timestamp: Date.now(),
        });
    });

    this.blockchain.onDecisionExecuted((tokenId, strategy, txHash) => {
        this.broadcastThought({
            type: 'execution',
            tokenId: tokenId.toString(),
            message: `✅ Strategy change executed on-chain`,
            timestamp: Date.now(),
            data: { txHash },
        });
    });
}
```

**Commit**: `feat(agent): implement contract event listeners for real-time updates`

---

#### 3.2 Fix Decision Execution Logic
**Status**: Not started
**Priority**: P0
**Effort**: 1-2 hours

**Files to modify**:
- `agent/src/agent.ts` (line 329)

**Changes**:
```typescript
// Current: Only executes if isDeposited
if (analysis.shouldAct && this.config.autoExecute && isDeposited) {

// Fixed: Separate activation from optimization
if (analysis.shouldAct && this.config.autoExecute) {
    if (isDeposited) {
        // Existing strategy change logic
        await this.executeDecision(tokenId, analysis);
    } else {
        // New: Recommend activation for new invoices
        this.broadcastThought({
            type: 'decision',
            tokenId,
            message: `💡 Recommendation: Deposit this invoice with ${STRATEGY_NAMES[analysis.recommendedStrategy]} strategy for ${analysis.expectedYield}% APY`,
            timestamp: Date.now(),
            data: { needsDeposit: true, strategy: analysis.recommendedStrategy },
        });
    }
}
```

**Commit**: `fix(agent): handle decision execution for new invoices without deposits`

---

#### 3.3 Add Rate Limiting at Agent Level
**Status**: Not started
**Priority**: P1
**Effort**: 1 hour

**Files to modify**:
- `agent/src/agent.ts`

**Changes**:
```typescript
private decisionCooldowns: Map<string, number> = new Map();
private readonly COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

private canExecuteDecision(tokenId: string): boolean {
    const lastDecision = this.decisionCooldowns.get(tokenId);
    if (!lastDecision) return true;
    return Date.now() - lastDecision >= this.COOLDOWN_MS;
}

private recordDecisionExecution(tokenId: string): void {
    this.decisionCooldowns.set(tokenId, Date.now());
}
```

**Commit**: `feat(agent): add 5-minute cooldown between decisions per invoice`

---

#### 3.4 Add Analysis Cycle Timeout
**Status**: Not started
**Priority**: P1
**Effort**: 30 min

**Files to modify**:
- `agent/src/agent.ts`

**Changes**:
```typescript
private readonly CYCLE_TIMEOUT_MS = 60000; // 60 seconds max

private async runAnalysisCycle(): Promise<void> {
    const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Cycle timeout')), this.CYCLE_TIMEOUT_MS)
    );

    try {
        await Promise.race([
            this._runAnalysisCycleInternal(),
            timeoutPromise
        ]);
    } catch (error) {
        if (error.message === 'Cycle timeout') {
            console.error('⚠️ Analysis cycle exceeded timeout, skipping...');
            this.ws.broadcastError('system', 'Analysis cycle timeout - will retry next interval');
        }
        throw error;
    }
}
```

**Commit**: `feat(agent): add circuit breaker timeout for analysis cycles`

---

#### 3.5 Add Integration Tests
**Status**: Not started
**Priority**: P1
**Effort**: 2-3 hours

**Files to create**:
- `agent/src/agent.test.ts`
- `agent/src/blockchain.test.ts`

**Tests to add**:
- `test_AgentStartup()`
- `test_AnalysisCycleWithMockData()`
- `test_DecisionExecution()`
- `test_RateLimitingEnforced()`
- `test_TimeoutCircuitBreaker()`
- `test_WebSocketBroadcast()`

**Commit**: `test(agent): add integration tests for agent service`

---

## Phase 4: Frontend - Critical Fixes

### Goal
Complete user flows for withdraw and strategy change.

### Tasks

#### 4.1 Implement Withdraw Yield Flow
**Status**: Not started
**Priority**: P0
**Effort**: 3-4 hours

**Files to modify**:
- `app/src/components/withdraw-modal.tsx` (new)
- `app/src/hooks/use-yield-vault.ts`
- `app/src/app/dashboard/invoice/[id]/page.tsx`

**New component**:
```typescript
// withdraw-modal.tsx
export function WithdrawModal({
    open,
    onOpenChange,
    tokenId,
    accruedYield
}: WithdrawModalProps) {
    const { withdraw, isLoading, error } = useWithdrawFromVault();

    const handleWithdraw = async () => {
        try {
            await withdraw(tokenId);
            toast.success('Withdrawal successful!');
            onOpenChange(false);
        } catch (err) {
            toast.error('Withdrawal failed');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {/* Withdraw confirmation UI */}
        </Dialog>
    );
}
```

**Commit**: `feat(app): implement withdraw yield flow with confirmation modal`

---

#### 4.2 Implement Change Strategy Flow
**Status**: Not started
**Priority**: P0
**Effort**: 2-3 hours

**Files to modify**:
- `app/src/components/deposit-modal.tsx`
- `app/src/hooks/use-yield-vault.ts`

**Changes**:
```typescript
// Add to deposit-modal.tsx or create strategy-modal.tsx
export function StrategyChangeModal({
    open,
    onOpenChange,
    tokenId,
    currentStrategy,
}: StrategyChangeModalProps) {
    const { changeStrategy, isLoading } = useChangeStrategy();
    const [newStrategy, setNewStrategy] = useState(currentStrategy);

    const handleChange = async () => {
        await changeStrategy(tokenId, newStrategy);
        toast.success(`Strategy changed to ${STRATEGIES[newStrategy].name}`);
        onOpenChange(false);
    };

    // Strategy selection UI with APY comparison
}
```

**Commit**: `feat(app): implement change strategy flow with APY comparison`

---

#### 4.3 Fix User-Specific Invoice API
**Status**: Not started
**Priority**: P0
**Effort**: 2 hours

**Files to modify**:
- `app/src/app/api/invoices/route.ts`

**Changes**:
```typescript
// Use batch RPC to get user's invoices efficiently
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (address) {
        // Get user's token balance
        const balance = await invoiceNFT.balanceOf(address);

        // Batch fetch all user's tokens
        const tokenIds = await Promise.all(
            Array.from({ length: Number(balance) }, (_, i) =>
                invoiceNFT.tokenOfOwnerByIndex(address, i)
            )
        );

        // Fetch invoice details in parallel
        const invoices = await Promise.all(
            tokenIds.map(id => getInvoiceWithDeposit(id))
        );

        return Response.json({ success: true, data: { invoices } });
    }

    // ... existing logic for all invoices
}
```

**Commit**: `fix(app): implement proper user-specific invoice fetching`

---

#### 4.4 Add WebSocket Reconnection Logic
**Status**: Not started
**Priority**: P1
**Effort**: 1-2 hours

**Files to modify**:
- `app/src/components/AgentActivity.tsx`

**Changes**:
```typescript
const useWebSocketWithReconnect = (url: string) => {
    const [ws, setWs] = useState<WebSocket | null>(null);
    const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
    const reconnectAttempts = useRef(0);
    const maxReconnectAttempts = 5;

    const connect = useCallback(() => {
        const socket = new WebSocket(url);

        socket.onopen = () => {
            setStatus('connected');
            reconnectAttempts.current = 0;
        };

        socket.onclose = () => {
            setStatus('disconnected');
            if (reconnectAttempts.current < maxReconnectAttempts) {
                const delay = Math.min(1000 * 2 ** reconnectAttempts.current, 30000);
                setTimeout(() => {
                    reconnectAttempts.current++;
                    connect();
                }, delay);
            }
        };

        setWs(socket);
    }, [url]);

    // ...
};
```

**Commit**: `feat(app): add WebSocket reconnection with exponential backoff`

---

#### 4.5 Validate Contract Addresses
**Status**: Not started
**Priority**: P1
**Effort**: 30 min

**Files to modify**:
- `app/src/lib/contracts/addresses.ts`
- `app/src/components/Providers.tsx`

**Changes**:
```typescript
// In addresses.ts
export function validateAddresses(): { valid: boolean; missing: string[] } {
    const missing: string[] = [];

    if (INVOICE_NFT_ADDRESS === '0x0000000000000000000000000000000000000000') {
        missing.push('INVOICE_NFT_ADDRESS');
    }
    // ... check all addresses

    return { valid: missing.length === 0, missing };
}

// In Providers.tsx
const { valid, missing } = validateAddresses();
if (!valid) {
    console.error('Missing contract addresses:', missing);
    // Show error banner to user
}
```

**Commit**: `feat(app): validate contract addresses on startup`

---

## Phase 5: Integration & Testing

### Goal
Verify all components work together end-to-end.

### Tasks

#### 5.1 Full Flow Test
- Mint invoice → Deposit → Agent analysis → Strategy change → Withdraw
- Document any issues found
- Fix integration bugs

#### 5.2 Error Scenario Testing
- Test network disconnection recovery
- Test transaction failures
- Test invalid data handling

#### 5.3 Edge Case Testing
- Overdue invoices
- Zero balance accounts
- Rapid strategy changes

**Commit**: `test: add end-to-end integration tests`

---

## Phase 6: Git Restructuring

### Goal
Create meaningful git history with atomic commits.

### Approach

Since we have a single "Initial commit", we'll create feature branches and squash-merge:

```bash
# Create branches for each phase
git checkout -b docs/project-structure
git checkout -b feat/contracts-safety
git checkout -b feat/agent-events
git checkout -b feat/frontend-flows
git checkout -b test/integration

# After each phase, merge with descriptive message
git checkout main
git merge --squash docs/project-structure
git commit -m "docs: add CLAUDE.md, env examples, and centralize constants"
```

---

## Execution Order

| Priority | Phase | Est. Time | Dependencies |
|----------|-------|-----------|--------------|
| 1 | Phase 1 (Docs) | 1.5 hours | None |
| 2 | Phase 2.1-2.2 (Critical contracts) | 6-8 hours | Phase 1 |
| 3 | Phase 3.1-3.2 (Critical agent) | 3-4 hours | Phase 2 |
| 4 | Phase 4.1-4.3 (Critical frontend) | 7-9 hours | Phase 3 |
| 5 | Phase 2.3-2.6 (Contract polish) | 6-8 hours | Phase 4 |
| 6 | Phase 3.3-3.5 (Agent polish) | 4-5 hours | Phase 5 |
| 7 | Phase 4.4-4.5 (Frontend polish) | 2-3 hours | Phase 6 |
| 8 | Phase 5 (Integration) | 3-4 hours | All above |
| 9 | Phase 6 (Git) | 1 hour | Phase 8 |

**Total Estimated Time**: 35-45 hours (4-5 days focused work)

---

## Success Criteria

- [ ] All 23 existing contract tests pass
- [ ] New tests for Pausable, Default, PythOracle, LendleYieldSource pass
- [ ] Agent can listen to and react to contract events
- [ ] Frontend withdraw and strategy change flows work end-to-end
- [ ] No TypeScript compilation errors
- [ ] No console errors in browser
- [ ] WebSocket reconnects automatically after disconnect
- [ ] Git history has meaningful, atomic commits
- [ ] CLAUDE.md documents all conventions

---

## Notes

- Each phase should be completed in order
- Run tests after each phase before proceeding
- Create a PR for review if working with team
- Document any deviations from this plan
