# End-to-End Test Checklist

> Manual testing checklist for Faktory Protocol demo

**Date**: 2024-12-31
**Version**: Post-Redesign
**Test Environment**: Mantle Sepolia Testnet

---

## Pre-Test Setup

- [ ] Contracts deployed to Mantle Sepolia
- [ ] Agent service running (port 8080)
- [ ] Frontend running (port 3000)
- [ ] MetaMask connected to Mantle Sepolia
- [ ] Test wallet has MNT tokens for gas

---

## Test Flow 1: Complete Invoice Lifecycle

### 1.1 Mint Invoice
- [ ] Navigate to `/dashboard/mint`
- [ ] Fill in invoice details:
  - Client name: "Test Client"
  - Amount: $10,000
  - Due date: 30 days from now
  - Description: "Test invoice for demo"
- [ ] Click "Mint Invoice"
- [ ] Confirm MetaMask transaction
- [ ] Verify success message appears
- [ ] Verify invoice appears in dashboard
- [ ] **Expected gas cost**: ~$0.01 MNT

**Pass/Fail**: ____
**Notes**: ________________________________

### 1.2 Deposit to Yield Vault
- [ ] From dashboard, click "Deposit" on newly minted invoice
- [ ] Select strategy: "Conservative" (3.5% APY)
- [ ] Enter principal amount: $10,000 USDC (simulated)
- [ ] Review deposit summary
- [ ] Click "Approve NFT" - confirm MetaMask
- [ ] Click "Deposit" - confirm MetaMask
- [ ] Verify success message
- [ ] Verify invoice status shows "In Yield"
- [ ] **Expected gas cost**: ~$0.02 MNT total

**Pass/Fail**: ____
**Notes**: ________________________________

### 1.3 Agent Analysis
- [ ] Navigate to `/dashboard/agent`
- [ ] Verify WebSocket connection shows "Connected"
- [ ] Wait for agent analysis cycle (~30 seconds)
- [ ] Verify live activity feed shows:
  - Market condition check
  - Invoice scan
  - Risk analysis for your invoice
  - Strategy recommendation
- [ ] Verify agent stats update:
  - Active deposits: 1
  - Strategies analyzed
  - Confidence scores

**Pass/Fail**: ____
**Notes**: ________________________________

### 1.4 Change Strategy
- [ ] Click on invoice from dashboard
- [ ] Navigate to invoice detail page
- [ ] Click "Change Strategy"
- [ ] Select "Aggressive" (7% APY)
- [ ] Review APY difference
- [ ] Confirm transaction
- [ ] Verify strategy updated
- [ ] Verify yield recalculation

**Pass/Fail**: ____
**Notes**: ________________________________

### 1.5 Withdraw
- [ ] From invoice detail page, click "Withdraw"
- [ ] Review withdrawal summary:
  - Principal amount
  - Accrued yield
  - Total to receive
- [ ] Confirm transaction
- [ ] Verify NFT returned to wallet
- [ ] Verify invoice status shows "Paid" or "Withdrawn"
- [ ] Verify balance updated

**Pass/Fail**: ____
**Notes**: ________________________________

---

## Test Flow 2: Error Handling

### 2.1 Invalid Contract Addresses
- [ ] Stop frontend
- [ ] Set `NEXT_PUBLIC_INVOICE_NFT_ADDRESS=0x0000000000000000000000000000000000000000`
- [ ] Start frontend
- [ ] Verify red error banner appears at top
- [ ] Verify error message lists invalid addresses
- [ ] Verify banner is dismissible
- [ ] Restore correct addresses

**Pass/Fail**: ____
**Notes**: ________________________________

### 2.2 Agent Timeout Protection
- [ ] Monitor agent console logs
- [ ] Wait for analysis cycle to start
- [ ] If cycle takes >60s, verify timeout message appears
- [ ] Verify circuit breaker trips
- [ ] Verify agent recovers on next cycle

**Pass/Fail**: ____
**Notes**: ________________________________

### 2.3 Network Disconnection
- [ ] Disconnect from Mantle network in MetaMask
- [ ] Verify network warning appears
- [ ] Attempt transaction - verify fails gracefully
- [ ] Reconnect to Mantle
- [ ] Verify functionality restores

**Pass/Fail**: ____
**Notes**: ________________________________

---

## Test Flow 3: UI/UX Verification

### 3.1 Landing Page
- [ ] Navigate to `/`
- [ ] Verify blue/navy color scheme
- [ ] Verify no glassmorphism effects
- [ ] Verify flat card designs
- [ ] Verify AnimatedCounter works on scroll
- [ ] Verify all buttons use solid colors (no gradients)
- [ ] Verify responsive design on mobile (resize browser)

**Pass/Fail**: ____
**Notes**: ________________________________

### 3.2 Dashboard
- [ ] Verify portfolio metrics display correctly
- [ ] Verify invoice table sorts properly
- [ ] Verify search functionality works
- [ ] Verify StatusBadge shows correct colors
- [ ] Verify StatCard components render
- [ ] Test mobile responsive layout

**Pass/Fail**: ____
**Notes**: ________________________________

### 3.3 Agent Activity
- [ ] Verify WebSocket reconnection works (refresh page)
- [ ] Verify thought stream displays in real-time
- [ ] Verify timestamp formatting
- [ ] Verify color coding by thought type:
  - Thinking (blue)
  - Analysis (default)
  - Decision (green)
  - Error (red)

**Pass/Fail**: ____
**Notes**: ________________________________

---

## Performance Checks

### Build Performance
- [ ] Build time < 10 seconds
- [ ] No TypeScript errors
- [ ] No console warnings in production build

**Build Time**: ______s
**Pass/Fail**: ____

### Runtime Performance
- [ ] Page load time < 3 seconds
- [ ] Agent cycle completes < 30 seconds
- [ ] Transaction confirmation < 10 seconds
- [ ] No memory leaks (check DevTools)

**Pass/Fail**: ____
**Notes**: ________________________________

---

## Security Checks

### Contract Interactions
- [ ] All transactions require MetaMask confirmation
- [ ] Gas estimates display before confirmation
- [ ] Transactions include proper error messages
- [ ] No hardcoded private keys in frontend
- [ ] Environment variables properly loaded

**Pass/Fail**: ____
**Notes**: ________________________________

---

## Summary

**Total Tests**: 25
**Passed**: ____
**Failed**: ____
**Blocked**: ____

**Critical Issues**:
1. ________________________________
2. ________________________________
3. ________________________________

**Nice-to-Have Improvements**:
1. ________________________________
2. ________________________________
3. ________________________________

**Demo-Ready**: YES / NO

**Tester Signature**: ________________
**Date**: ________________
