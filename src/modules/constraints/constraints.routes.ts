import type { FastifyInstance } from 'fastify';
import { authGuard } from '../../middleware/authGuard.js';
import { fail, ok } from '../../utils/response.js';
import {
  createConstraintSchema,
  idParamSchema,
  listConstraintsQuerySchema,
  updateConstraintSchema,
} from './constraints.schema.js';
import {
  createConstraint,
  deleteConstraint,
  getConstraintById,
  listConstraints,
  updateConstraint,
} from './constraints.service.js';

export async function constraintsRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authGuard);

  // POST /constraints
  app.post(
    '/constraints',
    {
      schema: {
        tags: ['Physical Constraints'],
        summary: 'Add physical constraint / injury flag',
        description: 'Records a movement limitation or joint pain area owned by the authenticated user.',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const parsed = createConstraintSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply
          .status(400)
          .send(fail('VALIDATION_ERROR', 'Invalid request body', parsed.error.issues));
      }

      const constraint = await createConstraint(request.userId!, parsed.data);
      return reply.status(201).send(ok(constraint));
    },
  );

  // GET /constraints
  app.get(
    '/constraints',
    {
      schema: {
        tags: ['Physical Constraints'],
        summary: 'List user physical constraints',
        description: 'Retrieves all physical restrictions and joint sensitivity flags for the authenticated user.',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const queryParsed = listConstraintsQuerySchema.safeParse(request.query);
      if (!queryParsed.success) {
        return reply
          .status(400)
          .send(fail('VALIDATION_ERROR', 'Invalid query parameters', queryParsed.error.issues));
      }

      const constraints = await listConstraints(
        request.userId!,
        queryParsed.data.isActive,
      );
      return reply.status(200).send(ok(constraints));
    },
  );

  // GET /constraints/:id
  app.get(
    '/constraints/:id',
    {
      schema: {
        tags: ['Physical Constraints'],
        summary: 'Get physical constraint by ID',
        description: 'Retrieves a single physical restriction record with user ownership protection.',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const paramParsed = idParamSchema.safeParse(request.params);
      if (!paramParsed.success) {
        return reply
          .status(400)
          .send(fail('VALIDATION_ERROR', 'Invalid constraint ID', paramParsed.error.issues));
      }

      const constraint = await getConstraintById(paramParsed.data.id, request.userId!);
      if (!constraint) {
        return reply
          .status(404)
          .send(fail('RESOURCE_NOT_FOUND', 'Physical constraint not found'));
      }

      return reply.status(200).send(ok(constraint));
    },
  );

  // PUT /constraints/:id
  app.put(
    '/constraints/:id',
    {
      schema: {
        tags: ['Physical Constraints'],
        summary: 'Update physical constraint',
        description: 'Updates a physical restriction record owned by the authenticated user.',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const paramParsed = idParamSchema.safeParse(request.params);
      if (!paramParsed.success) {
        return reply
          .status(400)
          .send(fail('VALIDATION_ERROR', 'Invalid constraint ID', paramParsed.error.issues));
      }

      const bodyParsed = updateConstraintSchema.safeParse(request.body);
      if (!bodyParsed.success) {
        return reply
          .status(400)
          .send(fail('VALIDATION_ERROR', 'Invalid update parameters', bodyParsed.error.issues));
      }

      const updated = await updateConstraint(
        paramParsed.data.id,
        request.userId!,
        bodyParsed.data,
      );

      if (!updated) {
        return reply
          .status(404)
          .send(fail('RESOURCE_NOT_FOUND', 'Physical constraint not found'));
      }

      return reply.status(200).send(ok(updated));
    },
  );

  // DELETE /constraints/:id
  app.delete(
    '/constraints/:id',
    {
      schema: {
        tags: ['Physical Constraints'],
        summary: 'Delete physical constraint',
        description: 'Soft-deletes a physical restriction record owned by the authenticated user.',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const paramParsed = idParamSchema.safeParse(request.params);
      if (!paramParsed.success) {
        return reply
          .status(400)
          .send(fail('VALIDATION_ERROR', 'Invalid constraint ID', paramParsed.error.issues));
      }

      const deleted = await deleteConstraint(paramParsed.data.id, request.userId!);
      if (!deleted) {
        return reply
          .status(404)
          .send(fail('RESOURCE_NOT_FOUND', 'Physical constraint not found'));
      }

      return reply
        .status(200)
        .send(ok({ success: true, message: 'Constraint deleted successfully' }));
    },
  );
}
