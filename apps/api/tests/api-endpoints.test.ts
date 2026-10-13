import { describe, expect, it } from 'vitest';
import app from '../src/index';

describe('SBI FPT Hono REST API Endpoints', () => {
  it('GET /health returns 200 and healthy service metadata', async () => {
    const res = await app.request('/health');
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.status).toBe('ok');
    expect(data.service).toBe('sbifpt-api');
    expect(data.timestamp).toBeDefined();
  });

  it('GET /api/projects returns all enterprise projects with members', async () => {
    const res = await app.request('/api/projects');
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.count).toBeGreaterThanOrEqual(3);
    const codes = data.projects.map((p: any) => p.code);
    expect(codes).toContain('PRJ-SBI-CORE');
    expect(codes).toContain('PRJ-SBI-NEO');
    expect(codes).toContain('PRJ-BENCH');
  });

  it('GET /api/employees returns all 10 employees with billing & cost rates', async () => {
    const res = await app.request('/api/employees');
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.count).toBe(10);
    const names = data.employees.map((e: any) => e.name);
    expect(names).toContain('Kenjiro Tanaka');
    expect(names).toContain('Tran Duc Minh');
    expect(names).toContain('Pham Hoang Nam');
  });

  it('GET /api/projects/margin-summary computes margins and billability ratio', async () => {
    const res = await app.request('/api/projects/margin-summary');
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.companyMetrics).toBeDefined();
    expect(data.companyMetrics.totalRevenue).toBeGreaterThan(0);
    expect(data.companyMetrics.totalCost).toBeGreaterThan(0);
    expect(data.companyMetrics.overallGrossMargin).toBeGreaterThan(0);
    expect(data.companyMetrics.overallBillabilityRatio).toBeGreaterThan(70);
    expect(data.projects.length).toBeGreaterThanOrEqual(3);

    const corePrj = data.projects.find((p: any) => p.projectCode === 'PRJ-SBI-CORE');
    expect(corePrj).toBeDefined();
    expect(corePrj.totalRevenue).toBeGreaterThan(0);
    expect(corePrj.grossProfit).toBeGreaterThan(0);
  });

  it('GET /api/odc/reconcile detects deliberate discrepancies between badge swipes and timesheets', async () => {
    const res = await app.request('/api/odc/reconcile');
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.summary).toBeDefined();
    expect(data.summary.totalRecords).toBeGreaterThan(0);
    expect(data.summary.overLoggedCount).toBeGreaterThanOrEqual(1);
    expect(data.summary.underLoggedCount).toBeGreaterThanOrEqual(1);
    expect(data.summary.missingSwipeCount).toBeGreaterThanOrEqual(1);

    // Verify discrepancy items are detected
    const statuses = data.items.map((i: any) => i.status);
    expect(statuses).toContain('OVER_LOGGED');
    expect(statuses).toContain('UNDER_LOGGED');
    expect(statuses).toContain('MISSING_SWIPE');
  });

  it('POST /api/odc/reconcile/auto executes 1-click reconciliation and seals audit block', async () => {
    const res = await app.request('/api/odc/reconcile/auto', {
      method: 'POST',
    });
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.blockHash).toBeDefined();
    expect(data.auditLogEntryId).toBeDefined();
  });

  it('GET /api/timesheet/today returns user allocations and physical presence', async () => {
    const res = await app.request('/api/timesheet/today');
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.user).toBeDefined();
    expect(data.date).toBeDefined();
    expect(data.allocatedProjects.length).toBeGreaterThan(0);
  });

  it('POST /api/timesheet/log saves effort allocation and creates audit record', async () => {
    // Fetch a user and project first
    const empRes = await app.request('/api/employees');
    const empData = await empRes.json();
    const user = empData.employees[0];

    const prjRes = await app.request('/api/projects');
    const prjData = await prjRes.json();
    const project = prjData.projects[0];

    const todayStr = new Date().toISOString().split('T')[0];

    const res = await app.request('/api/timesheet/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        date: todayStr,
        allocations: [
          {
            projectId: project.id,
            hours: 4.5,
            taskDescription: 'Automated test suite effort logging',
            taskType: 'DEV',
            isBillable: true,
          },
        ],
      }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.entries.length).toBe(1);
    expect(data.blockHash).toBeDefined();
  });

  it('GET /api/audit/proof-pack returns tamper-proof cryptographic Merkle proof', async () => {
    const res = await app.request('/api/audit/proof-pack');
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.chainValid).toBe(true);
    expect(data.totalBlocks).toBeGreaterThanOrEqual(6);
    expect(data.merkleRoot).toBeDefined();
    expect(data.merkleRoot.length).toBe(64);
    expect(data.complianceStandard).toContain('J-SOX');
    expect(data.auditTrail.length).toBe(data.totalBlocks);
  });
});
