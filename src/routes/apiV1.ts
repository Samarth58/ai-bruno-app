import type { FastifyInstance } from 'fastify';
import { adminRoutes } from './admin.js';
import { authRoutes } from './auth.js';
import { usersRoutes } from './users.js';
import { exampleRoutes } from '../modules/example/index.js';
import { categoriesRoutes } from '../modules/categories/index.js';
import { gymProfilesRoutes } from '../modules/gymProfiles/index.js';
import { constraintsRoutes } from '../modules/constraints/index.js';
import { exercisesRoutes } from '../modules/exercises/index.js';

/**
 * Aggregates all v1 API domain routes.
 * Mounted under `/api/v1` prefix and at root for backward compatibility.
 */
export async function apiV1Routes(app: FastifyInstance): Promise<void> {
  await app.register(authRoutes);
  await app.register(usersRoutes);
  await app.register(adminRoutes);
  await app.register(exampleRoutes);
  await app.register(categoriesRoutes);
  await app.register(gymProfilesRoutes);
  await app.register(constraintsRoutes);
  await app.register(exercisesRoutes);
}
