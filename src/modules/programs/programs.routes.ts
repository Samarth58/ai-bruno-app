import type { FastifyInstance } from 'fastify';
import { authGuard } from '../../middleware/authGuard.js';
import { fail, ok } from '../../utils/response.js';
import {
  createProgramBodySchema,
  createProgramSchema,
  createRoutineBodySchema,
  createRoutineExerciseBodySchema,
  createRoutineExerciseSchema,
  createRoutineSchema,
  generateProgramBodySchema,
  generateProgramSchema,
  programIdParamSchema,
  programRoutineParamsSchema,
  routineExerciseParamsSchema,
  routineIdParamSchema,
  swapRoutineExerciseBodySchema,
  swapRoutineExerciseSchema,
  updateProgramBodySchema,
  updateProgramSchema,
  updateRoutineExerciseSchema,
  updateRoutineSchema,
} from './programs.schema.js';
import {
  activateUserProgram,
  addExerciseToRoutine,
  addRoutineToProgram,
  createCustomProgram,
  deleteRoutine,
  deleteRoutineExercise,
  deleteUserProgram,
  generatePersonalizedProgram,
  getUserProgramById,
  listUserPrograms,
  ProgramResourceNotFoundError,
  ProgramValidationError,
  swapRoutineExercise,
  updateRoutine,
  updateRoutineExercise,
  updateUserProgram,
} from './programs.service.js';

export async function programsRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authGuard);

  // 1. POST /programs/generate
  app.post(
    '/programs/generate',
    {
      schema: {
        tags: ['Workout Programs'],
        summary: 'Generate personalized workout program',
        description:
          'Synthesizes a personalized periodized program with routines and prescribed exercises, strictly grounded in the user gym equipment and physical injury constraints.',
        security: [{ bearerAuth: [] }],
        body: generateProgramBodySchema,
      },
    },
    async (request, reply) => {
      const parsed = generateProgramSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply
          .status(400)
          .send(fail('VALIDATION_ERROR', 'Invalid generation parameters', parsed.error.issues));
      }

      try {
        const program = await generatePersonalizedProgram(request.userId!, parsed.data);
        return reply.status(201).send(ok(program));
      } catch (err: unknown) {
        if (err instanceof ProgramResourceNotFoundError) {
          return reply.status(404).send(fail('RESOURCE_NOT_FOUND', err.message));
        }
        if (err instanceof ProgramValidationError || (err instanceof Error && err.message.includes('No compatible exercises'))) {
          return reply.status(400).send(fail('VALIDATION_ERROR', err instanceof Error ? err.message : String(err)));
        }
        request.log.error(err, 'Failed to generate workout program');
        return reply.status(500).send(fail('INTERNAL_SERVER_ERROR', 'Failed to generate program'));
      }
    },
  );

  // 2. POST /programs
  app.post(
    '/programs',
    {
      schema: {
        tags: ['Workout Programs'],
        summary: 'Create custom workout program',
        description: 'Creates a custom program header owned by the authenticated lifter.',
        security: [{ bearerAuth: [] }],
        body: createProgramBodySchema,
      },
    },
    async (request, reply) => {
      const parsed = createProgramSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply
          .status(400)
          .send(fail('VALIDATION_ERROR', 'Invalid program payload', parsed.error.issues));
      }

      try {
        const created = await createCustomProgram(request.userId!, parsed.data);
        return reply.status(201).send(ok(created));
      } catch (err: unknown) {
        if (err instanceof ProgramResourceNotFoundError) {
          return reply.status(404).send(fail('RESOURCE_NOT_FOUND', err.message));
        }
        request.log.error(err, 'Failed to create custom program');
        return reply.status(500).send(fail('INTERNAL_SERVER_ERROR', 'Failed to create program'));
      }
    },
  );

  // 3. GET /programs
  app.get(
    '/programs',
    {
      schema: {
        tags: ['Workout Programs'],
        summary: 'List user workout programs',
        description: 'Retrieves all non-deleted workout programs owned by the authenticated lifter.',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const query = request.query as { isActive?: string };
      let isActiveFilter: boolean | undefined = undefined;
      if (query.isActive !== undefined) {
        isActiveFilter = query.isActive === 'true' || query.isActive === '1';
      }

      const list = await listUserPrograms(request.userId!, isActiveFilter);
      return reply.status(200).send(ok(list));
    },
  );

  // 4. GET /programs/:id
  app.get(
    '/programs/:id',
    {
      schema: {
        tags: ['Workout Programs'],
        summary: 'Get program details by ID',
        description: 'Retrieves program metadata, all scheduled training routines, and prescribed exercises.',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const paramParsed = programIdParamSchema.safeParse(request.params);
      if (!paramParsed.success) {
        return reply
          .status(400)
          .send(fail('VALIDATION_ERROR', 'Invalid program ID', paramParsed.error.issues));
      }

      const program = await getUserProgramById(paramParsed.data.id, request.userId!);
      if (!program) {
        return reply.status(404).send(fail('RESOURCE_NOT_FOUND', 'Workout program not found'));
      }

      return reply.status(200).send(ok(program));
    },
  );

  // 5. PUT /programs/:id
  app.put(
    '/programs/:id',
    {
      schema: {
        tags: ['Workout Programs'],
        summary: 'Update workout program',
        description: 'Updates configuration, duration, or active status for a program owned by the user.',
        security: [{ bearerAuth: [] }],
        body: updateProgramBodySchema,
      },
    },
    async (request, reply) => {
      const paramParsed = programIdParamSchema.safeParse(request.params);
      if (!paramParsed.success) {
        return reply
          .status(400)
          .send(fail('VALIDATION_ERROR', 'Invalid program ID', paramParsed.error.issues));
      }

      const bodyParsed = updateProgramSchema.safeParse(request.body);
      if (!bodyParsed.success) {
        return reply
          .status(400)
          .send(fail('VALIDATION_ERROR', 'Invalid update parameters', bodyParsed.error.issues));
      }

      try {
        const updated = await updateUserProgram(
          paramParsed.data.id,
          request.userId!,
          bodyParsed.data,
        );

        if (!updated) {
          return reply.status(404).send(fail('RESOURCE_NOT_FOUND', 'Workout program not found'));
        }

        return reply.status(200).send(ok(updated));
      } catch (err: unknown) {
        if (err instanceof ProgramResourceNotFoundError) {
          return reply.status(404).send(fail('RESOURCE_NOT_FOUND', err.message));
        }
        request.log.error(err, 'Failed to update program');
        return reply.status(500).send(fail('INTERNAL_SERVER_ERROR', 'Failed to update program'));
      }
    },
  );

  // 6. DELETE /programs/:id
  app.delete(
    '/programs/:id',
    {
      schema: {
        tags: ['Workout Programs'],
        summary: 'Delete workout program',
        description: 'Soft-deletes a workout program owned by the user.',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const paramParsed = programIdParamSchema.safeParse(request.params);
      if (!paramParsed.success) {
        return reply
          .status(400)
          .send(fail('VALIDATION_ERROR', 'Invalid program ID', paramParsed.error.issues));
      }

      const deleted = await deleteUserProgram(paramParsed.data.id, request.userId!);
      if (!deleted) {
        return reply.status(404).send(fail('RESOURCE_NOT_FOUND', 'Workout program not found'));
      }

      return reply.status(200).send(ok({ success: true, message: 'Program deleted successfully' }));
    },
  );

  // 7. PATCH /programs/:id/activate
  app.patch(
    '/programs/:id/activate',
    {
      schema: {
        tags: ['Workout Programs'],
        summary: 'Set program as primary active program',
        description: 'Activates the specified program and deactivates other user programs.',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const paramParsed = programIdParamSchema.safeParse(request.params);
      if (!paramParsed.success) {
        return reply
          .status(400)
          .send(fail('VALIDATION_ERROR', 'Invalid program ID', paramParsed.error.issues));
      }

      const activated = await activateUserProgram(paramParsed.data.id, request.userId!);
      if (!activated) {
        return reply.status(404).send(fail('RESOURCE_NOT_FOUND', 'Workout program not found'));
      }

      return reply.status(200).send(ok(activated));
    },
  );

  // 8. POST /programs/:programId/routines
  app.post(
    '/programs/:programId/routines',
    {
      schema: {
        tags: ['Workout Programs'],
        summary: 'Add routine to program',
        description: 'Creates a new training routine (e.g. Day 1: Push) inside the specified program.',
        security: [{ bearerAuth: [] }],
        body: createRoutineBodySchema,
      },
    },
    async (request, reply) => {
      const params = request.params as { programId?: string };
      const paramParsed = programIdParamSchema.safeParse({ id: params.programId });
      if (!paramParsed.success) {
        return reply.status(400).send(fail('VALIDATION_ERROR', 'Invalid program ID'));
      }

      const bodyParsed = createRoutineSchema.safeParse(request.body);
      if (!bodyParsed.success) {
        return reply
          .status(400)
          .send(fail('VALIDATION_ERROR', 'Invalid routine payload', bodyParsed.error.issues));
      }

      try {
        const created = await addRoutineToProgram(
          paramParsed.data.id,
          request.userId!,
          bodyParsed.data,
        );
        return reply.status(201).send(ok(created));
      } catch (err: unknown) {
        if (err instanceof ProgramResourceNotFoundError) {
          return reply.status(404).send(fail('RESOURCE_NOT_FOUND', err.message));
        }
        request.log.error(err, 'Failed to add routine to program');
        return reply.status(500).send(fail('INTERNAL_SERVER_ERROR', 'Failed to add routine'));
      }
    },
  );

  // 9. PUT /programs/:programId/routines/:id
  app.put(
    '/programs/:programId/routines/:id',
    {
      schema: {
        tags: ['Workout Programs'],
        summary: 'Update routine',
        description: 'Updates a training routine inside a program owned by the user.',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const paramParsed = programRoutineParamsSchema.safeParse(request.params);
      if (!paramParsed.success) {
        return reply.status(400).send(fail('VALIDATION_ERROR', 'Invalid parameters', paramParsed.error.issues));
      }

      const bodyParsed = updateRoutineSchema.safeParse(request.body);
      if (!bodyParsed.success) {
        return reply.status(400).send(fail('VALIDATION_ERROR', 'Invalid update parameters', bodyParsed.error.issues));
      }

      try {
        const updated = await updateRoutine(
          paramParsed.data.programId,
          paramParsed.data.id,
          request.userId!,
          bodyParsed.data,
        );
        return reply.status(200).send(ok(updated));
      } catch (err: unknown) {
        if (err instanceof ProgramResourceNotFoundError) {
          return reply.status(404).send(fail('RESOURCE_NOT_FOUND', err.message));
        }
        request.log.error(err, 'Failed to update routine');
        return reply.status(500).send(fail('INTERNAL_SERVER_ERROR', 'Failed to update routine'));
      }
    },
  );

  // 10. DELETE /programs/:programId/routines/:id
  app.delete(
    '/programs/:programId/routines/:id',
    {
      schema: {
        tags: ['Workout Programs'],
        summary: 'Delete routine from program',
        description: 'Soft-deletes a routine from a program owned by the user.',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const paramParsed = programRoutineParamsSchema.safeParse(request.params);
      if (!paramParsed.success) {
        return reply.status(400).send(fail('VALIDATION_ERROR', 'Invalid parameters', paramParsed.error.issues));
      }

      try {
        const deleted = await deleteRoutine(
          paramParsed.data.programId,
          paramParsed.data.id,
          request.userId!,
        );
        if (!deleted) {
          return reply.status(404).send(fail('RESOURCE_NOT_FOUND', 'Routine not found'));
        }
        return reply.status(200).send(ok({ success: true, message: 'Routine deleted successfully' }));
      } catch (err: unknown) {
        if (err instanceof ProgramResourceNotFoundError) {
          return reply.status(404).send(fail('RESOURCE_NOT_FOUND', err.message));
        }
        request.log.error(err, 'Failed to delete routine');
        return reply.status(500).send(fail('INTERNAL_SERVER_ERROR', 'Failed to delete routine'));
      }
    },
  );

  // 11. POST /routines/:routineId/exercises
  app.post(
    '/routines/:routineId/exercises',
    {
      schema: {
        tags: ['Workout Programs'],
        summary: 'Add prescribed exercise to routine',
        description: 'Appends an exercise with target sets, rep ranges, target weight, RPE, and rest seconds.',
        security: [{ bearerAuth: [] }],
        body: createRoutineExerciseBodySchema,
      },
    },
    async (request, reply) => {
      const paramParsed = routineIdParamSchema.safeParse(request.params);
      if (!paramParsed.success) {
        return reply.status(400).send(fail('VALIDATION_ERROR', 'Invalid routine ID', paramParsed.error.issues));
      }

      const bodyParsed = createRoutineExerciseSchema.safeParse(request.body);
      if (!bodyParsed.success) {
        return reply.status(400).send(fail('VALIDATION_ERROR', 'Invalid exercise payload', bodyParsed.error.issues));
      }

      try {
        const created = await addExerciseToRoutine(
          paramParsed.data.routineId,
          request.userId!,
          bodyParsed.data,
        );
        return reply.status(201).send(ok(created));
      } catch (err: unknown) {
        if (err instanceof ProgramResourceNotFoundError) {
          return reply.status(404).send(fail('RESOURCE_NOT_FOUND', err.message));
        }
        request.log.error(err, 'Failed to add exercise to routine');
        return reply.status(500).send(fail('INTERNAL_SERVER_ERROR', 'Failed to add exercise'));
      }
    },
  );

  // 12. PUT /routines/:routineId/exercises/:id
  app.put(
    '/routines/:routineId/exercises/:id',
    {
      schema: {
        tags: ['Workout Programs'],
        summary: 'Update prescribed exercise parameters',
        description: 'Updates sets, reps, weight, RPE, rest seconds, or notes for a routine exercise.',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const paramParsed = routineExerciseParamsSchema.safeParse(request.params);
      if (!paramParsed.success) {
        return reply.status(400).send(fail('VALIDATION_ERROR', 'Invalid parameters', paramParsed.error.issues));
      }

      const bodyParsed = updateRoutineExerciseSchema.safeParse(request.body);
      if (!bodyParsed.success) {
        return reply.status(400).send(fail('VALIDATION_ERROR', 'Invalid update parameters', bodyParsed.error.issues));
      }

      try {
        const updated = await updateRoutineExercise(
          paramParsed.data.routineId,
          paramParsed.data.id,
          request.userId!,
          bodyParsed.data,
        );
        return reply.status(200).send(ok(updated));
      } catch (err: unknown) {
        if (err instanceof ProgramResourceNotFoundError) {
          return reply.status(404).send(fail('RESOURCE_NOT_FOUND', err.message));
        }
        request.log.error(err, 'Failed to update routine exercise');
        return reply.status(500).send(fail('INTERNAL_SERVER_ERROR', 'Failed to update exercise'));
      }
    },
  );

  // 13. DELETE /routines/:routineId/exercises/:id
  app.delete(
    '/routines/:routineId/exercises/:id',
    {
      schema: {
        tags: ['Workout Programs'],
        summary: 'Remove exercise from routine',
        description: 'Removes a prescribed exercise from a routine owned by the user.',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const paramParsed = routineExerciseParamsSchema.safeParse(request.params);
      if (!paramParsed.success) {
        return reply.status(400).send(fail('VALIDATION_ERROR', 'Invalid parameters', paramParsed.error.issues));
      }

      try {
        const deleted = await deleteRoutineExercise(
          paramParsed.data.routineId,
          paramParsed.data.id,
          request.userId!,
        );
        if (!deleted) {
          return reply.status(404).send(fail('RESOURCE_NOT_FOUND', 'Prescribed exercise not found'));
        }
        return reply.status(200).send(ok({ success: true, message: 'Exercise removed from routine' }));
      } catch (err: unknown) {
        if (err instanceof ProgramResourceNotFoundError) {
          return reply.status(404).send(fail('RESOURCE_NOT_FOUND', err.message));
        }
        request.log.error(err, 'Failed to delete routine exercise');
        return reply.status(500).send(fail('INTERNAL_SERVER_ERROR', 'Failed to remove exercise'));
      }
    },
  );

  // 14. POST /routines/:routineId/exercises/:id/swap
  app.post(
    '/routines/:routineId/exercises/:id/swap',
    {
      schema: {
        tags: ['Workout Programs'],
        summary: 'Smart swap routine exercise',
        description:
          'Safely swaps a prescribed exercise with an alternative, checking that the replacement matches available gym equipment and does not violate user physical injury constraints.',
        security: [{ bearerAuth: [] }],
        body: swapRoutineExerciseBodySchema,
      },
    },
    async (request, reply) => {
      const paramParsed = routineExerciseParamsSchema.safeParse(request.params);
      if (!paramParsed.success) {
        return reply.status(400).send(fail('VALIDATION_ERROR', 'Invalid parameters', paramParsed.error.issues));
      }

      const bodyParsed = swapRoutineExerciseSchema.safeParse(request.body);
      if (!bodyParsed.success) {
        return reply.status(400).send(fail('VALIDATION_ERROR', 'Invalid swap payload', bodyParsed.error.issues));
      }

      try {
        const updated = await swapRoutineExercise(
          paramParsed.data.routineId,
          paramParsed.data.id,
          request.userId!,
          bodyParsed.data,
        );
        return reply.status(200).send(ok(updated));
      } catch (err: unknown) {
        if (err instanceof ProgramResourceNotFoundError) {
          return reply.status(404).send(fail('RESOURCE_NOT_FOUND', err.message));
        }
        if (err instanceof ProgramValidationError) {
          return reply.status(400).send(fail('VALIDATION_ERROR', err.message));
        }
        request.log.error(err, 'Failed to swap routine exercise');
        return reply.status(500).send(fail('INTERNAL_SERVER_ERROR', 'Failed to swap exercise'));
      }
    },
  );
}
