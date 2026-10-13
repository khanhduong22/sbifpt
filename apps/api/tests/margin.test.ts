import { describe, expect, it } from 'vitest';
import {
  calculateBillabilityRatio,
  calculateGrossMargin,
  classifyMarginHealth,
} from '@sbifpt/shared';

describe('Financial Margin & Billability Formulas', () => {
  it('correctly calculates Gross Margin percentage', () => {
    // Revenue $10,000, Cost $4,000 -> Profit $6,000 -> Margin 60%
    const margin = calculateGrossMargin(10000, 4000);
    expect(margin).toBe(60.0);

    // Revenue $4,500, Cost $2,000 -> Profit $2,500 -> Margin 55.56%
    const margin2 = calculateGrossMargin(4500, 2000);
    expect(margin2).toBe(55.56);
  });

  it('handles zero or negative revenue gracefully without NaN', () => {
    expect(calculateGrossMargin(0, 500)).toBe(0);
    expect(calculateGrossMargin(-100, 500)).toBe(0);
  });

  it('correctly calculates Billability Ratio', () => {
    // 160 billable hours out of 200 total hours -> 80%
    const ratio = calculateBillabilityRatio(160, 200);
    expect(ratio).toBe(80.0);

    // 163 billable hours out of 200 total hours -> 81.5%
    const ratio2 = calculateBillabilityRatio(163, 200);
    expect(ratio2).toBe(81.5);
  });

  it('handles zero total hours in billability calculation', () => {
    expect(calculateBillabilityRatio(0, 0)).toBe(0);
  });

  it('accurately classifies margin health against target', () => {
    // Target 60%
    expect(classifyMarginHealth(66.0, 60.0)).toBe('EXCELLENT');
    expect(classifyMarginHealth(60.5, 60.0)).toBe('HEALTHY');
    expect(classifyMarginHealth(54.0, 60.0)).toBe('WARNING');
    expect(classifyMarginHealth(42.0, 60.0)).toBe('CRITICAL');
  });
});
