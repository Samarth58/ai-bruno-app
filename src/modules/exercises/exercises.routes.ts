import type { FastifyInstance } from 'fastify';
import { authGuard } from '../../middleware/authGuard.js';
import { fail, ok } from '../../utils/response.js';
import {
  idParamSchema,
  listExercisesQuerySchema,
} from './exercises.schema.js';
import {
  getExerciseDetails,
  listFilteredExercises,
} from './exercises.service.js';

export async function exercisesRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authGuard);

  // GET /exercises
  app.get(
    '/exercises',
    {
      schema: {
        tags: ['Exercises'],
        summary: 'List compatible strength exercises',
        description:
          'Retrieves exercises filtered algorithmically by user equipment profile and active physical constraints.',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const parsed = listExercisesQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        return reply
          .status(400)
          .send(fail('VALIDATION_ERROR', 'Invalid query parameters', parsed.error.issues));
      }

      const result = await listFilteredExercises(request.userId!, parsed.data);
      return reply.status(200).send(ok(result.exercises, result.meta));
    },
  );

  // GET /exercises/:id
  app.get(
    '/exercises/:id',
    {
      schema: {
        tags: ['Exercises'],
        summary: 'Get exercise details',
        description: 'Retrieves complete exercise metadata by unique ID.',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const paramParsed = idParamSchema.safeParse(request.params);
      if (!paramParsed.success) {
        return reply
          .status(400)
          .send(fail('VALIDATION_ERROR', 'Invalid exercise ID', paramParsed.error.issues));
      }

      const exercise = await getExerciseDetails(paramParsed.data.id);
      if (!exercise) {
        return reply
          .status(404)
          .send(fail('RESOURCE_NOT_FOUND', 'Exercise not found'));
      }

      return reply.status(200).send(ok(exercise));
    },
  );
}
