import type { FastifyInstance } from 'fastify';
import { authGuard } from '../../middleware/authGuard.js';
import { fail, ok } from '../../utils/response.js';
import {
  applyDeloadBodySchema,
  applyDeloadSchema,
  applyProgressionBodySchema,
  applyProgressionSchema,
  applyRoutineProgressionBodySchema,
  applyRoutineProgressionSchema,
  routineExerciseIdParamSchema,
  routineIdParamSchema,
} from './overload.schema.js';
import {
  applyProgressionToExercise,
  applyProgressionToRoutine,
  applyRoutineDeload,
  getProgressionRecommendationForExercise,
  getProgressionRecommendationsForRoutine,
  getUserRecoveryStatus,
  OverloadResourceNotFoundError,
  OverloadValidationError,
} from './overload.service.js';

export async function overloadRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authGuard);

  // 1. GET /overload/recommendations/:routineExerciseId
  app.get(
    '/overload/recommendations/:routineExerciseId',
    {
      schema: {
        tags: ['Progressive Overload & Recovery'],
        summary: 'Get progression recommendation for an exercise',
        description:
          'Evaluates recent set history, actual reps vs prescribed rep ranges, and exertion RPE to recommend next-session load, reps, and RPE.',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const paramParsed = routineExerciseIdParamSchema.safeParse(request.params);
      if (!paramParsed.success) {
        return reply
          .status(400)
          .send(fail('VALIDATION_ERROR', 'Invalid routine exercise ID', paramParsed.error.issues));
      }

      try {
        const recommendation = await getProgressionRecommendationForExercise(
          paramParsed.data.routineExerciseId,
          request.userId!,
        );
        return reply.status(200).send(ok(recommendation));
      } catch (err: unknown) {
        if (err instanceof OverloadResourceNotFoundError) {
          return reply.status(404).send(fail('RESOURCE_NOT_FOUND', err.message));
        }
        request.log.error(err, 'Failed to get exercise progression recommendation');
        return reply.status(500).send(fail('INTERNAL_SERVER_ERROR', 'Failed to calculate progression'));
      }
    },
  );

  // 2. GET /overload/routines/:routineId
  app.get(
    '/overload/routines/:routineId',
    {
      schema: {
        tags: ['Progressive Overload & Recovery'],
        summary: 'Get progression recommendations for an entire routine',
        description:
          'Generates progression targets across all exercises in a routine and includes systemic recovery & fatigue status.',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const paramParsed = routineIdParamSchema.safeParse(request.params);
      if (!paramParsed.success) {
        return reply
          .status(400)
          .send(fail('VALIDATION_ERROR', 'Invalid routine ID', paramParsed.error.issues));
      }

      try {
        const result = await getProgressionRecommendationsForRoutine(
          paramParsed.data.routineId,
          request.userId!,
        );
        return reply.status(200).send(ok(result));
      } catch (err: unknown) {
        if (err instanceof OverloadResourceNotFoundError) {
          return reply.status(404).send(fail('RESOURCE_NOT_FOUND', err.message));
        }
        request.log.error(err, 'Failed to get routine progression recommendations');
        return reply.status(500).send(fail('INTERNAL_SERVER_ERROR', 'Failed to calculate routine progression'));
      }
    },
  );

  // 3. POST /overload/apply/:routineExerciseId
  app.post(
    '/overload/apply/:routineExerciseId',
    {
      schema: {
        tags: ['Progressive Overload & Recovery'],
        summary: 'Apply progression to routine exercise',
        description:
          'Approves and saves new target weight, sets, reps, and RPE to the prescribed routine exercise.',
        security: [{ bearerAuth: [] }],
        body: applyProgressionBodySchema,
      },
    },
    async (request, reply) => {
      const paramParsed = routineExerciseIdParamSchema.safeParse(request.params);
      if (!paramParsed.success) {
        return reply
          .status(400)
          .send(fail('VALIDATION_ERROR', 'Invalid routine exercise ID', paramParsed.error.issues));
      }

      const bodyParsed = applyProgressionSchema.safeParse(request.body ?? {});
      if (!bodyParsed.success) {
        return reply
          .status(400)
          .send(fail('VALIDATION_ERROR', 'Invalid progression payload', bodyParsed.error.issues));
      }

      try {
        const result = await applyProgressionToExercise(
          paramParsed.data.routineExerciseId,
          request.userId!,
          bodyParsed.data,
        );
        return reply.status(200).send(ok(result));
      } catch (err: unknown) {
        if (err instanceof OverloadResourceNotFoundError) {
          return reply.status(404).send(fail('RESOURCE_NOT_FOUND', err.message));
        }
        if (err instanceof OverloadValidationError) {
          return reply.status(400).send(fail('VALIDATION_ERROR', err.message));
        }
        request.log.error(err, 'Failed to apply exercise progression');
        return reply.status(500).send(fail('INTERNAL_SERVER_ERROR', 'Failed to apply progression'));
      }
    },
  );

  // 4. POST /overload/routines/:routineId/apply
  app.post(
    '/overload/routines/:routineId/apply',
    {
      schema: {
        tags: ['Progressive Overload & Recovery'],
        summary: 'Batch apply progression to routine',
        description:
          'Batch updates all exercises in a scheduled routine with recommended double-progression targets, respecting optional manual overrides.',
        security: [{ bearerAuth: [] }],
        body: applyRoutineProgressionBodySchema,
      },
    },
    async (request, reply) => {
      const paramParsed = routineIdParamSchema.safeParse(request.params);
      if (!paramParsed.success) {
        return reply
          .status(400)
          .send(fail('VALIDATION_ERROR', 'Invalid routine ID', paramParsed.error.issues));
      }

      const bodyParsed = applyRoutineProgressionSchema.safeParse(request.body ?? {});
      if (!bodyParsed.success) {
        return reply
          .status(400)
          .send(fail('VALIDATION_ERROR', 'Invalid progression payload', bodyParsed.error.issues));
      }

      try {
        const result = await applyProgressionToRoutine(
          paramParsed.data.routineId,
          request.userId!,
          bodyParsed.data,
        );
        return reply.status(200).send(ok(result));
      } catch (err: unknown) {
        if (err instanceof OverloadResourceNotFoundError) {
          return reply.status(404).send(fail('RESOURCE_NOT_FOUND', err.message));
        }
        request.log.error(err, 'Failed to batch apply routine progression');
        return reply.status(500).send(fail('INTERNAL_SERVER_ERROR', 'Failed to apply routine progression'));
      }
    },
  );

  // 5. GET /recovery/status
  app.get(
    '/recovery/status',
    {
      schema: {
        tags: ['Progressive Overload & Recovery'],
        summary: 'Get lifter recovery and fatigue status',
        description:
          'Calculates systemic readiness score (0-100), joint soreness risk, average exertion, and determines whether an intensity or volume deload is needed.',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      try {
        const recovery = await getUserRecoveryStatus(request.userId!);
        return reply.status(200).send(ok(recovery));
      } catch (err: unknown) {
        request.log.error(err, 'Failed to get recovery status');
        return reply.status(500).send(fail('INTERNAL_SERVER_ERROR', 'Failed to calculate recovery'));
      }
    },
  );

  // 6. POST /recovery/deload/routine/:routineId
  app.post(
    '/recovery/deload/routine/:routineId',
    {
      schema: {
        tags: ['Progressive Overload & Recovery'],
        summary: 'Apply deload mesocycle to routine',
        description:
          'Reduces prescribed target load (default -10%) and set volume across all exercises in a routine to enable active physiological recovery.',
        security: [{ bearerAuth: [] }],
        body: applyDeloadBodySchema,
      },
    },
    async (request, reply) => {
      const paramParsed = routineIdParamSchema.safeParse(request.params);
      if (!paramParsed.success) {
        return reply
          .status(400)
          .send(fail('VALIDATION_ERROR', 'Invalid routine ID', paramParsed.error.issues));
      }

      const bodyParsed = applyDeloadSchema.safeParse(request.body ?? {});
      if (!bodyParsed.success) {
        return reply
          .status(400)
          .send(fail('VALIDATION_ERROR', 'Invalid deload parameters', bodyParsed.error.issues));
      }

      try {
        const result = await applyRoutineDeload(
          paramParsed.data.routineId,
          request.userId!,
          bodyParsed.data,
        );
        return reply.status(200).send(ok(result));
      } catch (err: unknown) {
        if (err instanceof OverloadResourceNotFoundError) {
          return reply.status(404).send(fail('RESOURCE_NOT_FOUND', err.message));
        }
        request.log.error(err, 'Failed to apply routine deload');
        return reply.status(500).send(fail('INTERNAL_SERVER_ERROR', 'Failed to apply deload'));
      }
    },
  );
}
