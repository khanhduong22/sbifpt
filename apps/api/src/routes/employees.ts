import { Hono } from 'hono';
import prisma from '@sbifpt/db';

export const employeesRouter = new Hono();

/**
 * GET /api/employees: List of all staff with billing/cost rates and departments
 */
employeesRouter.get('/api/employees', async (c) => {
  const users = await prisma.user.findMany({
    orderBy: [{ role: 'asc' }, { name: 'asc' }],
    include: {
      projectMembers: {
        include: {
          project: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
        },
      },
    },
  });

  const formatted = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    billingRatePerHour: u.billingRatePerHour,
    costRatePerHour: u.costRatePerHour,
    marginPerHour: Number((u.billingRatePerHour - u.costRatePerHour).toFixed(2)),
    odcCardId: u.odcCardId,
    avatarUrl: u.avatarUrl,
    department: u.department,
    assignedProjects: u.projectMembers.map((pm) => ({
      projectId: pm.projectId,
      code: pm.project.code,
      name: pm.project.name,
      roleInProject: pm.roleInProject,
      allocatedPercentage: pm.allocatedPercentage,
    })),
  }));

  return c.json({
    employees: formatted,
    count: formatted.length,
  });
});
