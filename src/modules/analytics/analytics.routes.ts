import type { FastifyInstance } from 'fastify';
import { authGuard } from '../../middleware/authGuard.js';
import { fail, ok } from '../../utils/response.js';
import {
  consistencyQuerySchema,
  estimated1rmQuerySchema,
  exerciseIdParamSchema,
  volumeByMuscleQuerySchema,
} from './analytics.schema.js';
import {
  AnalyticsResourceNotFoundError,
  AnalyticsValidationError,
  getEstimated1rmTrend,
  getLifterOverview,
  getMobileProgressSummary,
  getTrainingConsistency,
  getVolumeByMuscleAnalytics,
} from './analytics.service.js';

export async function analyticsRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authGuard);

  // 1. GET /analytics/overview
  app.get(
    '/analytics/overview',
    {
      schema: {
        tags: ['Lifter Analytics'],
        summary: 'Lifter training overview',
        description:
          'Returns high-level statistics: total completed sessions, current-week workout count, active program, total volume/reps, and recent session logs.',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      try {
        const overview = await getLifterOverview(request.userId!);
        return reply.status(200).send(ok(overview));
      } catch (err: unknown) {
        request.log.error(err, 'Failed to get analytics overview');
        return reply.status(500).send(fail('INTERNAL_SERVER_ERROR', 'Failed to retrieve overview'));
      }
    },
  );

  // 2. GET /analytics/volume-by-muscle
  app.get(
    '/analytics/volume-by-muscle',
    {
      schema: {
        tags: ['Lifter Analytics'],
        summary: 'Working set volume by muscle group',
        description:
          'Aggregates completed working-set volume (kg) and set counts grouped by primary muscle group over a date range. Warm-up sets are strictly excluded.',
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            startDate: {
              type: 'string',
              format: 'date-time',
              description: 'Optional range start (defaults to 30 days ago)',
            },
            endDate: {
              type: 'string',
              format: 'date-time',
              description: 'Optional range end (defaults to current time)',
            },
          },
        },
      },
    },
    async (request, reply) => {
      const parsed = volumeByMuscleQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        return reply
          .status(400)
          .send(fail('VALIDATION_ERROR', 'Invalid date range parameters', parsed.error.issues));
      }

      try {
        const data = await getVolumeByMuscleAnalytics(request.userId!, parsed.data);
        return reply.status(200).send(ok(data));
      } catch (err: unknown) {
        if (err instanceof AnalyticsValidationError) {
          return reply.status(400).send(fail('VALIDATION_ERROR', err.message));
        }
        request.log.error(err, 'Failed to get volume by muscle analytics');
        return reply.status(500).send(fail('INTERNAL_SERVER_ERROR', 'Failed to retrieve volume analytics'));
      }
    },
  );

  // 3. GET /analytics/estimated-1rm/:exerciseId
  app.get(
    '/analytics/estimated-1rm/:exerciseId',
    {
      schema: {
        tags: ['Lifter Analytics'],
        summary: 'Estimated 1RM progression curve',
        description:
          'Calculates estimated 1-Rep Maximum values across historical working sets using evidence-based Epley or Brzycki formulas. Values are explicitly labeled as algorithmic estimations.',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['exerciseId'],
          properties: {
            exerciseId: {
              type: 'string',
              format: 'uuid',
              description: 'Target exercise UUID from catalogue',
            },
          },
        },
        querystring: {
          type: 'object',
          properties: {
            formula: {
              type: 'string',
              enum: ['epley', 'brzycki'],
              default: 'epley',
              description: 'Formula used to estimate 1RM from submaximal sets',
            },
            limit: {
              type: 'integer',
              minimum: 1,
              maximum: 200,
              default: 50,
              description: 'Maximum data points to return',
            },
          },
        },
      },
    },
    async (request, reply) => {
      const paramParsed = exerciseIdParamSchema.safeParse(request.params);
      if (!paramParsed.success) {
        return reply
          .status(400)
          .send(fail('VALIDATION_ERROR', 'Invalid exercise ID format', paramParsed.error.issues));
      }

      const queryParsed = estimated1rmQuerySchema.safeParse(request.query);
      if (!queryParsed.success) {
        return reply
          .status(400)
          .send(fail('VALIDATION_ERROR', 'Invalid query parameters', queryParsed.error.issues));
      }

      try {
        const data = await getEstimated1rmTrend(
          request.userId!,
          paramParsed.data.exerciseId,
          queryParsed.data,
        );
        return reply.status(200).send(ok(data));
      } catch (err: unknown) {
        if (err instanceof AnalyticsResourceNotFoundError) {
          return reply.status(404).send(fail('RESOURCE_NOT_FOUND', err.message));
        }
        request.log.error(err, 'Failed to calculate estimated 1RM trend');
        return reply.status(500).send(fail('INTERNAL_SERVER_ERROR', 'Failed to retrieve 1RM trend'));
      }
    },
  );

  // 4. GET /analytics/consistency
  app.get(
    '/analytics/consistency',
    {
      schema: {
        tags: ['Lifter Analytics'],
        summary: 'Training frequency & active weekly streaks',
        description:
          'Calculates weekly workout compliance and consecutive training-week streaks over a configurable window (4 to 52 weeks).',
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            weeks: {
              type: 'integer',
              minimum: 4,
              maximum: 52,
              default: 8,
              description: 'Number of past calendar weeks to analyze',
            },
          },
        },
      },
    },
    async (request, reply) => {
      const parsed = consistencyQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        return reply
          .status(400)
          .send(fail('VALIDATION_ERROR', 'Invalid query parameters', parsed.error.issues));
      }

      try {
        const data = await getTrainingConsistency(request.userId!, parsed.data);
        return reply.status(200).send(ok(data));
      } catch (err: unknown) {
        request.log.error(err, 'Failed to get training consistency');
        return reply.status(500).send(fail('INTERNAL_SERVER_ERROR', 'Failed to retrieve consistency metrics'));
      }
    },
  );

  // 5. GET /analytics/progress
  app.get(
    '/analytics/progress',
    {
      schema: {
        tags: ['Lifter Analytics'],
        summary: 'Unified mobile progress dashboard',
        description:
          'Returns a single compact payload combining volume trends (week-over-week delta), active training streaks, muscle distribution, and systemic recovery status from Phase 5.',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      try {
        const progress = await getMobileProgressSummary(request.userId!);
        return reply.status(200).send(ok(progress));
      } catch (err: unknown) {
        request.log.error(err, 'Failed to get mobile progress summary');
        return reply.status(500).send(fail('INTERNAL_SERVER_ERROR', 'Failed to retrieve progress dashboard'));
      }
    },
  );
}
