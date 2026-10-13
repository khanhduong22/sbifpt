import { describe, expect, it } from 'vitest';
import app from '../apps/api/src/index';

describe('SBI FPT Enterprise Executive Simulation Test Suite', () => {
  // =========================================================================
  // JOURNEY 1: Executive Margin Journey
  // =========================================================================
  describe('Journey 1: Executive Margin & Financial Governance', () => {
    it('fetches /api/projects/margin-summary and validates margin accuracy, billability, and health classifications', async () => {
      const res = await app.request('/api/projects/margin-summary');
      expect(res.status).toBe(200);

      const data = await res.json();

      // 1. Validate Company-wide Financial Metrics
      const { companyMetrics, projects } = data;
      expect(companyMetrics).toBeDefined();

      // Gross margin is properly calculated (~55-58%)
      expect(companyMetrics.overallGrossMargin).toBeGreaterThanOrEqual(54.0);
      expect(companyMetrics.overallGrossMargin).toBeLessThanOrEqual(58.0);

      // Billability ratio (> 95%)
      expect(companyMetrics.overallBillabilityRatio).toBeGreaterThan(95.0);

      // Revenue leakage prevention metrics exist and positive
      expect(companyMetrics.monthlyRevenueLeakagePrevented).toBeDefined();
      expect(companyMetrics.monthlyRevenueLeakagePrevented).toBeGreaterThan(0);
      expect(companyMetrics.unbilledHoursIdentified).toBeGreaterThan(0);
      expect(companyMetrics.overbillingHoursFlagged).toBeGreaterThan(0);

      // Total hours and active projects sanity checks
      expect(companyMetrics.totalLoggedHours).toBeGreaterThan(0);
      expect(companyMetrics.totalBillableHours).toBeGreaterThan(0);
      expect(companyMetrics.totalRevenue).toBeGreaterThan(companyMetrics.totalCost);
      expect(companyMetrics.totalGrossProfit).toBe(
        Number((companyMetrics.totalRevenue - companyMetrics.totalCost).toFixed(2))
      );

      // 2. Validate Project-level Health Ratings
      expect(projects.length).toBeGreaterThanOrEqual(3);

      // PRJ-SBI-CORE: HEALTHY margin (~56.5%)
      const coreProject = projects.find((p: any) => p.projectCode === 'PRJ-SBI-CORE');
      expect(coreProject).toBeDefined();
      expect(coreProject.grossMargin).toBeCloseTo(56.5, 0);
      expect(coreProject.marginHealth).toBe('HEALTHY');
      expect(coreProject.billableHours).toBeGreaterThan(0);
      expect(coreProject.billabilityRatio).toBe(100.0);

      // PRJ-BENCH: BENCH rating for non-billable / training project
      const benchProject = projects.find((p: any) => p.projectCode === 'PRJ-BENCH');
      expect(benchProject).toBeDefined();
      expect(benchProject.marginHealth).toBe('BENCH');
      expect(benchProject.nonBillableHours).toBeGreaterThan(0);
      expect(benchProject.totalRevenue).toBe(0);

      // PRJ-SBI-NEO: HEALTHY margin
      const neoProject = projects.find((p: any) => p.projectCode === 'PRJ-SBI-NEO');
      expect(neoProject).toBeDefined();
      expect(neoProject.marginHealth).toBe('HEALTHY');
      expect(neoProject.grossMargin).toBeGreaterThan(50.0);
    });
  });

  // =========================================================================
  // JOURNEY 2: ODC Physical Reconciliation Journey
  // =========================================================================
  describe('Journey 2: ODC Physical Reconciliation & Audit Defense', () => {
    it('fetches /api/odc/reconcile and detects all 4 deliberate demo discrepancies', async () => {
      const res = await app.request('/api/odc/reconcile');
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.summary).toBeDefined();
      expect(data.summary.totalRecords).toBeGreaterThan(0);
      expect(data.summary.matchedCount).toBeGreaterThan(0);
      expect(data.summary.overLoggedCount).toBeGreaterThanOrEqual(1);
      expect(data.summary.underLoggedCount).toBeGreaterThanOrEqual(1);
      expect(data.summary.missingSwipeCount).toBeGreaterThanOrEqual(1);

      // Discrepancy 1: OVER_LOGGED (Dev logged 9.5h vs 7.5h physical badge in ODC)
      const overLoggedItem = data.items.find(
        (i: any) =>
          i.status === 'OVER_LOGGED' &&
          i.timesheetHours === 9.5 &&
          i.physicalHours === 7.5
      );
      expect(overLoggedItem).toBeDefined();
      expect(overLoggedItem.userName).toBe('Pham Hoang Nam');
      expect(overLoggedItem.deltaHours).toBe(2.0);
      expect(overLoggedItem.riskLevel).toBe('HIGH');
      expect(overLoggedItem.violationCode).toBe('FIN-WBS-002');
      expect(overLoggedItem.recommendedAction).toContain('over-billing');

      // Discrepancy 2: UNDER_LOGGED (Dev present 8.5h in ODC vs 4.0h logged)
      const underLoggedItem = data.items.find(
        (i: any) =>
          i.status === 'UNDER_LOGGED' &&
          i.timesheetHours === 4.0 &&
          i.physicalHours === 8.5
      );
      expect(underLoggedItem).toBeDefined();
      expect(underLoggedItem.userName).toBe('Doan Quoc Bao');
      expect(underLoggedItem.deltaHours).toBe(-4.5);
      expect(underLoggedItem.riskLevel).toBe('MEDIUM');
      expect(underLoggedItem.violationCode).toBe('OPS-REV-003');
      expect(underLoggedItem.recommendedAction).toContain('Revenue leakage');

      // Discrepancy 3: MISSING_SWIPE (Dev logged 8.0h client work with 0 badge swipes)
      const missingSwipeItem = data.items.find(
        (i: any) =>
          i.status === 'MISSING_SWIPE' &&
          i.timesheetHours === 8.0 &&
          i.physicalHours === 0.0
      );
      expect(missingSwipeItem).toBeDefined();
      expect(missingSwipeItem.userName).toBe('Vu Tuan Anh');
      expect(missingSwipeItem.riskLevel).toBe('HIGH');
      expect(missingSwipeItem.violationCode).toBe('SEC-ODC-001');
      expect(missingSwipeItem.recommendedAction).toContain('Security audit required');
      expect(missingSwipeItem.actionDetails.ja).toContain('セキュリティ違反');

      // Discrepancy 4: UNDER_LOGGED (Dev swiped 8.0h in ODC with 0h logged in WBS)
      const swipeOnlyItem = data.items.find(
        (i: any) =>
          i.status === 'UNDER_LOGGED' &&
          i.timesheetHours === 0.0 &&
          i.physicalHours === 8.0
      );
      expect(swipeOnlyItem).toBeDefined();
      expect(swipeOnlyItem.userName).toBe('Hoang Kim Ngan');
      expect(swipeOnlyItem.deltaHours).toBe(-8.0);
      expect(swipeOnlyItem.riskLevel).toBe('MEDIUM');
    });

    it('calls POST /api/odc/reconcile/auto to seal an audit block and resolve compliant items', async () => {
      const res = await app.request('/api/odc/reconcile/auto', {
        method: 'POST',
      });
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.matchedCount).toBeGreaterThan(0);
      expect(data.blockHash).toBeDefined();
      expect(data.blockHash).toMatch(/^[a-f0-9]{64}$/i);
      expect(data.auditLogEntryId).toBeDefined();
      expect(data.message).toContain('Auto-reconciliation executed');
      expect(data.processedAt).toBeDefined();
    });
  });

  // =========================================================================
  // JOURNEY 3: Developer 10-Second Timesheet Journey
  // =========================================================================
  describe('Journey 3: Developer 10-Second Timesheet Experience', () => {
    it('fetches today allocations and logs multi-project effort (60% CORE, 25% NEO, 15% BENCH = 8.0h)', async () => {
      // 1. Fetch user context & today status
      const todayRes = await app.request('/api/timesheet/today');
      expect(todayRes.status).toBe(200);

      const todayData = await todayRes.json();
      expect(todayData.user).toBeDefined();
      expect(todayData.user.id).toBeDefined();
      expect(todayData.date).toBeDefined();
      expect(todayData.allocatedProjects.length).toBeGreaterThan(0);

      // 2. Fetch projects to obtain IDs for CORE, NEO, and BENCH
      const prjRes = await app.request('/api/projects');
      expect(prjRes.status).toBe(200);
      const prjData = await prjRes.json();

      const corePrj = prjData.projects.find((p: any) => p.code === 'PRJ-SBI-CORE');
      const neoPrj = prjData.projects.find((p: any) => p.code === 'PRJ-SBI-NEO');
      const benchPrj = prjData.projects.find((p: any) => p.code === 'PRJ-BENCH');

      expect(corePrj).toBeDefined();
      expect(neoPrj).toBeDefined();
      expect(benchPrj).toBeDefined();

      // 3. Multi-project effort allocation:
      // 60% of 8h = 4.8h (PRJ-SBI-CORE)
      // 25% of 8h = 2.0h (PRJ-SBI-NEO)
      // 15% of 8h = 1.2h (PRJ-BENCH)
      // Total = 8.0h
      const logPayload = {
        userId: todayData.user.id,
        date: todayData.date,
        allocations: [
          {
            projectId: corePrj.id,
            hours: 4.8,
            taskDescription: '60% allocation: SBI Shinsei core banking modernization transaction pipeline',
            taskType: 'DEV',
            isBillable: true,
          },
          {
            projectId: neoPrj.id,
            hours: 2.0,
            taskDescription: '25% allocation: SBI NeoMobile real-time order routing microservice',
            taskType: 'DEV',
            isBillable: true,
          },
          {
            projectId: benchPrj.id,
            hours: 1.2,
            taskDescription: '15% allocation: FISC banking compliance security review and internal training',
            taskType: 'ODC_SECURITY_TRAINING',
            isBillable: false,
          },
        ],
      };

      const logRes = await app.request('/api/timesheet/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logPayload),
      });

      expect(logRes.status).toBe(200);
      const logData = await logRes.json();

      // 4. Assert submission returns success and new SHA-256 audit hash
      expect(logData.success).toBe(true);
      expect(logData.blockHash).toBeDefined();
      expect(logData.blockHash).toMatch(/^[a-f0-9]{64}$/i);
      expect(logData.blockHash.length).toBe(64);
      expect(logData.auditBlockSequence).toBeGreaterThan(0);
      expect(logData.entries.length).toBe(3);

      const totalHoursLogged = logData.entries.reduce(
        (sum: number, entry: any) => sum + entry.hours,
        0
      );
      expect(totalHoursLogged).toBe(8.0);
    });
  });

  // =========================================================================
  // JOURNEY 4: Japanese J-SOX & FISC Audit Proof Pack Journey
  // =========================================================================
  describe('Journey 4: Japanese J-SOX & FISC Audit Proof Pack', () => {
    it('fetches /api/audit/proof-pack and validates cryptographic chain integrity, Merkle root, and compliance standards', async () => {
      const res = await app.request('/api/audit/proof-pack');
      expect(res.status).toBe(200);

      const data = await res.json();

      // 1. Validates cryptographic chain integrity
      expect(data.isValid).toBe(true);
      expect(data.chainValid).toBe(true);
      expect(data.tamperingDetected).toBe(false);
      expect(data.tamperingError).toBeNull();

      // 2. Merkle root is a valid 64-character hex string
      expect(data.merkleRoot).toBeDefined();
      expect(data.merkleRoot).toMatch(/^[a-f0-9]{64}$/i);
      expect(data.merkleRoot.length).toBe(64);

      // 3. Compliance standards verification
      expect(data.complianceStandards).toBeDefined();
      expect(data.complianceStandards).toEqual(
        expect.arrayContaining([
          'J-SOX Section 404',
          'FISC Safety Standards',
          'ISO/IEC 27001',
        ])
      );

      // 4. Deep Audit Trail Chain Verification
      expect(data.totalBlocks).toBeGreaterThanOrEqual(6);
      expect(data.verifiedBlocks).toBe(data.totalBlocks);
      expect(data.auditTrail.length).toBe(data.totalBlocks);

      // Verify each block in the sealed sequence is free from tampering
      data.auditTrail.forEach((block: any, index: number) => {
        expect(block.tamperDetected).toBe(false);
        expect(block.hash).toMatch(/^[a-f0-9]{64}$/i);
        expect(block.sequence).toBe(index + 1);
        expect(block.action).toBeDefined();
      });

      // Verify genesis hash is 64 zeros
      expect(data.genesisHash).toBe('0'.repeat(64));
      // Latest hash matches the last block's current hash
      const lastBlock = data.auditTrail[data.auditTrail.length - 1];
      expect(data.latestHash).toBe(lastBlock.hash);
    });
  });
});
