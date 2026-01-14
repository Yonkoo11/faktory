import { describe, it, expect } from 'vitest';
import { optimizeStrategy, shouldChangeStrategy, analyzeInvoice } from './optimizer.js';
import { Strategy, Invoice, Deposit, InvoiceStatus } from './types.js';

// Helper to create mock invoice
function createMockInvoice(overrides: Partial<Invoice> = {}): Invoice {
  const now = Math.floor(Date.now() / 1000);
  return {
    tokenId: '1',
    dataCommitment: '0x1234',
    amountCommitment: '0x5678',
    dueDate: now + 30 * 24 * 60 * 60, // 30 days from now
    createdAt: now,
    issuer: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    status: InvoiceStatus.Active,
    riskScore: 75,
    paymentProbability: 85,
    ...overrides,
  };
}

// Helper to create mock deposit
function createMockDeposit(overrides: Partial<Deposit> = {}): Deposit {
  const now = Math.floor(Date.now() / 1000);
  return {
    tokenId: '1',
    owner: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    strategy: Strategy.Conservative,
    depositTime: now - 7 * 24 * 60 * 60, // 7 days ago
    principal: BigInt(10000) * BigInt(10 ** 18),
    accruedYield: BigInt(100) * BigInt(10 ** 18),
    lastYieldUpdate: now,
    active: true,
    ...overrides,
  };
}

describe('optimizeStrategy', () => {
  const now = Math.floor(Date.now() / 1000);

  it('recommends Aggressive for high-risk, high-probability, long-duration invoices', () => {
    const invoice = createMockInvoice({
      riskScore: 90,
      paymentProbability: 95,
      dueDate: now + 90 * 24 * 60 * 60, // 90 days
    });

    const result = optimizeStrategy({
      invoice,
      currentTimestamp: now,
    });

    expect(result.strategy).toBe(Strategy.Aggressive);
    expect(result.confidence).toBeGreaterThanOrEqual(70);
    expect(result.reasoning).toContain('AGGRESSIVE');
  });

  it('recommends Conservative for moderate-risk invoices', () => {
    const invoice = createMockInvoice({
      riskScore: 65,
      paymentProbability: 70,
      dueDate: now + 30 * 24 * 60 * 60, // 30 days
    });

    const result = optimizeStrategy({
      invoice,
      currentTimestamp: now,
    });

    expect(result.strategy).toBe(Strategy.Conservative);
    expect(result.reasoning).toContain('CONSERVATIVE');
  });

  it('recommends Hold for low-risk, short-duration invoices', () => {
    const invoice = createMockInvoice({
      riskScore: 30,
      paymentProbability: 40,
      dueDate: now + 5 * 24 * 60 * 60, // 5 days
    });

    const result = optimizeStrategy({
      invoice,
      currentTimestamp: now,
    });

    expect(result.strategy).toBe(Strategy.Hold);
    expect(result.reasoning).toContain('HOLD');
  });

  it('recommends Hold for overdue invoices', () => {
    const invoice = createMockInvoice({
      riskScore: 90,
      paymentProbability: 95,
      dueDate: now - 10 * 24 * 60 * 60, // 10 days overdue
    });

    const result = optimizeStrategy({
      invoice,
      currentTimestamp: now,
    });

    expect(result.strategy).toBe(Strategy.Hold);
    expect(result.factors.some((f) => f.includes('OVERDUE'))).toBe(true);
  });

  it('considers existing deposit strategy in optimization', () => {
    const invoice = createMockInvoice({
      riskScore: 85,
      paymentProbability: 90,
    });
    const deposit = createMockDeposit({
      strategy: Strategy.Hold,
    });

    const result = optimizeStrategy({
      invoice,
      deposit,
      currentTimestamp: now,
    });

    // Should note that Hold strategy can be upgraded
    expect(result.factors.some((f) => f.includes('Hold'))).toBe(true);
  });

  it('returns factors explaining the recommendation', () => {
    const invoice = createMockInvoice();

    const result = optimizeStrategy({
      invoice,
      currentTimestamp: now,
    });

    expect(result.factors.length).toBeGreaterThan(0);
    expect(result.factors.every((f) => typeof f === 'string')).toBe(true);
  });

  it('confidence is always between 0 and 100', () => {
    const testCases = [
      { riskScore: 0, paymentProbability: 0 },
      { riskScore: 50, paymentProbability: 50 },
      { riskScore: 100, paymentProbability: 100 },
    ];

    for (const tc of testCases) {
      const invoice = createMockInvoice(tc);
      const result = optimizeStrategy({
        invoice,
        currentTimestamp: now,
      });

      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(100);
    }
  });
});

describe('shouldChangeStrategy', () => {
  it('returns false when current and recommended are the same', () => {
    expect(shouldChangeStrategy(Strategy.Conservative, Strategy.Conservative, 90)).toBe(false);
  });

  it('returns false when confidence is below threshold', () => {
    expect(shouldChangeStrategy(Strategy.Hold, Strategy.Conservative, 50, 70)).toBe(false);
  });

  it('allows moving to safer strategy with sufficient confidence', () => {
    expect(shouldChangeStrategy(Strategy.Aggressive, Strategy.Conservative, 75)).toBe(true);
    expect(shouldChangeStrategy(Strategy.Conservative, Strategy.Hold, 75)).toBe(true);
  });

  it('requires higher confidence to move to riskier strategy', () => {
    // Default minConfidence is 70, so needs 80+ for riskier
    expect(shouldChangeStrategy(Strategy.Hold, Strategy.Conservative, 75)).toBe(false);
    expect(shouldChangeStrategy(Strategy.Hold, Strategy.Conservative, 85)).toBe(true);
    expect(shouldChangeStrategy(Strategy.Conservative, Strategy.Aggressive, 85)).toBe(true);
  });

  it('respects custom minConfidence parameter', () => {
    expect(shouldChangeStrategy(Strategy.Hold, Strategy.Conservative, 65, 50)).toBe(true);
    expect(shouldChangeStrategy(Strategy.Hold, Strategy.Aggressive, 65, 50)).toBe(true);
  });
});

describe('analyzeInvoice', () => {
  const now = Math.floor(Date.now() / 1000);

  it('returns complete analysis result', () => {
    const invoice = createMockInvoice();

    const result = analyzeInvoice(invoice, undefined, now);

    expect(result.tokenId).toBe(invoice.tokenId);
    expect(result.invoice).toBe(invoice);
    expect(result.riskScore).toBe(invoice.riskScore);
    expect(result.paymentProbability).toBe(invoice.paymentProbability);
    expect(typeof result.daysUntilDue).toBe('number');
    expect(typeof result.reasoning).toBe('string');
    expect(typeof result.shouldAct).toBe('boolean');
  });

  it('calculates days until due correctly', () => {
    const daysAhead = 45;
    const invoice = createMockInvoice({
      dueDate: now + daysAhead * 24 * 60 * 60,
    });

    const result = analyzeInvoice(invoice, undefined, now);

    expect(result.daysUntilDue).toBe(daysAhead);
  });

  it('sets currentStrategy to Hold when no deposit exists', () => {
    const invoice = createMockInvoice();

    const result = analyzeInvoice(invoice, undefined, now);

    expect(result.currentStrategy).toBe(Strategy.Hold);
  });

  it('uses deposit strategy when deposit exists', () => {
    const invoice = createMockInvoice();
    const deposit = createMockDeposit({
      strategy: Strategy.Aggressive,
    });

    const result = analyzeInvoice(invoice, deposit, now);

    expect(result.currentStrategy).toBe(Strategy.Aggressive);
  });

  it('shouldAct is true when strategy change is warranted', () => {
    const invoice = createMockInvoice({
      riskScore: 95,
      paymentProbability: 98,
      dueDate: now + 90 * 24 * 60 * 60,
    });
    const deposit = createMockDeposit({
      strategy: Strategy.Hold,
    });

    const result = analyzeInvoice(invoice, deposit, now);

    // High metrics + long duration should recommend upgrade from Hold
    expect(result.recommendedStrategy).not.toBe(Strategy.Hold);
    expect(result.shouldAct).toBe(true);
  });

  it('shouldAct is false when strategy is optimal', () => {
    const invoice = createMockInvoice({
      riskScore: 95,
      paymentProbability: 98,
      dueDate: now + 90 * 24 * 60 * 60,
    });
    const deposit = createMockDeposit({
      strategy: Strategy.Aggressive, // Already on aggressive
    });

    const result = analyzeInvoice(invoice, deposit, now);

    // Already on recommended strategy
    expect(result.shouldAct).toBe(false);
  });
});
