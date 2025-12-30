# UI/UX Redesign Implementation Plan

## Overview
This document defines the 5 critical UI/UX fixes with testable acceptance criteria.

---

## Fix 1: Remove Comparison Table from Landing Page

### Problem
The comparison table (Faktory vs Centrifuge vs Goldfinch) adds cognitive load before users understand the product. It's too early in the journey.

### Changes Required
- Remove the "Why Privacy Matters" section with comparison table
- Keep the Cost Calculator (move it to a dedicated section later)

### Files to Modify
- `app/src/app/page.tsx`

### Test Criteria
```
[ ] TC1.1: Comparison table HTML is not rendered on landing page
[ ] TC1.2: "Centrifuge" text does not appear on landing page
[ ] TC1.3: "Goldfinch" text does not appear on landing page
[ ] TC1.4: Cost Calculator still renders and functions
[ ] TC1.5: Page loads without console errors
[ ] TC1.6: TypeScript compiles without errors
```

### Verification Commands
```bash
# TC1.1-1.3: Check comparison table removed
curl -s http://localhost:3000 | grep -c "Centrifuge" # Should be 0
curl -s http://localhost:3000 | grep -c "Goldfinch" # Should be 0

# TC1.4: Cost Calculator present
curl -s http://localhost:3000 | grep -c "Cost Savings Calculator" # Should be 1

# TC1.6: TypeScript
cd app && pnpm tsc --noEmit
```

---

## Fix 2: Hide Stats Card When Loading or Zero

### Problem
Showing "Loading...", "...", or "$0" in the stats card damages trust. Users should see nothing until there's real value to show.

### Changes Required
- Wrap stats card in conditional that checks for real data
- Only show when `tvl > 0` AND `!isLoading`
- Show a subtle "Be the first to deposit" message when TVL is 0

### Files to Modify
- `app/src/app/page.tsx`

### Test Criteria
```
[ ] TC2.1: Stats card NOT visible when isLoading=true
[ ] TC2.2: Stats card NOT visible when tvl=0
[ ] TC2.3: Stats card IS visible when tvl>0 and hasData=true
[ ] TC2.4: No "Loading..." text visible on initial page load
[ ] TC2.5: No "..." placeholder text visible on page
[ ] TC2.6: TypeScript compiles without errors
```

### Verification Commands
```bash
# TC2.4-2.5: No loading indicators in initial HTML
curl -s http://localhost:3000 | grep -c "Loading\.\.\." # Should be 0 or minimal
curl -s http://localhost:3000 | grep -c '>\.\.\.<' # Should be 0

# TC2.6: TypeScript
cd app && pnpm tsc --noEmit
```

---

## Fix 3: Simplify Mint Flow to 2 Steps

### Problem
3 steps (Details → Privacy → Review) is excessive. The "Privacy" step has only one toggle and adds friction.

### Changes Required
- Merge Privacy toggle into Step 1 (Details)
- Change step labels: "Invoice Details" → "Review & Mint"
- Update progress indicator to show 2 steps
- Move privacy explanation to an expandable tooltip/accordion

### Files to Modify
- `app/src/app/dashboard/mint/page.tsx`

### Test Criteria
```
[ ] TC3.1: Progress indicator shows "Step X of 2" (not 3)
[ ] TC3.2: Only 2 step circles visible in progress bar
[ ] TC3.3: Privacy toggle (Selective Disclosure) is on Step 1
[ ] TC3.4: Step 2 is Review & Mint (final step)
[ ] TC3.5: Form still validates all required fields
[ ] TC3.6: Mint transaction still works end-to-end
[ ] TC3.7: TypeScript compiles without errors
```

### Verification Commands
```bash
# TC3.1: Check for "of 2"
curl -s http://localhost:3000/dashboard/mint | grep -c "of 3" # Should be 0
curl -s http://localhost:3000/dashboard/mint | grep -c "of 2" # Should be 1

# TC3.7: TypeScript
cd app && pnpm tsc --noEmit
```

---

## Fix 4: Unify Color Palette (Remove Purple Accent)

### Problem
Blue (primary) and purple (accent) compete for attention. The gradient text uses both, creating visual noise.

### Changes Required
- Change `--accent` to match `--primary` or use a complementary shade
- Simplify gradient-text to single color or subtle blue gradient
- Audit all `text-accent`, `bg-accent`, `from-accent` usages

### Files to Modify
- `app/src/app/globals.css`
- Potentially component files using `accent` color

### Test Criteria
```
[ ] TC4.1: --accent CSS variable is blue-based (not purple 290)
[ ] TC4.2: gradient-text uses blue tones only
[ ] TC4.3: No purple (#8B5CF6 or similar) in visible UI
[ ] TC4.4: Buttons remain visually distinct (primary vs secondary)
[ ] TC4.5: Success states (green) still clearly different from primary (blue)
[ ] TC4.6: TypeScript compiles without errors
```

### Verification Commands
```bash
# TC4.1: Check CSS variables
grep "accent.*290" app/src/app/globals.css # Should return nothing

# TC4.3: Check for purple hex
grep -r "8B5CF6\|8b5cf6" app/src/ # Should return nothing

# TC4.6: TypeScript
cd app && pnpm tsc --noEmit
```

---

## Fix 5: Remove Mock Data Labels and Improve Empty States

### Problem
Labels like "Sample Data", "Demo Data", "Mock Data" acknowledge the product isn't real. This damages trust.

### Changes Required
- Remove "Sample Data" badge from yield chart
- Remove "Demo Data" label from invoice table
- If no real data, show helpful empty states instead
- Chart should not render with fake data - show empty state

### Files to Modify
- `app/src/app/dashboard/page.tsx`

### Test Criteria
```
[ ] TC5.1: "Sample Data" text does not appear on dashboard
[ ] TC5.2: "Demo Data" text does not appear on dashboard
[ ] TC5.3: "Mock" text does not appear on dashboard (visible to user)
[ ] TC5.4: Empty state shows when no invoices exist
[ ] TC5.5: Chart shows empty state or hides when no real yield data
[ ] TC5.6: TypeScript compiles without errors
```

### Verification Commands
```bash
# TC5.1-5.3: Check for mock data labels
curl -s http://localhost:3000/dashboard | grep -ci "sample data" # Should be 0
curl -s http://localhost:3000/dashboard | grep -ci "demo data" # Should be 0
curl -s http://localhost:3000/dashboard | grep -ci "mock" # Should be 0

# TC5.6: TypeScript
cd app && pnpm tsc --noEmit
```

---

## Implementation Order

1. **Fix 1** (Comparison table) - Lowest risk, immediate impact
2. **Fix 5** (Mock data labels) - Trust improvement
3. **Fix 2** (Stats loading) - Polish
4. **Fix 4** (Color palette) - Visual consistency
5. **Fix 3** (Mint simplification) - Most complex, highest impact

---

## Final Verification Checklist

After all fixes:

```bash
# Full test suite
cd app && pnpm tsc --noEmit                    # TypeScript
cd app && pnpm build                            # Production build

# Visual checks (manual)
# - Landing page loads in <2s
# - No "Loading..." visible on first paint
# - Single clear CTA above fold
# - Consistent blue color theme
# - Dashboard shows empty state (not fake data)
# - Mint flow completes in 2 steps
```

---

## Rollback Plan

If any fix causes issues:
1. Each fix is in a separate commit
2. Git revert specific commit
3. Redeploy

Commit message format:
```
fix(ui): [Fix N] Brief description

- Change 1
- Change 2

Test: TC{N}.{X} passes
```
