import type { FastifyInstance } from 'fastify';
import {
  AiError,
  AiProviderUnavailableError,
  AiRateLimitError,
  AiTimeoutError,
} from '../../ai/ai.types.js';
import { authGuard } from '../../middleware/authGuard.js';
import { fail, ok } from '../../utils/response.js';
import { coachChatBodySchema, coachChatRequestSchema } from './coach.schema.js';
import {
  CoachResourceNotFoundError,
  getMascotState,
  getPreSessionBriefing,
  getWeeklyReview,
  processCoachChat,
} from './coach.service.js';

export async function coachRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authGuard);

  // 1. POST /coach/chat
  app.post(
    '/coach/chat',
    {
      config: {
        rateLimit: {
          max: 30,
          timeWindow: 60000,
        },
      },
      schema: {
        tags: ['AI Coach'],
        summary: 'Chat with Bruno AI Coach',
        description:
          'Conversational AI fitness coaching endpoint providing personalized, context-aware advice grounded in user gym equipment and physical constraints.',
        security: [{ bearerAuth: [] }],
        body: coachChatBodySchema,
      },
    },
    async (request, reply) => {
      const parsed = coachChatRequestSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply
          .status(400)
          .send(fail('VALIDATION_ERROR', 'Invalid request body', parsed.error.issues));
      }

      try {
        const result = await processCoachChat(
          request.userId!,
          parsed.data.message,
          parsed.data.context,
        );

        return reply.status(200).send(ok(result.data, result.meta));
      } catch (err: unknown) {
        if (err instanceof CoachResourceNotFoundError) {
          return reply
            .status(404)
            .send(fail('RESOURCE_NOT_FOUND', err.message));
        }

        if (err instanceof AiProviderUnavailableError) {
          return reply
            .status(503)
            .send(fail('SERVICE_UNAVAILABLE', err.message));
        }

        if (err instanceof AiRateLimitError) {
          return reply
            .status(429)
            .send(fail('RATE_LIMIT_EXCEEDED', err.message));
        }

        if (err instanceof AiTimeoutError) {
          return reply
            .status(503)
            .send(fail('SERVICE_UNAVAILABLE', err.message));
        }

        if (err instanceof AiError) {
          request.log.warn(
            {
              provider: err.provider,
              model: err.model,
              upstreamStatus: err.upstreamStatus,
              errorCategory: err.category,
              code: err.code,
              statusCode: err.statusCode,
            },
            `AI Coach request failed with [${err.category}]`,
          );

          return reply
            .status(err.statusCode)
            .send(fail(err.code, err.message));
        }

        request.log.error(err, 'Unhandled error in coach chat handler');
        return reply
          .status(500)
          .send(fail('INTERNAL_SERVER_ERROR', 'Failed to generate coaching response', []));
      }
    },
  );

  // 2. GET /coach/briefing
  app.get(
    '/coach/briefing',
    {
      schema: {
        tags: ['AI Coach'],
        summary: 'Get pre-session coaching briefing',
        description:
          "Provides today's planned workout routine, previous-session performance, recovery readiness, and a tailored coaching tip.",
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      try {
        const briefing = await getPreSessionBriefing(request.userId!);
        return reply.status(200).send(ok(briefing));
      } catch (err: unknown) {
        request.log.error(err, 'Failed to generate pre-session briefing');
        return reply
          .status(500)
          .send(fail('INTERNAL_SERVER_ERROR', 'Failed to retrieve pre-session briefing'));
      }
    },
  );

  // 3. GET /coach/weekly-review
  app.get(
    '/coach/weekly-review',
    {
      schema: {
        tags: ['AI Coach'],
        summary: 'Get weekly coaching review and consistency verdict',
        description:
          "Summarizes the current calendar week's completed workouts, working sets, total tonnage, and adherence verdict.",
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      try {
        const review = await getWeeklyReview(request.userId!);
        return reply.status(200).send(ok(review));
      } catch (err: unknown) {
        request.log.error(err, 'Failed to generate weekly review');
        return reply
          .status(500)
          .send(fail('INTERNAL_SERVER_ERROR', 'Failed to retrieve weekly review'));
      }
    },
  );

  // 4. GET /coach/mascot-state
  app.get(
    '/coach/mascot-state',
    {
      schema: {
        tags: ['AI Coach'],
        summary: 'Get mascot visual animation state',
        description:
          "Returns Bruno's mascot visual state (approving_nod, studying_journal, waiting_with_watch) based on real user adherence and systemic recovery.",
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      try {
        const mascot = await getMascotState(request.userId!);
        return reply.status(200).send(ok(mascot));
      } catch (err: unknown) {
        request.log.error(err, 'Failed to determine mascot state');
        return reply
          .status(500)
          .send(fail('INTERNAL_SERVER_ERROR', 'Failed to determine mascot state'));
      }
    },
  );
}
