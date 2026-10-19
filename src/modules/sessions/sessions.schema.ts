import { z } from 'zod';
import {
  workoutSessions,
  workoutSetLogs,
} from '../../db/schema.js';

export type WorkoutSessionRow = typeof workoutSessions.$inferSelect;
export type WorkoutSetLogRow = typeof workoutSetLogs.$inferSelect;

// ---------------------------------------------------------------------------
// Path Parameters Schemas
// ---------------------------------------------------------------------------

export const sessionIdParamSchema = z.object({
  sessionId: z.string().uuid('Invalid session ID format'),
});

export const sessionSetParamsSchema = z.object({
  sessionId: z.string().uuid('Invalid session ID format'),
  setId: z.string().uuid('Invalid set ID format'),
});

// ---------------------------------------------------------------------------
// Request Body Schemas
// ---------------------------------------------------------------------------

export const startSessionSchema = z.object({
  routineId: z.string().uuid('Invalid routine ID format').nullable().optional(),
  notes: z.string().trim().max(500, 'Notes cannot exceed 500 characters').optional(),
});

export type StartSessionInput = z.infer<typeof startSessionSchema>;

export const logSetSchema = z.object({
  exerciseId: z.string().uuid('Invalid exercise ID format'),
  routineExerciseId: z.string().uuid('Invalid routine exercise ID format').nullable().optional(),
  setNumber: z.coerce.number().int().min(1, 'Set number must be at least 1'),
  actualWeightKg: z.coerce
    .number()
    .min(0, 'Weight must be non-negative')
    .max(1000, 'Weight exceeds maximum allowable limit'),
  actualReps: z.coerce
    .number()
    .int()
    .min(0, 'Reps must be non-negative')
    .max(200, 'Reps exceed maximum allowable limit'),
  rpe: z.coerce
    .number()
    .min(1, 'RPE minimum is 1')
    .max(10, 'RPE maximum is 10')
    .nullable()
    .optional(),
  isWarmup: z.boolean().default(false),
  targetWeightKg: z.coerce.number().min(0).nullable().optional(),
  targetReps: z.coerce.number().int().min(1).nullable().optional(),
  targetHit: z.boolean().optional(),
});

export type LogSetInput = z.infer<typeof logSetSchema>;

export const updateSetSchema = z.object({
  setNumber: z.coerce.number().int().min(1).optional(),
  actualWeightKg: z.coerce.number().min(0).max(1000).optional(),
  actualReps: z.coerce.number().int().min(0).max(200).optional(),
  rpe: z.coerce.number().min(1).max(10).nullable().optional(),
  isWarmup: z.boolean().optional(),
  targetWeightKg: z.coerce.number().min(0).nullable().optional(),
  targetReps: z.coerce.number().int().min(1).nullable().optional(),
  targetHit: z.boolean().optional(),
});

export type UpdateSetInput = z.infer<typeof updateSetSchema>;

export const finishSessionSchema = z.object({
  perceivedRpe: z.coerce
    .number()
    .min(1, 'Perceived RPE minimum is 1')
    .max(10, 'Perceived RPE maximum is 10')
    .nullable()
    .optional(),
  jointSoreness: z.coerce
    .number()
    .int()
    .min(0, 'Joint soreness minimum is 0')
    .max(10, 'Joint soreness maximum is 10')
    .nullable()
    .optional(),
  notes: z.string().trim().max(1000, 'Notes cannot exceed 1000 characters').optional(),
  completedAt: z.string().datetime({ message: 'completedAt must be a valid ISO 8601 string' }).optional(),
});

export type FinishSessionInput = z.infer<typeof finishSessionSchema>;

export const hitPrescribedSessionSchema = z.object({
  perceivedRpe: z.coerce
    .number()
    .min(1, 'Perceived RPE minimum is 1')
    .max(10, 'Perceived RPE maximum is 10')
    .nullable()
    .optional(),
  jointSoreness: z.coerce
    .number()
    .int()
    .min(0, 'Joint soreness minimum is 0')
    .max(10, 'Joint soreness maximum is 10')
    .nullable()
    .optional(),
  notes: z.string().trim().max(1000, 'Notes cannot exceed 1000 characters').optional(),
  completedAt: z.string().datetime({ message: 'completedAt must be a valid ISO 8601 string' }).optional(),
});

export type HitPrescribedSessionInput = z.infer<typeof hitPrescribedSessionSchema>;

export const cancelSessionSchema = z.object({
  notes: z.string().trim().max(500, 'Cancellation notes cannot exceed 500 characters').optional(),
});

export type CancelSessionInput = z.infer<typeof cancelSessionSchema>;

export const listSessionsQuerySchema = z.object({
  status: z.enum(['in_progress', 'completed', 'abandoned']).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export type ListSessionsQuery = z.infer<typeof listSessionsQuerySchema>;

// ---------------------------------------------------------------------------
// Swagger UI Request Body JSON Schemas
// ---------------------------------------------------------------------------

export const startSessionBodySchema = {
  type: 'object',
  properties: {
    routineId: {
      type: 'string',
      format: 'uuid',
      nullable: true,
      description: 'Scheduled workout routine ID to execute (omit for freestyle workout)',
      example: '66666666-6666-6666-6666-666666666666',
    },
    notes: {
      type: 'string',
      maxLength: 500,
      description: 'Optional pre-workout focus notes or goals',
      example: 'Feeling well-rested, prioritizing chest pressing technique.',
    },
  },
};

export const logSetBodySchema = {
  type: 'object',
  required: ['exerciseId', 'setNumber', 'actualWeightKg', 'actualReps'],
  properties: {
    exerciseId: {
      type: 'string',
      format: 'uuid',
      description: 'Target exercise UUID from catalogue',
      example: '44444444-4444-4444-4444-444444444444',
    },
    routineExerciseId: {
      type: 'string',
      format: 'uuid',
      nullable: true,
      description: 'Prescribed routine exercise UUID if linking to a planned schedule',
      example: '77777777-7777-7777-7777-777777777777',
    },
    setNumber: {
      type: 'integer',
      minimum: 1,
      description: 'Chronological set order for this exercise',
      example: 1,
    },
    actualWeightKg: {
      type: 'number',
      minimum: 0,
      maximum: 1000,
      description: 'Actual weight lifted in kilograms (0 for bodyweight)',
      example: 80.0,
    },
    actualReps: {
      type: 'integer',
      minimum: 0,
      maximum: 200,
      description: 'Actual completed repetitions',
      example: 10,
    },
    rpe: {
      type: 'number',
      minimum: 1,
      maximum: 10,
      nullable: true,
      description: 'Rate of Perceived Exertion (RPE 1-10) for this set',
      example: 8.5,
    },
    isWarmup: {
      type: 'boolean',
      default: false,
      description: 'Flag indicating whether this was an uncounted warm-up set',
      example: false,
    },
    targetWeightKg: {
      type: 'number',
      minimum: 0,
      nullable: true,
      description: 'Prescribed target weight in kg',
      example: 80.0,
    },
    targetReps: {
      type: 'integer',
      minimum: 1,
      nullable: true,
      description: 'Prescribed target rep count',
      example: 10,
    },
    targetHit: {
      type: 'boolean',
      description: 'Whether prescribed target was achieved (defaults to actualReps >= targetReps)',
      example: true,
    },
  },
};

export const updateSetBodySchema = {
  type: 'object',
  properties: {
    setNumber: {
      type: 'integer',
      minimum: 1,
      description: 'Adjusted set number',
      example: 2,
    },
    actualWeightKg: {
      type: 'number',
      minimum: 0,
      maximum: 1000,
      description: 'Adjusted weight in kilograms',
      example: 82.5,
    },
    actualReps: {
      type: 'integer',
      minimum: 0,
      maximum: 200,
      description: 'Adjusted completed repetitions',
      example: 8,
    },
    rpe: {
      type: 'number',
      minimum: 1,
      maximum: 10,
      nullable: true,
      description: 'Adjusted RPE (1-10)',
      example: 9.0,
    },
    isWarmup: {
      type: 'boolean',
      description: 'Adjusted warm-up flag',
      example: false,
    },
    targetWeightKg: {
      type: 'number',
      minimum: 0,
      nullable: true,
      description: 'Adjusted prescribed target weight',
      example: 80.0,
    },
    targetReps: {
      type: 'integer',
      minimum: 1,
      nullable: true,
      description: 'Adjusted prescribed target reps',
      example: 10,
    },
    targetHit: {
      type: 'boolean',
      description: 'Adjusted target achievement flag',
      example: false,
    },
  },
};

export const finishSessionBodySchema = {
  type: 'object',
  properties: {
    perceivedRpe: {
      type: 'number',
      minimum: 1,
      maximum: 10,
      nullable: true,
      description: 'Overall session Rate of Perceived Exertion (1-10)',
      example: 8.0,
    },
    jointSoreness: {
      type: 'integer',
      minimum: 0,
      maximum: 10,
      nullable: true,
      description: 'Subjective joint tenderness score (0=none, 10=severe)',
      example: 2,
    },
    notes: {
      type: 'string',
      maxLength: 1000,
      description: 'Post-workout cooldown notes, pump rating, or energy reflections',
      example: 'Great chest connection today. Felt strong on incline dumbell bench.',
    },
    completedAt: {
      type: 'string',
      format: 'date-time',
      description: 'Custom completion timestamp (defaults to current server time)',
      example: '2026-10-19T21:30:00.000Z',
    },
  },
};

export const hitPrescribedSessionBodySchema = {
  type: 'object',
  properties: {
    perceivedRpe: {
      type: 'number',
      minimum: 1,
      maximum: 10,
      nullable: true,
      description: 'Overall session Rate of Perceived Exertion (1-10)',
      example: 8.0,
    },
    jointSoreness: {
      type: 'integer',
      minimum: 0,
      maximum: 10,
      nullable: true,
      description: 'Subjective joint tenderness score (0=none, 10=severe)',
      example: 1,
    },
    notes: {
      type: 'string',
      maxLength: 1000,
      description: 'Post-workout cooldown notes, pump rating, or energy reflections',
      example: 'Hit all prescribed sets and reps with textbook form.',
    },
    completedAt: {
      type: 'string',
      format: 'date-time',
      description: 'Custom completion timestamp (defaults to current server time)',
      example: '2026-10-19T21:30:00.000Z',
    },
  },
};

export const cancelSessionBodySchema = {
  type: 'object',
  properties: {
    notes: {
      type: 'string',
      maxLength: 500,
      description: 'Reason for session cancellation / abandonment',
      example: 'Emergency work call, had to leave gym early.',
    },
  },
};
