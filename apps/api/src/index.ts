import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { healthRouter } from './routes/health';
import { projectsRouter } from './routes/projects';
import { odcRouter } from './routes/odc';
import { timesheetRouter } from './routes/timesheet';
import { auditRouter } from './routes/audit';
import { employeesRouter } from './routes/employees';

export const app = new Hono();

// Middleware
app.use('*', logger());
app.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  })
);

// Mount routers
app.route('/', healthRouter);
app.route('/', projectsRouter);
app.route('/', odcRouter);
app.route('/', timesheetRouter);
app.route('/', auditRouter);
app.route('/', employeesRouter);

// Root greeting
app.get('/', (c) => {
  return c.json({
    message: 'SBI FPT Innovation Platform API',
    status: 'online',
    version: '1.0.0',
    documentation: '/health',
  });
});

const port = Number(process.env.PORT || 4100);

// Only listen with @hono/node-server when executed in Node runtime; Bun auto-serves default export
if (process.env.NODE_ENV !== 'test' && typeof Bun === 'undefined') {
  serve(
    {
      fetch: app.fetch,
      port,
    },
    (info) => {
      console.log(`🚀 SBI FPT API Server running on http://localhost:${info.port}`);
    }
  );
} else if (process.env.NODE_ENV !== 'test') {
  console.log(`🚀 SBI FPT API Server running on Bun on port ${port}`);
}

export default app;
