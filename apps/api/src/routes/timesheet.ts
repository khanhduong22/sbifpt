import { Hono } from 'hono';
import prisma from '@sbifpt/db';
import { computeAuditHash, GENESIS_HASH, canonicalJsonStringify } from '@sbifpt/audit-trail';
import { z } from 'zod';

export const timesheetRouter = new Hono();

// Helper to format YYYY-MM-DD
function getTodayDateStr(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * GET /api/timesheet/today
 * Returns current user's allocated projects and hours logged for today
 */
timesheetRouter.get('/api/timesheet/today', async (c) => {
  const queryUserId = c.req.query('userId');

  // If no userId provided, default to first senior dev
  let user = null;
  if (queryUserId) {
    user = await prisma.user.findUnique({ where: { id: queryUserId } });
  } else {
    user = await prisma.user.findFirst({
      where: { email: 'minh.td@sbi-fpt.com' },
    });
  }

  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }

  const todayStr = getTodayDateStr();

  // Fetch user's allocated projects
  const memberships = await prisma.projectMember.findMany({
    where: { userId: user.id },
    include: { project: true },
  });

  const allocatedProjects = memberships.map((m) => ({
    projectId: m.projectId,
    projectCode: m.project.code,
    projectName: m.project.name,
    clientName: m.project.clientName,
    roleInProject: m.roleInProject,
    allocatedPercentage: m.allocatedPercentage,
  }));

  // Fetch today's timesheet entries
  const todayEntries = await prisma.timesheetEntry.findMany({
    where: {
      userId: user.id,
      date: todayStr,
    },
    include: { project: true },
  });

  // Fetch today's physical badge swipe
  const todaySwipes = await prisma.oDCSwipe.findMany({
    where: {
      userId: user.id,
      swipeDate: todayStr,
    },
  });

  const totalLoggedHoursToday = Number(
    todayEntries.reduce((sum, e) => sum + e.hours, 0).toFixed(1)
  );
  const physicalHoursToday = Number(
    todaySwipes.reduce((sum, s) => sum + s.totalPhysicalHours, 0).toFixed(1)
  );

  return c.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      billingRatePerHour: user.billingRatePerHour,
      costRatePerHour: user.costRatePerHour,
      odcCardId: user.odcCardId,
      department: user.department,
      avatarUrl: user.avatarUrl,
    },
    date: todayStr,
    allocatedProjects,
    todayEntries,
    totalLoggedHoursToday,
    physicalHoursToday,
    todaySwipes,
  });
});

const logEffortSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date format must be YYYY-MM-DD'),
  allocations: z
    .array(
      z.object({
        projectId: z.string().min(1, 'Project ID is required'),
        hours: z.number().positive('Hours must be greater than 0').max(24, 'Max 24 hours per day'),
        taskDescription: z.string().min(1, 'Task description is required'),
        taskType: z.enum(['DEV', 'CODE_REVIEW', 'MEETING', 'ODC_SECURITY_TRAINING']),
        isBillable: z.boolean().default(true),
      })
    )
    .min(1, 'At least one allocation is required'),
});

/**
 * POST /api/timesheet/log
 * Log effort allocation (e.g. 60% Project A, 40% Project B)
 */
timesheetRouter.post('/api/timesheet/log', async (c) => {
  const body = await c.req.json();
  const parsed = logEffortSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.format() }, 400);
  }

  const { userId, date, allocations } = parsed.data;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }

  // Create entries
  const createdEntries = [];
  for (const alloc of allocations) {
    const entry = await prisma.timesheetEntry.create({
      data: {
        userId,
        projectId: alloc.projectId,
        date,
        hours: alloc.hours,
        taskDescription: alloc.taskDescription,
        taskType: alloc.taskType,
        isBillable: alloc.isBillable,
        status: 'SUBMITTED',
      },
      include: { project: true },
    });
    createdEntries.push(entry);
  }

  // Cryptographically seal in AuditLog (with concurrency retry)
  const auditDetails = {
    action: 'TIMESHEET_LOGGED',
    userId,
    userName: user.name,
    date,
    entriesCount: allocations.length,
    totalHoursLogged: allocations.reduce((sum, a) => sum + a.hours, 0),
  };

  let sealedSequence = 1;
  let sealedBlockHash = '';
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const lastLog = await prisma.auditLog.findFirst({
        orderBy: { sequence: 'desc' },
      });
      const nextSequence = (lastLog?.sequence ?? 0) + 1;
      const previousHash = lastLog?.currentHash ?? GENESIS_HASH;
      const timestamp = new Date();

      const blockHash = computeAuditHash({
        previousHash,
        sequence: nextSequence,
        timestamp,
        action: 'TIMESHEET_LOGGED',
        actorId: userId,
        detailsJson: auditDetails,
      });

      await prisma.auditLog.create({
        data: {
          sequence: nextSequence,
          timestamp,
          action: 'TIMESHEET_LOGGED',
          actorId: userId,
          detailsJson: canonicalJsonStringify(auditDetails),
          previousHash,
          currentHash: blockHash,
        },
      });
      sealedSequence = nextSequence;
      sealedBlockHash = blockHash;
      break;
    } catch (err: any) {
      if (err.code === 'P2002' && attempt < 4) {
        await new Promise((resolve) => setTimeout(resolve, 25 * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }

  return c.json({
    success: true,
    message: `Successfully logged ${createdEntries.length} timesheet entries. Sealed in Audit Block #${sealedSequence}.`,
    auditBlockSequence: sealedSequence,
    blockHash: sealedBlockHash,
    entries: createdEntries,
  });
});
