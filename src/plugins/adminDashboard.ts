import fastifyStatic from '@fastify/static';
import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const adminDashboardPlugin: FastifyPluginAsync = async (app: FastifyInstance) => {
  // Resolve dashboard directory across both development (src/plugins)
  // and compiled production runner (dist/plugins or /app/dashboard)
  const candidatePaths = [
    path.resolve(process.cwd(), 'dashboard'),
    path.resolve(__dirname, '../../dashboard'),
    path.resolve(__dirname, '../dashboard'),
  ];

  const dashboardRoot = candidatePaths.find((dir) => fs.existsSync(dir));

  if (!dashboardRoot) {
    app.log.warn('[adminDashboard] Warning: dashboard/ directory not found, static admin UI skipped');
    return;
  }

  // Gracefully redirect unslashed /admin to /admin/
  app.get('/admin', { schema: { hide: true } }, async (_request, reply) => {
    return reply.redirect('/admin/', 302);
  });

  // Mount claymorphism dashboard under /admin/
  await app.register(fastifyStatic, {
    root: dashboardRoot,
    prefix: '/admin/',
    decorateReply: false,
    index: ['index.html'],
    cacheControl: true,
    maxAge: '1d',
  });

  app.log.info({ dashboardRoot }, '[adminDashboard] Mounted admin dashboard at /admin/');
};

export const registerAdminDashboard = fp(adminDashboardPlugin, {
  name: 'admin-dashboard',
});
