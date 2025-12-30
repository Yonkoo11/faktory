# CLAUDE.md - Faktory Protocol

## Commands
```bash
cd contracts && forge test          # Run contract tests (MUST pass before commit)
cd contracts && forge build         # Build contracts
cd agent && pnpm test               # Run agent tests
cd agent && pnpm dev                # Start agent service (port 8080)
cd app && pnpm tsc --noEmit         # Type check frontend (MUST pass before commit)
cd app && pnpm dev                  # Start frontend (port 3000)
```

## Architecture
```
contracts/ → Solidity (Foundry) → InvoiceNFT, YieldVault, AgentRouter, PythOracle
agent/    → TypeScript          → Autonomous yield optimizer with WebSocket
app/      → Next.js + wagmi     → Frontend dashboard
```

## Deployed Contracts (Mantle Sepolia)
- InvoiceNFT: `0xf35be6ffebf91acc27a78696cf912595c6b08aaa`
- YieldVault: `0xd2cad31a080b0dae98d9d6427e500b50bcb92774`
- AgentRouter: `0xec5bfee9d17e25cc8d52b8cb7fb81d8cabb53c5f`

---

## Pre-Flight Checklist (BEFORE ANY WORK)

### For Testnet/Mainnet Work
```bash
# 1. Verify deployer wallet is funded
cast balance $DEPLOYER_ADDRESS --rpc-url $RPC_URL --ether

# 2. Verify contracts are ACTUALLY deployed (not just in broadcast logs)
cast code $CONTRACT_ADDRESS --rpc-url $RPC_URL | head -c 20
# Must return bytecode, NOT "0x"

# 3. Verify contract reads work
cast call $INVOICE_NFT "totalInvoices()" --rpc-url $RPC_URL
```

### Environment Validation
- [ ] All required env vars are set (not placeholder values)
- [ ] Addresses match the target network (Anvil vs Sepolia vs Mainnet)
- [ ] Private keys correspond to funded wallets
- [ ] RPC URLs are correct for target network

---

## Workflow (MANDATORY)
1. **Explore** → Read relevant files. Use subagents to investigate. Do NOT write code.
2. **Plan** → Use "think" or "ultrathink" for complex problems. Name specific files. No code until plan is solid.
3. **Verify** → Run canary tasks to confirm assumptions before building.
4. **Code** → Implement incrementally. Run tests after each change.
5. **Commit** → Atomic commits with clear messages.

IMPORTANT: Steps 1-3 are crucial. Without them, jumping straight to code wastes time.

## Thinking Levels (use appropriately)
- `think` → small logic decisions, simple features
- `think hard` → non-trivial logic, edge cases
- `think harder` → refactors, multi-file changes
- `ultrathink` → architecture decisions, irreversible changes
- "Do not overthink" → routine tasks, reduce token usage

## Testing (TDD When Possible)
1. Write tests first (they MUST fail initially)
2. Commit tests
3. Write implementation until tests pass
4. Commit implementation

## Rules
- YOU MUST run tests before committing
- Do NOT modify tests unless explicitly asked
- Do NOT add dependencies without asking
- Name specific files before editing them
- Use checklists (Markdown) for complex multi-step tasks
- Use /clear between unrelated tasks to reset context
- List assumptions before coding ("Before coding, list your assumptions")
- Use canary tasks before big changes ("Rename this variable everywhere" to test)

### Design & UX Rules
- ALWAYS take screenshots before AND after any major design update
- NEVER use emojis or AI-generated filler content in production code
- Maintain task lists in project memory (TODO.md) even when context switches
- Design must be professional, production-grade quality
- Create reusable components to ensure UI uniformity
- Follow established design system patterns consistently

## Do NOT
- Skip the planning step
- Guess file contents without reading first
- Make sweeping changes across multiple files at once
- Commit with failing tests
- Say "just add" — be specific about what and where
- Write mocks when real implementations exist
- Update env files with addresses until verified on-chain
- Assume deployment succeeded from logs alone (ALWAYS verify with cast code)
- Mix local Anvil addresses with testnet/mainnet configs
- Build features when infrastructure is broken
- Use emojis in production UI/code (appears unprofessional)
- Add "AI slop" like excessive exclamation points or marketing speak
- Make design changes without taking before/after screenshots
- Lose track of task lists when switching contexts

## Chunking (One Thing at a Time)
BAD: "Deploy, configure, build features, test E2E"
GOOD:
1. Deploy & verify (STOP, confirm)
2. Update envs & verify reads (STOP, confirm)
3. Build ONE feature (STOP, confirm)
4. Repeat step 3
5. E2E test

## Scope Limits (Claude respects numbers)
- "Single-file change"
- "≤30 lines changed"
- "One commit only"
- "No new folders"
- "Fix this one function only"

---

## Screenshots (MANDATORY for UI/UX Changes)

### MCP Server Available
Puppeteer MCP is configured for taking screenshots.

### Screenshot Protocol
**BEFORE and AFTER every major design/UI update:**

1. **BEFORE making changes:**
   ```
   Take a screenshot of http://localhost:3000/[page] and save to screenshots/before-[feature]-[date].png
   ```

2. **AFTER making changes:**
   ```
   Take a screenshot of http://localhost:3000/[page] and save to screenshots/after-[feature]-[date].png
   ```

### When to Take Screenshots
- Landing page redesigns
- Dashboard layout changes
- New component additions
- Color/theme changes
- Responsive design updates
- Any visual change that affects user experience

### Screenshot Naming Convention
```
screenshots/
├── before-hero-redesign-2024-12-30.png
├── after-hero-redesign-2024-12-30.png
├── before-dashboard-table-2024-12-30.png
├── after-dashboard-table-2024-12-30.png
```

### Why This Matters
- Visual regression tracking
- Easy before/after comparisons for review
- Documentation of design evolution
- Proof of work for stakeholders/judges
