import { describe, expect, it } from 'vitest';
import { evaluateEffortDiscrepancy } from '@sbifpt/shared';

describe('ODC Effort Reconciliation Engine', () => {
  it('identifies OVER_LOGGED discrepancy when logged hours exceed physical presence beyond tolerance', () => {
    // Dev logged 9.5h in WBS, but badge swipe shows only 7.5h
    const result = evaluateEffortDiscrepancy({
      timesheetHours: 9.5,
      physicalHours: 7.5,
      toleranceHours: 0.5,
    });

    expect(result.status).toBe('OVER_LOGGED');
    expect(result.riskLevel).toBe('HIGH');
    expect(result.deltaHours).toBe(2.0);
    expect(result.violationCode).toBe('FIN-WBS-002');
    expect(result.recommendedAction).toContain('over-billing');
  });

  it('identifies UNDER_LOGGED discrepancy when engineer was physically present longer than logged', () => {
    // Dev swiped 8.5h in ODC room, but only logged 4.0h in WBS
    const result = evaluateEffortDiscrepancy({
      timesheetHours: 4.0,
      physicalHours: 8.5,
      toleranceHours: 0.5,
    });

    expect(result.status).toBe('UNDER_LOGGED');
    expect(result.riskLevel).toBe('MEDIUM');
    expect(result.deltaHours).toBe(-4.5);
    expect(result.violationCode).toBe('OPS-REV-003');
    expect(result.recommendedAction).toContain('Revenue leakage');
  });

  it('identifies MISSING_SWIPE high-severity security violation when work logged without physical badge swipe', () => {
    // Dev logged 8.0h on client project, but had ZERO badge swipe in ODC
    const result = evaluateEffortDiscrepancy({
      timesheetHours: 8.0,
      physicalHours: 0.0,
      toleranceHours: 0.5,
    });

    expect(result.status).toBe('MISSING_SWIPE');
    expect(result.riskLevel).toBe('HIGH');
    expect(result.violationCode).toBe('SEC-ODC-001');
    expect(result.recommendedAction).toContain('Security audit required');
    expect(result.actionDetails.ja).toContain('セキュリティ違反');
  });

  it('identifies MATCHED status when difference is within allowable tolerance', () => {
    // Dev logged 8.0h in WBS, swiped 8.2h in ODC (delta = -0.2h <= 0.5h)
    const result = evaluateEffortDiscrepancy({
      timesheetHours: 8.0,
      physicalHours: 8.2,
      toleranceHours: 0.5,
    });

    expect(result.status).toBe('MATCHED');
    expect(result.riskLevel).toBe('LOW');
    expect(result.recommendedAction).toContain('compliant');
  });
});
