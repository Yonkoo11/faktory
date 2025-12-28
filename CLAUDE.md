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

## Workflow (MANDATORY)
1. **Explore** → Read relevant files. Use subagents to investigate. Do NOT write code.
2. **Plan** → Use "think" or "ultrathink" for complex problems. Name specific files. No code until plan is solid.
3. **Code** → Implement incrementally. Run tests after each change. Verify assumptions.
4. **Commit** → Atomic commits with clear messages.

IMPORTANT: Steps 1-2 are crucial. Without them, jumping straight to code wastes time.

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

## Do NOT
- Skip the planning step
- Guess file contents without reading first
- Make sweeping changes across multiple files at once
- Commit with failing tests
- Say "just add" — be specific about what and where
- Write mocks when real implementations exist
