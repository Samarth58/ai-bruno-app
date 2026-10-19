import type { FastifyInstance } from 'fastify';
import { authGuard } from '../../middleware/authGuard.js';
import { fail, ok } from '../../utils/response.js';
import {
  cancelSessionBodySchema,
  cancelSessionSchema,
  finishSessionBodySchema,
  finishSessionSchema,
  hitPrescribedSessionBodySchema,
  hitPrescribedSessionSchema,
  listSessionsQuerySchema,
  logSetBodySchema,
  logSetSchema,
  sessionIdParamSchema,
  sessionSetParamsSchema,
  startSessionBodySchema,
  startSessionSchema,
  updateSetBodySchema,
  updateSetSchema,
} from './sessions.schema.js';
import {
  cancelWorkoutSession,
  deleteExerciseSet,
  finishWorkoutSession,
  getActiveWorkoutSession,
  getUserSessionById,
  hitPrescribedTargetsSession,
  listUserSessions,
  logExerciseSet,
  SessionConflictError,
  SessionResourceNotFoundError,
  SessionValidationError,
  startWorkoutSession,
  updateExerciseSet,
} from './sessions.service.js';

export async function sessionsRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authGuard);

  // 1. POST /sessions/start
  app.post(
    '/sessions/start',
    {
      schema: {
        tags: ['Workout Sessions'],
        summary: 'Start a workout session',
        description:
          'Initiates an in-progress workout session either attached to a scheduled routine or as an ad-hoc workout. Rejects if the lifter already has a session in progress.',
        security: [{ bearerAuth: [] }],
        body: startSessionBodySchema,
      },
    },
    async (request, reply) => {
      const parsed = startSessionSchema.safeParse(request.body ?? {});
      if (!parsed.success) {
        return reply
          .status(400)
          .send(fail('VALIDATION_ERROR', 'Invalid start session parameters', parsed.error.issues));
      }

      try {
        const session = await startWorkoutSession(request.userId!, parsed.data);
        return reply.status(201).send(ok(session));
      } catch (err: unknown) {
        if (err instanceof SessionConflictError) {
          return reply.status(409).send(fail('CONFLICT', err.message));
        }
        if (err instanceof SessionResourceNotFoundError) {
          return reply.status(404).send(fail('RESOURCE_NOT_FOUND', err.message));
        }
        if (err instanceof SessionValidationError) {
          return reply.status(400).send(fail('VALIDATION_ERROR', err.message));
        }
        request.log.error(err, 'Failed to start workout session');
        return reply.status(500).send(fail('INTERNAL_SERVER_ERROR', 'Failed to start session'));
      }
    },
  );

  // 2. GET /sessions/active
  app.get(
    '/sessions/active',
    {
      schema: {
        tags: ['Workout Sessions'],
        summary: 'Get current active session',
        description:
          'Retrieves the currently running workout session (status: in_progress) with logged sets and real-time metrics. Returns null data if no session is active.',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const active = await getActiveWorkoutSession(request.userId!);
      return reply.status(200).send(ok(active));
    },
  );

  // 3. POST /sessions/:sessionId/sets
  app.post(
    '/sessions/:sessionId/sets',
    {
      schema: {
        tags: ['Workout Sessions'],
        summary: 'Log an exercise set',
        description:
          'Records a completed or warmup set with weight in kg, completed reps, RPE, and target achievement against an active session.',
        security: [{ bearerAuth: [] }],
        body: logSetBodySchema,
      },
    },
    async (request, reply) => {
      const paramParsed = sessionIdParamSchema.safeParse(request.params);
      if (!paramParsed.success) {
        return reply
          .status(400)
          .send(fail('VALIDATION_ERROR', 'Invalid session ID', paramParsed.error.issues));
      }

      const bodyParsed = logSetSchema.safeParse(request.body);
      if (!bodyParsed.success) {
        return reply
          .status(400)
          .send(fail('VALIDATION_ERROR', 'Invalid set log parameters', bodyParsed.error.issues));
      }

      try {
        const logged = await logExerciseSet(
          paramParsed.data.sessionId,
          request.userId!,
          bodyParsed.data,
        );
        return reply.status(201).send(ok(logged));
      } catch (err: unknown) {
        if (err instanceof SessionResourceNotFoundError) {
          return reply.status(404).send(fail('RESOURCE_NOT_FOUND', err.message));
        }
        if (err instanceof SessionValidationError) {
          return reply.status(400).send(fail('VALIDATION_ERROR', err.message));
        }
        request.log.error(err, 'Failed to log exercise set');
        return reply.status(500).send(fail('INTERNAL_SERVER_ERROR', 'Failed to log set'));
      }
    },
  );

  // 4. PUT /sessions/:sessionId/sets/:setId
  app.put(
    '/sessions/:sessionId/sets/:setId',
    {
      schema: {
        tags: ['Workout Sessions'],
        summary: 'Update a recorded set',
        description:
          'Updates weight, reps, RPE, or warmup flag of a previously recorded set in an active workout session.',
        security: [{ bearerAuth: [] }],
        body: updateSetBodySchema,
      },
    },
    async (request, reply) => {
      const paramParsed = sessionSetParamsSchema.safeParse(request.params);
      if (!paramParsed.success) {
        return reply
          .status(400)
          .send(fail('VALIDATION_ERROR', 'Invalid parameters', paramParsed.error.issues));
      }

      const bodyParsed = updateSetSchema.safeParse(request.body);
      if (!bodyParsed.success) {
        return reply
          .status(400)
          .send(fail('VALIDATION_ERROR', 'Invalid set update parameters', bodyParsed.error.issues));
      }

      try {
        const updated = await updateExerciseSet(
          paramParsed.data.sessionId,
          paramParsed.data.setId,
          request.userId!,
          bodyParsed.data,
        );
        return reply.status(200).send(ok(updated));
      } catch (err: unknown) {
        if (err instanceof SessionResourceNotFoundError) {
          return reply.status(404).send(fail('RESOURCE_NOT_FOUND', err.message));
        }
        if (err instanceof SessionValidationError) {
          return reply.status(400).send(fail('VALIDATION_ERROR', err.message));
        }
        request.log.error(err, 'Failed to update set');
        return reply.status(500).send(fail('INTERNAL_SERVER_ERROR', 'Failed to update set'));
      }
    },
  );

  // 5. DELETE /sessions/:sessionId/sets/:setId
  app.delete(
    '/sessions/:sessionId/sets/:setId',
    {
      schema: {
        tags: ['Workout Sessions'],
        summary: 'Delete a recorded set',
        description:
          'Removes an incorrectly logged set from an active in-progress workout session.',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const paramParsed = sessionSetParamsSchema.safeParse(request.params);
      if (!paramParsed.success) {
        return reply
          .status(400)
          .send(fail('VALIDATION_ERROR', 'Invalid parameters', paramParsed.error.issues));
      }

      try {
        const deleted = await deleteExerciseSet(
          paramParsed.data.sessionId,
          paramParsed.data.setId,
          request.userId!,
        );
        if (!deleted) {
          return reply.status(404).send(fail('RESOURCE_NOT_FOUND', 'Set not found'));
        }
        return reply.status(200).send(ok({ success: true, message: 'Set deleted successfully' }));
      } catch (err: unknown) {
        if (err instanceof SessionResourceNotFoundError) {
          return reply.status(404).send(fail('RESOURCE_NOT_FOUND', err.message));
        }
        if (err instanceof SessionValidationError) {
          return reply.status(400).send(fail('VALIDATION_ERROR', err.message));
        }
        request.log.error(err, 'Failed to delete set');
        return reply.status(500).send(fail('INTERNAL_SERVER_ERROR', 'Failed to delete set'));
      }
    },
  );

  // 6. POST /sessions/:sessionId/finish
  app.post(
    '/sessions/:sessionId/finish',
    {
      schema: {
        tags: ['Workout Sessions'],
        summary: 'Finish a workout session',
        description:
          'Marks an active workout session as completed, computes duration and total volume, and records perceived RPE, joint soreness score, and cooldown reflections.',
        security: [{ bearerAuth: [] }],
        body: finishSessionBodySchema,
      },
    },
    async (request, reply) => {
      const paramParsed = sessionIdParamSchema.safeParse(request.params);
      if (!paramParsed.success) {
        return reply
          .status(400)
          .send(fail('VALIDATION_ERROR', 'Invalid session ID', paramParsed.error.issues));
      }

      const bodyParsed = finishSessionSchema.safeParse(request.body ?? {});
      if (!bodyParsed.success) {
        return reply
          .status(400)
          .send(fail('VALIDATION_ERROR', 'Invalid finish parameters', bodyParsed.error.issues));
      }

      try {
        const result = await finishWorkoutSession(
          paramParsed.data.sessionId,
          request.userId!,
          bodyParsed.data,
        );
        return reply.status(200).send(ok(result));
      } catch (err: unknown) {
        if (err instanceof SessionResourceNotFoundError) {
          return reply.status(404).send(fail('RESOURCE_NOT_FOUND', err.message));
        }
        if (err instanceof SessionValidationError) {
          return reply.status(400).send(fail('VALIDATION_ERROR', err.message));
        }
        request.log.error(err, 'Failed to finish session');
        return reply.status(500).send(fail('INTERNAL_SERVER_ERROR', 'Failed to finish session'));
      }
    },
  );

  // 7. POST /sessions/:sessionId/hit-prescribed
  app.post(
    '/sessions/:sessionId/hit-prescribed',
    {
      schema: {
        tags: ['Workout Sessions'],
        summary: 'One-tap finish session hitting all prescribed targets',
        description:
          'Automatically creates completed set logs for all prescribed exercises and sets in the scheduled routine using target weights and reps, marks the session completed, and computes duration and volume metrics.',
        security: [{ bearerAuth: [] }],
        body: hitPrescribedSessionBodySchema,
      },
    },
    async (request, reply) => {
      const paramParsed = sessionIdParamSchema.safeParse(request.params);
      if (!paramParsed.success) {
        return reply
          .status(400)
          .send(fail('VALIDATION_ERROR', 'Invalid session ID', paramParsed.error.issues));
      }

      const bodyParsed = hitPrescribedSessionSchema.safeParse(request.body ?? {});
      if (!bodyParsed.success) {
        return reply
          .status(400)
          .send(fail('VALIDATION_ERROR', 'Invalid hit-prescribed parameters', bodyParsed.error.issues));
      }

      try {
        const result = await hitPrescribedTargetsSession(
          paramParsed.data.sessionId,
          request.userId!,
          bodyParsed.data,
        );
        return reply.status(200).send(ok(result));
      } catch (err: unknown) {
        if (err instanceof SessionResourceNotFoundError) {
          return reply.status(404).send(fail('RESOURCE_NOT_FOUND', err.message));
        }
        if (err instanceof SessionValidationError) {
          return reply.status(400).send(fail('VALIDATION_ERROR', err.message));
        }
        if (err instanceof SessionConflictError) {
          return reply.status(409).send(fail('CONFLICT', err.message));
        }
        request.log.error(err, 'Failed to hit prescribed targets for session');
        return reply
          .status(500)
          .send(fail('INTERNAL_SERVER_ERROR', 'Failed to hit prescribed targets'));
      }
    },
  );

  // 8. POST /sessions/:sessionId/cancel
  app.post(
    '/sessions/:sessionId/cancel',
    {
      schema: {
        tags: ['Workout Sessions'],
        summary: 'Cancel an active workout session',
        description:
          'Abandons an in-progress workout session safely and marks its status as abandoned.',
        security: [{ bearerAuth: [] }],
        body: cancelSessionBodySchema,
      },
    },
    async (request, reply) => {
      const paramParsed = sessionIdParamSchema.safeParse(request.params);
      if (!paramParsed.success) {
        return reply
          .status(400)
          .send(fail('VALIDATION_ERROR', 'Invalid session ID', paramParsed.error.issues));
      }

      const bodyParsed = cancelSessionSchema.safeParse(request.body ?? {});
      if (!bodyParsed.success) {
        return reply
          .status(400)
          .send(fail('VALIDATION_ERROR', 'Invalid cancel parameters', bodyParsed.error.issues));
      }

      try {
        const cancelled = await cancelWorkoutSession(
          paramParsed.data.sessionId,
          request.userId!,
          bodyParsed.data,
        );
        return reply.status(200).send(ok({ session: cancelled, message: 'Session cancelled' }));
      } catch (err: unknown) {
        if (err instanceof SessionResourceNotFoundError) {
          return reply.status(404).send(fail('RESOURCE_NOT_FOUND', err.message));
        }
        if (err instanceof SessionValidationError) {
          return reply.status(400).send(fail('VALIDATION_ERROR', err.message));
        }
        request.log.error(err, 'Failed to cancel session');
        return reply.status(500).send(fail('INTERNAL_SERVER_ERROR', 'Failed to cancel session'));
      }
    },
  );

  // 9. GET /sessions
  app.get(
    '/sessions',
    {
      schema: {
        tags: ['Workout Sessions'],
        summary: 'List workout sessions history',
        description:
          'Returns paginated workout sessions history for the authenticated user, optionally filtered by status (in_progress, completed, abandoned).',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const parsed = listSessionsQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        return reply
          .status(400)
          .send(fail('VALIDATION_ERROR', 'Invalid query parameters', parsed.error.issues));
      }

      const result = await listUserSessions(request.userId!, parsed.data);
      return reply.status(200).send(ok(result.sessions, result.meta));
    },
  );

  // 10. GET /sessions/:sessionId
  app.get(
    '/sessions/:sessionId',
    {
      schema: {
        tags: ['Workout Sessions'],
        summary: 'Get session details by ID',
        description:
          'Retrieves a complete workout session with routine metadata, all recorded sets, and performance summary metrics.',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const paramParsed = sessionIdParamSchema.safeParse(request.params);
      if (!paramParsed.success) {
        return reply
          .status(400)
          .send(fail('VALIDATION_ERROR', 'Invalid session ID', paramParsed.error.issues));
      }

      try {
        const detail = await getUserSessionById(paramParsed.data.sessionId, request.userId!);
        return reply.status(200).send(ok(detail));
      } catch (err: unknown) {
        if (err instanceof SessionResourceNotFoundError) {
          return reply.status(404).send(fail('RESOURCE_NOT_FOUND', err.message));
        }
        request.log.error(err, 'Failed to get session details');
        return reply.status(500).send(fail('INTERNAL_SERVER_ERROR', 'Failed to get session details'));
      }
    },
  );
}
