import type { FastifyInstance } from 'fastify';
import { authGuard } from '../../middleware/authGuard.js';
import { fail, ok } from '../../utils/response.js';
import {
  createGymProfileSchema,
  idParamSchema,
  updateGymProfileSchema,
} from './gymProfiles.schema.js';
import {
  createGymProfile,
  deleteGymProfile,
  getGymProfileById,
  listGymProfiles,
  updateGymProfile,
} from './gymProfiles.service.js';

export async function gymProfilesRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authGuard);

  // POST /gym-profiles
  app.post(
    '/gym-profiles',
    {
      schema: {
        tags: ['Gym Profiles'],
        summary: 'Create gym hardware profile',
        description: 'Creates a new gym equipment profile owned by the authenticated user.',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const parsed = createGymProfileSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply
          .status(400)
          .send(fail('VALIDATION_ERROR', 'Invalid request body', parsed.error.issues));
      }

      const profile = await createGymProfile(request.userId!, parsed.data);
      return reply.status(201).send(ok(profile));
    },
  );

  // GET /gym-profiles
  app.get(
    '/gym-profiles',
    {
      schema: {
        tags: ['Gym Profiles'],
        summary: 'List user gym profiles',
        description: 'Retrieves all active gym hardware profiles for the authenticated user.',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const profiles = await listGymProfiles(request.userId!);
      return reply.status(200).send(ok(profiles));
    },
  );

  // GET /gym-profiles/:id
  app.get(
    '/gym-profiles/:id',
    {
      schema: {
        tags: ['Gym Profiles'],
        summary: 'Get gym profile by ID',
        description: 'Retrieves a single gym equipment profile with strict user ownership enforcement.',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const paramParsed = idParamSchema.safeParse(request.params);
      if (!paramParsed.success) {
        return reply
          .status(400)
          .send(fail('VALIDATION_ERROR', 'Invalid profile ID', paramParsed.error.issues));
      }

      const profile = await getGymProfileById(paramParsed.data.id, request.userId!);
      if (!profile) {
        return reply
          .status(404)
          .send(fail('RESOURCE_NOT_FOUND', 'Gym profile not found'));
      }

      return reply.status(200).send(ok(profile));
    },
  );

  // PUT /gym-profiles/:id
  app.put(
    '/gym-profiles/:id',
    {
      schema: {
        tags: ['Gym Profiles'],
        summary: 'Update gym profile',
        description: 'Updates a gym equipment profile owned by the authenticated user.',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const paramParsed = idParamSchema.safeParse(request.params);
      if (!paramParsed.success) {
        return reply
          .status(400)
          .send(fail('VALIDATION_ERROR', 'Invalid profile ID', paramParsed.error.issues));
      }

      const bodyParsed = updateGymProfileSchema.safeParse(request.body);
      if (!bodyParsed.success) {
        return reply
          .status(400)
          .send(fail('VALIDATION_ERROR', 'Invalid update parameters', bodyParsed.error.issues));
      }

      const updated = await updateGymProfile(
        paramParsed.data.id,
        request.userId!,
        bodyParsed.data,
      );

      if (!updated) {
        return reply
          .status(404)
          .send(fail('RESOURCE_NOT_FOUND', 'Gym profile not found'));
      }

      return reply.status(200).send(ok(updated));
    },
  );

  // DELETE /gym-profiles/:id
  app.delete(
    '/gym-profiles/:id',
    {
      schema: {
        tags: ['Gym Profiles'],
        summary: 'Delete gym profile',
        description: 'Soft-deletes a gym equipment profile owned by the authenticated user.',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const paramParsed = idParamSchema.safeParse(request.params);
      if (!paramParsed.success) {
        return reply
          .status(400)
          .send(fail('VALIDATION_ERROR', 'Invalid profile ID', paramParsed.error.issues));
      }

      const deleted = await deleteGymProfile(paramParsed.data.id, request.userId!);
      if (!deleted) {
        return reply
          .status(404)
          .send(fail('RESOURCE_NOT_FOUND', 'Gym profile not found'));
      }

      return reply
        .status(200)
        .send(ok({ success: true, message: 'Gym profile deleted successfully' }));
    },
  );
}
