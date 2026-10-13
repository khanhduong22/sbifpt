import { Hono } from 'hono';

export const healthRouter = new Hono();

healthRouter.get('/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'sbifpt-api',
    version: '1.0.0',
    timestamp: Date.now(),
    iso: new Date().toISOString(),
  });
});
