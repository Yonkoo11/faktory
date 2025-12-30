# Lessons Learned: Building Faktory Protocol

A comprehensive guide compiled from building Faktory Protocol for the Mantle Global Hackathon 2025. Use this to build future projects better and faster.

---

## 1. PROJECT PLANNING (Do This FIRST)

### The 6-Layer Analysis Framework

Before writing ANY code, answer these questions in order:

#### Layer 1: Clarity & Intent
- What problem are we solving? (One sentence)
- Who is the primary user? (Be specific)
- What does success look like? (Measurable)
- What is the ONE thing this product does?

#### Layer 2: Scope (LOCK IT)
- List ALL features as: **CORE** / **SUPPORTING** / **OPTIONAL**
- Define explicit NON-GOALS (what we will NOT build)
- If it's not CORE, it can wait

**Faktory Example:**
```
CORE: Wallet → Mint → Deposit → Dashboard → Withdraw
SUPPORTING: QuickBooks, Strategies, Privacy, Agent
OPTIONAL: Activity feed, Calculator, Privacy controls
NON-GOALS: Lending, Collections, Fiat, Multi-chain, Teams
```

#### Layer 3: System Coherence
- Map end-to-end user flows
- Identify weak links between components
- Ensure data flows correctly

#### Layer 4: Behavior & Failure
- What happens on success?
- What happens on failure?
- What feedback does user see?

#### Layer 5: UX & Trust
- Where will users hesitate?
- What builds trust?
- What reduces friction?

#### Layer 6: Robustness
- What breaks under real usage?
- What's unfinished?
- What needs error handling?

---

## 2. ARCHITECTURE DECISIONS

### Tech Stack That Worked Well

```
Frontend:     Next.js 16 + App Router + TypeScript
Styling:      Tailwind CSS + shadcn/ui
Web3:         wagmi + viem (NOT ethers for frontend)
State:        React Query (TanStack Query)
Contracts:    Foundry (Solidity)
Agent:        TypeScript + ethers (OK for backend)
Chain:        Mantle L2 (low gas = more features viable)
```

### File Structure

```
project/
├── app/                    # Next.js frontend
│   ├── src/
│   │   ├── app/           # Pages (App Router)
│   │   ├── components/    # Reusable components
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utilities, ABIs, config
├── contracts/             # Solidity (Foundry)
│   ├── src/              # Contract source
│   ├── test/             # Contract tests
│   └── script/           # Deployment scripts
├── agent/                 # AI agent service
│   └── src/              # Agent TypeScript
├── README.md             # Clear, concise docs
└── CLAUDE.md             # AI assistant instructions
```

### Key Architecture Principles

1. **Separate concerns**: Frontend reads, Agent writes, Contracts are source of truth
2. **Use hooks for Web3**: `useInvoiceNFT()`, `useYieldVault()` - encapsulate complexity
3. **API routes for server logic**: Keep secrets server-side
4. **ABIs as TypeScript**: Export from a single `lib/abi.ts` file

---

## 3. UI/UX LESSONS (Critical for Hackathons)

### The Institutional vs Playful Spectrum

| Playful (Avoid) | Institutional (Prefer) |
|-----------------|----------------------|
| Gradient backgrounds | Subtle borders |
| Scale animations on hover | Color transitions only |
| Pulsing elements | Static with data updates |
| Fun copy ("Ready to earn?!") | Direct copy ("No invoices yet") |
| Large empty states | Compact, data-forward |
| Shadows everywhere | Minimal shadows |

### Trust Signals (Add These Everywhere)

```tsx
// Protocol Health Banner
<div className="flex items-center gap-6">
  <span>0% default rate</span>
  <span>100% withdrawal success</span>
  <span>Yield starts in <1 min</span>
</div>

// Contract Links
<a href="https://explorer/address/0x...">View Contract ↗</a>

// Security Badges
<Badge>Open Source</Badge>
<Badge>No Admin Keys</Badge>
<Badge>Audited (or "Unaudited - Testnet")</Badge>
```

### Data Density Matters

**Before (too sparse):**
```
┌─────────────────────────────────┐
│     🎉 Ready to earn yield?     │
│                                 │
│   Tokenize your invoices and    │
│   put them to work!             │
│                                 │
│      [ Get Started ]            │
└─────────────────────────────────┘
```

**After (institutional):**
```
┌─────────────────────────────────┐
│ No invoices yet                 │
│ Most users mint in <2 minutes   │
│                                 │
│ [ Mint Invoice ]                │
│                                 │
│ 0% default • Instant withdraw   │
└─────────────────────────────────┘
```

### Hero Section Formula

```
[Trust Badge: 0% defaults | 100% success | Instant withdrawals]

       3-7% APY
   on your unpaid invoices

[Key Metric] | [Key Metric] | [Key Metric]
  <1 min        $0 fees       24/7
 to yield      platform     withdrawals

         [ Primary CTA ]
```

---

## 4. CODE QUALITY PRACTICES

### TypeScript Discipline

```typescript
// ✅ DO: Explicit interfaces
interface InvoiceDisplay {
  id: string
  tokenId: string
  amount: string
  riskScore: number
}

// ❌ DON'T: any types
const data: any = response.json()
```

### Hydration Error Prevention

```typescript
// ✅ DO: Use mounted state for client-only data
const [mounted, setMounted] = useState(false)
useEffect(() => setMounted(true), [])

// In render:
{mounted && isConnected ? <WalletInfo /> : <ConnectButton />}
```

### Error Handling Pattern

```typescript
// User-friendly error mapping
const getUserFriendlyError = (error: Error): string => {
  const msg = error.message.toLowerCase()
  if (msg.includes("user rejected")) return "Transaction cancelled"
  if (msg.includes("insufficient funds")) return "Insufficient balance"
  if (msg.includes("network")) return "Network error. Please retry."
  return "Something went wrong. Please try again."
}
```

### Toast Notifications

```typescript
// Success with action
toast.success('Deposit successful!', {
  description: 'Your invoice is now earning yield.',
  action: {
    label: 'View tx',
    onClick: () => window.open(`https://explorer/tx/${hash}`, '_blank'),
  },
})
```

---

## 5. DEVELOPMENT WORKFLOW

### The Explore → Plan → Code → Commit Cycle

```
1. EXPLORE: Read files, understand context (NO code yet)
2. PLAN: Think through approach, name specific files
3. CODE: Implement incrementally, test after each change
4. COMMIT: Atomic commits with clear messages
```

### Testing Strategy

```bash
# Before ANY commit:
cd contracts && forge test        # Contract tests MUST pass
cd app && pnpm tsc --noEmit       # TypeScript MUST pass
cd app && pnpm next build         # Build MUST succeed
```

### Commit Message Format

```
feat(scope): Short description

- Bullet point details
- What changed and why

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

---

## 6. COMMON PITFALLS TO AVOID

### Don't Over-Engineer

| Over-Engineered | Just Right |
|-----------------|------------|
| Feature flags for everything | Direct implementation |
| Abstract base classes | Simple functions |
| Complex state machines | useState + useEffect |
| Custom design system | shadcn/ui components |

### Don't Skip Planning

**Time spent planning saves 10x in implementation.**

Bad: "Let me quickly add a deposit feature"
Good: "Let me understand the deposit flow, identify files, then implement"

### Don't Ignore Mobile

```tsx
// Always test responsive
<div className="grid grid-cols-1 md:grid-cols-3">
<div className="hidden md:flex">  // Desktop only
<div className="flex md:hidden">  // Mobile only
```

### Don't Forget Loading States

```tsx
{isLoading ? (
  <Loader2 className="w-4 h-4 animate-spin" />
) : (
  <ActualContent />
)}
```

---

## 7. HACKATHON-SPECIFIC LESSONS

### What Judges Look For

1. **Working demo** > Perfect code
2. **Clear value prop** > Feature count
3. **Real transactions** > Mock data
4. **Innovation** > Polish
5. **Technical depth** > Breadth

### Time Allocation (48-72 hours)

```
Planning & Design:     20%  (10-15 hours)
Core Implementation:   50%  (25-35 hours)
Polish & Bug Fixes:    20%  (10-15 hours)
Demo & Submission:     10%  (5-7 hours)
```

### Minimum Viable Demo

Your demo MUST show:
1. User connects wallet
2. User performs main action
3. Blockchain transaction succeeds
4. User sees result

Everything else is bonus.

### Demo Video Tips

- 2-3 minutes max
- Show real transactions (testnet is fine)
- Narrate what's happening
- End with clear value statement

---

## 8. REUSABLE PATTERNS

### Protocol Health Banner

```tsx
<div className="flex items-center justify-between p-4 rounded-lg
  bg-gradient-to-r from-success/5 via-transparent to-success/5
  border border-success/20">
  <div className="flex items-center gap-6">
    <div className="flex items-center gap-2">
      <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
      <span className="text-sm font-medium">Protocol Status: Operational</span>
    </div>
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Shield className="w-4 h-4 text-success" />
      <span><span className="font-semibold text-foreground">0%</span> default rate</span>
    </div>
  </div>
</div>
```

### Risk Score Badge

```tsx
function RiskBadge({ score }: { score: number }) {
  const color = score >= 80 ? 'success' : score >= 60 ? 'warning' : 'destructive'
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-2 h-2 rounded-full bg-${color}`} />
      <span className={`text-xs font-medium text-${color}`}>{score}</span>
    </div>
  )
}
```

### Status Badge

```tsx
function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    Active: "bg-primary/10 text-primary border-primary/30",
    "In Yield": "bg-success/10 text-success border-success/30",
    "At Risk": "bg-warning/10 text-warning border-warning/30",
    Completed: "bg-muted text-muted-foreground border-border",
  }
  return (
    <Badge variant="outline" className={variants[status] || ""}>
      {status}
    </Badge>
  )
}
```

### Error Boundary Setup

```tsx
// Wrap app in Providers.tsx
<ErrorBoundary>
  <WagmiProvider config={config}>
    <QueryClientProvider client={queryClient}>
      <NetworkCheck>
        {children}
      </NetworkCheck>
    </QueryClientProvider>
  </WagmiProvider>
</ErrorBoundary>
```

---

## 9. CHECKLIST FOR FUTURE PROJECTS

### Before Starting
- [ ] Define ONE clear problem
- [ ] Identify primary user
- [ ] Lock scope (CORE features only)
- [ ] Define non-goals explicitly

### During Development
- [ ] Run tests before every commit
- [ ] Type-check continuously
- [ ] Test on mobile
- [ ] Add loading states
- [ ] Add error handling
- [ ] Add success feedback

### Before Submission
- [ ] Build passes
- [ ] No console errors
- [ ] Demo flow works end-to-end
- [ ] README is clear
- [ ] Contracts verified on explorer
- [ ] Demo video recorded (if required)

### Quick Wins for Polish
- [ ] Protocol health banner
- [ ] Trust section with contract links
- [ ] Risk scores / status badges
- [ ] Toast notifications
- [ ] Footer disclaimer

---

## 10. FINAL WISDOM

### The 80/20 Rule

**20% of features deliver 80% of value.**

For Faktory:
- Mint invoice → Deposit → Earn yield → Withdraw
- Everything else was supporting

### Speed vs Quality

For hackathons: **Ship fast, polish later.**
For production: **Get it right first.**

### The Best Code

> "The best code is no code at all."

Before adding a feature, ask:
1. Is this CORE?
2. Can we ship without it?
3. Will users notice if it's missing?

If no to #1 and yes to #2/#3 → Don't build it.

---

*Generated from Faktory Protocol development, December 2024*
*Mantle Global Hackathon 2025*
