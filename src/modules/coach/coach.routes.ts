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
  processCoachChat,
} from './coach.service.js';

export async function coachRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authGuard);

  // POST /coach/chat
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
}
