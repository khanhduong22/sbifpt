import { Hono } from 'hono';
import prisma from '@sbifpt/db';
import { computeAuditHash, GENESIS_HASH, canonicalJsonStringify } from '@sbifpt/audit-trail';
import {
  evaluateEffortDiscrepancy,
  ODCReconciliationItem,
  ODCReconciliationSummary,
  ODCReconcileResponse,
  AutoReconcileResult,
} from '@sbifpt/shared';

export const odcRouter = new Hono();

/**
 * GET /api/odc/reconcile
 * Compare Timesheet hours vs ODCSwipe hours by date & user
 */
odcRouter.get('/api/odc/reconcile', async (c) => {
  const queryDate = c.req.query('date');
  const queryUserId = c.req.query('userId');
  const queryStatus = c.req.query('status');

  // Fetch all users to have rich details
  const users = await prisma.user.findMany();
  const userMap = new Map(users.map((u) => [u.id, u]));

  // Fetch timesheet entries with project details
  const timesheetWhere: any = {};
  if (queryDate) timesheetWhere.date = queryDate;
  if (queryUserId) timesheetWhere.userId = queryUserId;

  const timesheetEntries = await prisma.timesheetEntry.findMany({
    where: timesheetWhere,
    include: { project: true, user: true },
    orderBy: { date: 'desc' },
  });

  // Fetch ODC swipes
  const swipeWhere: any = {};
  if (queryDate) swipeWhere.swipeDate = queryDate;
  if (queryUserId) swipeWhere.userId = queryUserId;

  const odcSwipes = await prisma.oDCSwipe.findMany({
    where: swipeWhere,
    orderBy: { swipeDate: 'desc' },
  });

  // Collect unique (userId, date) keys
  const dateUserKeys = new Set<string>();
  timesheetEntries.forEach((t) => dateUserKeys.add(`${t.userId}:::${t.date}`));
  odcSwipes.forEach((s) => dateUserKeys.add(`${s.userId}:::${s.swipeDate}`));

  // Group timesheets by key
  const tsGroup = new Map<string, typeof timesheetEntries>();
  for (const t of timesheetEntries) {
    const key = `${t.userId}:::${t.date}`;
    if (!tsGroup.has(key)) tsGroup.set(key, []);
    tsGroup.get(key)!.push(t);
  }

  // Group swipes by key
  const swipeGroup = new Map<string, typeof odcSwipes>();
  for (const s of odcSwipes) {
    const key = `${s.userId}:::${s.swipeDate}`;
    if (!swipeGroup.has(key)) swipeGroup.set(key, []);
    swipeGroup.get(key)!.push(s);
  }

  const items: ODCReconciliationItem[] = [];
  let matchedCount = 0;
  let overLoggedCount = 0;
  let underLoggedCount = 0;
  let missingSwipeCount = 0;
  let totalDiscrepancyHours = 0;
  let potentialBillingRiskUsd = 0;
  let potentialLeakageUsd = 0;

  for (const key of dateUserKeys) {
    const [userId, date] = key.split(':::');
    const user = userMap.get(userId);
    if (!user) continue;

    const userTs = tsGroup.get(key) || [];
    const userSwipes = swipeGroup.get(key) || [];

    const totalTimesheetHours = Number(
      userTs.reduce((acc, curr) => acc + curr.hours, 0).toFixed(1)
    );
    const totalPhysicalHours = Number(
      userSwipes.reduce((acc, curr) => acc + curr.totalPhysicalHours, 0).toFixed(1)
    );

    const evalResult = evaluateEffortDiscrepancy({
      timesheetHours: totalTimesheetHours,
      physicalHours: totalPhysicalHours,
      toleranceHours: 0.5,
    });

    // Filter by queryStatus if provided
    if (queryStatus && evalResult.status !== queryStatus) {
      continue;
    }

    // Determine primary project if available
    const primaryProject = userTs[0]?.project;

    // Financial impact calculations
    if (evalResult.status === 'OVER_LOGGED' || evalResult.status === 'MISSING_SWIPE') {
      const overHours = evalResult.status === 'MISSING_SWIPE' ? totalTimesheetHours : evalResult.deltaHours;
      potentialBillingRiskUsd += overHours * user.billingRatePerHour;
    } else if (evalResult.status === 'UNDER_LOGGED') {
      const unbilledHours = Math.abs(evalResult.deltaHours);
      potentialLeakageUsd += unbilledHours * user.billingRatePerHour;
    }

    if (evalResult.status === 'MATCHED') matchedCount++;
    if (evalResult.status === 'OVER_LOGGED') overLoggedCount++;
    if (evalResult.status === 'UNDER_LOGGED') underLoggedCount++;
    if (evalResult.status === 'MISSING_SWIPE') missingSwipeCount++;

    if (evalResult.status !== 'MATCHED') {
      totalDiscrepancyHours += Math.abs(evalResult.deltaHours);
    }

    items.push({
      id: `rec_${userId}_${date}`,
      date,
      userId: user.id,
      userName: user.name,
      odcCardId: user.odcCardId || 'N/A',
      department: user.department || 'Delivery Unit 1',
      projectCode: primaryProject?.code,
      projectName: primaryProject?.name,
      timesheetHours: totalTimesheetHours,
      physicalHours: totalPhysicalHours,
      deltaHours: evalResult.deltaHours,
      status: evalResult.status,
      riskLevel: evalResult.riskLevel,
      violationCode: evalResult.violationCode,
      recommendedAction: evalResult.recommendedAction,
      actionDetails: evalResult.actionDetails,
    });
  }

  // Sort: Discrepancies first, then by date descending
  items.sort((a, b) => {
    const statusWeight: Record<string, number> = {
      MISSING_SWIPE: 4,
      OVER_LOGGED: 3,
      UNDER_LOGGED: 2,
      MATCHED: 1,
    };
    const diff = (statusWeight[b.status] || 0) - (statusWeight[a.status] || 0);
    if (diff !== 0) return diff;
    return b.date.localeCompare(a.date);
  });

  const totalRecords = items.length;
  const auditCompliantRate =
    totalRecords > 0 ? Number(((matchedCount / totalRecords) * 100).toFixed(1)) : 100;

  const summary: ODCReconciliationSummary = {
    totalRecords,
    matchedCount,
    overLoggedCount,
    underLoggedCount,
    missingSwipeCount,
    totalDiscrepancyHours: Number(totalDiscrepancyHours.toFixed(1)),
    potentialBillingRiskUsd: Number(potentialBillingRiskUsd.toFixed(2)),
    potentialLeakageUsd: Number(potentialLeakageUsd.toFixed(2)),
    auditCompliantRate,
  };

  const response: ODCReconcileResponse = {
    summary,
    items,
    reconciledAt: new Date().toISOString(),
  };

  return c.json(response);
});

/**
 * POST /api/odc/reconcile/auto
 * 1-Click Auto-Reconcile that resolves clean matches and flags exceptions into an audit bundle
 */
odcRouter.post('/api/odc/reconcile/auto', async (c) => {
  // Fetch current timesheet entries and ODC swipes
  const timesheets = await prisma.timesheetEntry.findMany();
  const swipes = await prisma.oDCSwipe.findMany();

  // Group by (userId, date)
  const dateUserKeys = new Set<string>();
  timesheets.forEach((t) => dateUserKeys.add(`${t.userId}:::${t.date}`));
  swipes.forEach((s) => dateUserKeys.add(`${s.userId}:::${s.swipeDate}`));

  let matchedCount = 0;
  let flaggedCount = 0;
  const entriesToApprove: string[] = [];
  const entriesToFlag: string[] = [];

  for (const key of dateUserKeys) {
    const [userId, date] = key.split(':::');
    const userTs = timesheets.filter((t) => t.userId === userId && t.date === date);
    const userSwipes = swipes.filter((s) => s.userId === userId && s.swipeDate === date);

    const tsHours = userTs.reduce((sum, t) => sum + t.hours, 0);
    const physicalHours = userSwipes.reduce((sum, s) => sum + s.totalPhysicalHours, 0);

    const evalResult = evaluateEffortDiscrepancy({
      timesheetHours: tsHours,
      physicalHours,
      toleranceHours: 0.5,
    });

    if (evalResult.status === 'MATCHED') {
      matchedCount++;
      userTs.forEach((t) => {
        if (t.status !== 'APPROVED') entriesToApprove.push(t.id);
      });
    } else if (evalResult.status === 'OVER_LOGGED' || evalResult.status === 'MISSING_SWIPE') {
      flaggedCount++;
      userTs.forEach((t) => {
        if (t.status !== 'FLAGGED') entriesToFlag.push(t.id);
      });
    }
  }

  // Batch update statuses
  if (entriesToApprove.length > 0) {
    await prisma.timesheetEntry.updateMany({
      where: { id: { in: entriesToApprove } },
      data: { status: 'APPROVED' },
    });
  }

  if (entriesToFlag.length > 0) {
    await prisma.timesheetEntry.updateMany({
      where: { id: { in: entriesToFlag } },
      data: { status: 'FLAGGED' },
    });
  }

  // Fetch an executive or compliance actor
  const auditor = await prisma.user.findFirst({
    where: { role: 'AUDITOR' },
  });
  const actorId = auditor?.id || 'system-reconciler';

  const details = {
    action: 'AUTO_RECONCILIATION_RUN',
    processedAt: new Date().toISOString(),
    approvedCount: entriesToApprove.length,
    flaggedCount: entriesToFlag.length,
    totalEvaluatedKeys: dateUserKeys.size,
    matchedKeys: matchedCount,
    fiscCompliant: true,
  };

  // Cryptographically anchor this auto-reconciliation run in AuditLog (with concurrency retry)
  let auditEntry: any;
  let blockHash = '';
  let nextSequence = 1;
  let timestamp = new Date();

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const lastLog = await prisma.auditLog.findFirst({
        orderBy: { sequence: 'desc' },
      });

      nextSequence = (lastLog?.sequence ?? 0) + 1;
      const previousHash = lastLog?.currentHash ?? GENESIS_HASH;
      timestamp = new Date();

      blockHash = computeAuditHash({
        previousHash,
        sequence: nextSequence,
        timestamp,
        action: 'AUTO_RECONCILIATION_RUN',
        actorId,
        detailsJson: details,
      });

      auditEntry = await prisma.auditLog.create({
        data: {
          sequence: nextSequence,
          timestamp,
          action: 'AUTO_RECONCILIATION_RUN',
          actorId,
          detailsJson: canonicalJsonStringify(details),
          previousHash,
          currentHash: blockHash,
        },
      });
      break;
    } catch (err: any) {
      if (err.code === 'P2002' && attempt < 4) {
        await new Promise((resolve) => setTimeout(resolve, 25 * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }

  const result: AutoReconcileResult = {
    success: true,
    reconciledCount: entriesToApprove.length,
    flaggedCount: entriesToFlag.length,
    matchedCount,
    auditLogEntryId: auditEntry.id,
    blockHash,
    message: `Auto-reconciliation executed. Approved ${entriesToApprove.length} compliant records, flagged ${entriesToFlag.length} discrepancies. Audit block #${nextSequence} sealed.`,
    processedAt: timestamp.toISOString(),
  };

  return c.json(result);
});
