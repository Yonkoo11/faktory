# Faktory 18-Day Battle Plan

## Priority Matrix

| Task | Effort | Impact | ROI | Priority |
|------|--------|--------|-----|----------|
| Real on-chain stats | 8 hrs | 6/10 | **0.75** | QUICK WIN |
| Privacy-first messaging | 5 hrs | 8/10 | **1.60** | #1 |
| Cost comparison calculator | 5 hrs | 7/10 | **1.40** | #2 |
| Issuer dashboard POC | 15 hrs | 8/10 | **0.53** | #3 |
| QuickBooks persistence | 40 hrs | 8/10 | 0.20 | IF TIME |
| AI regime detection | 15 hrs | 6/10 | 0.40 | IF TIME |

---

## Week 1: Quick Wins (Days 1-7)

### Day 1-2: Real On-Chain Stats
**Goal**: Replace hardcoded TVL/invoices with real blockchain data

**Files**:
- Create: `app/src/hooks/use-protocol-stats.ts`
- Modify: `app/src/app/page.tsx` (lines 221-230)

**Test Criteria**:
- [ ] Mint invoice → TVL updates on landing page
- [ ] Deposit → Active count increases
- [ ] Shows real numbers (even if small)
- [ ] Loading state while fetching
- [ ] Error fallback to "—" not fake data

### Day 3-4: Privacy-First Messaging
**Goal**: Position Faktory as the PRIVATE invoice protocol

**Files**:
- Modify: `app/src/app/page.tsx` (hero section, features)
- Create: Privacy comparison section

**Changes**:
1. Hero: "Your invoices. Your data. Your yield."
2. Add feature card: "Privacy by Default"
3. Add comparison table: Faktory vs Centrifuge vs Goldfinch
4. Emphasize commitment hashes

**Test Criteria**:
- [ ] Privacy mentioned in first 10 seconds of landing page
- [ ] Clear explanation of how data stays private
- [ ] Comparison shows Faktory advantage

### Day 5-6: Cost Comparison Calculator
**Goal**: Show Mantle's cost advantage visually

**Files**:
- Create: `app/src/components/cost-calculator.tsx`
- Modify: `app/src/app/page.tsx` (add section)

**Features**:
- Input: Number of agent transactions/day
- Output: Cost on Ethereum L1 vs Mantle
- Show: "Save $X per month"

**Test Criteria**:
- [ ] Calculator renders correctly
- [ ] Default shows 2,880 tx/day comparison
- [ ] Numbers are realistic (L1 ~$0.50-2 per tx, Mantle ~$0.001)
- [ ] Responsive on mobile

### Day 7: Polish & Test
- Fix any bugs from days 1-6
- Mobile testing
- Demo video re-record if needed

---

## Week 2: Differentiation (Days 8-14)

### Day 8-12: Issuer Dashboard POC
**Goal**: Let invoice issuers control privacy settings

**Files**:
- Create: `app/src/app/dashboard/issuer/page.tsx`
- Create: `app/src/components/privacy-controls.tsx`
- Modify: `app/src/components/dashboard-header.tsx` (add nav)

**Features**:
1. List user's issued invoices
2. Toggle: "Allow lender to see details"
3. Reveal commitment hash to specific address
4. View who has access

**Test Criteria**:
- [ ] Issuer can see their invoices
- [ ] Can toggle privacy per invoice
- [ ] UI clearly shows current privacy state
- [ ] Works on testnet

### Day 13-14: Agent Improvements
**Goal**: Add market regime detection

**Files**:
- Modify: `agent/src/optimizer.ts`
- Create: `agent/src/regime-detector.ts`

**Features**:
1. Detect market regime (bull/bear/volatile/stable)
2. Adjust strategy weights by regime
3. Show regime in agent activity feed

**Test Criteria**:
- [ ] Agent logs current regime
- [ ] Different regimes produce different recommendations
- [ ] Regime changes trigger strategy reviews

---

## Week 3: Polish & Submit (Days 15-18)

### Day 15-16: QuickBooks (Stretch Goal)
**Only if ahead of schedule**

**Files**:
- Modify: `app/src/lib/quickbooks.ts`
- Create: `app/src/lib/db/tokens.ts`

**Minimum Viable**:
- Store tokens in localStorage (not production-safe but works for demo)
- Show QB invoices in dashboard
- One-click mint from QB invoice

### Day 17: Final Testing
- [ ] Full flow test on Mantle Sepolia
- [ ] Mobile responsiveness check
- [ ] Demo video final version
- [ ] README team section

### Day 18: Submission
- [ ] Final commit
- [ ] Deploy to Vercel
- [ ] Submit to hackathon
- [ ] Celebrate 🎉

---

## Test Commands

```bash
# Run all tests
cd contracts && forge test
cd app && pnpm tsc --noEmit
cd agent && pnpm test

# Manual test flow
1. Open https://faktory-app.vercel.app/
2. Connect wallet (Mantle Sepolia)
3. Mint invoice → verify on-chain
4. Deposit → verify yield accrual
5. Check agent page → verify WebSocket
6. Check landing page → verify real stats
```

---

## Success Metrics

After 18 days, Faktory should:

| Metric | Before | After | Target |
|--------|--------|-------|--------|
| Novelty score | 5/10 | 8/10 | ✅ |
| Real data | 2/10 | 8/10 | ✅ |
| Privacy messaging | 4/10 | 9/10 | ✅ |
| Cost advantage shown | 3/10 | 9/10 | ✅ |
| QuickBooks | 3/10 | 5/10 | Stretch |
| AI depth | 5.5/10 | 6.5/10 | ✅ |

**Winning probability**: 7/10 → **35-45%** (up from 20-30%)
