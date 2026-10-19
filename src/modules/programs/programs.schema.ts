import { z } from 'zod';
import {
  routineExercises,
  workoutPrograms,
  workoutRoutines,
} from '../../db/schema.js';

export type WorkoutProgramRow = typeof workoutPrograms.$inferSelect;
export type WorkoutRoutineRow = typeof workoutRoutines.$inferSelect;
export type RoutineExerciseRow = typeof routineExercises.$inferSelect;

export const programIdParamSchema = z.object({
  id: z.string().uuid('Invalid program ID format'),
});

export const routineIdParamSchema = z.object({
  routineId: z.string().uuid('Invalid routine ID format'),
});

export const programRoutineParamsSchema = z.object({
  programId: z.string().uuid('Invalid program ID format'),
  id: z.string().uuid('Invalid routine ID format'),
});

export const routineExerciseParamsSchema = z.object({
  routineId: z.string().uuid('Invalid routine ID format'),
  id: z.string().uuid('Invalid routine exercise ID format'),
});

export const splitTypeEnum = z.enum(['push_pull_legs', 'upper_lower', 'full_body']);
export const programGoalEnum = z.enum(['strength', 'hypertrophy', 'endurance']);

export const generateProgramSchema = z.object({
  name: z.string().trim().min(1).max(100).default('Personalized Workout Program'),
  splitType: splitTypeEnum,
  trainingDaysPerWeek: z.coerce.number().int().min(3).max(6).default(4),
  durationWeeks: z.coerce.number().int().min(1).max(16).default(4),
  targetSessionDurationMinutes: z.coerce.number().int().min(20).max(120).default(45),
  gymProfileId: z.string().uuid('Invalid gym profile ID').nullable().optional(),
  goal: programGoalEnum.default('hypertrophy'),
});


export type GenerateProgramInput = z.infer<typeof generateProgramSchema>;

export const createProgramSchema = z.object({
  name: z.string().trim().min(1, 'Program name is required').max(100),
  splitType: splitTypeEnum,
  trainingDaysPerWeek: z.coerce.number().int().min(1).max(7).default(4),
  durationWeeks: z.coerce.number().int().min(1).max(52).default(4),
  currentWeek: z.coerce.number().int().min(1).max(52).default(1),
  targetSessionDurationMinutes: z.coerce.number().int().min(10).max(240).default(45),
  gymProfileId: z.string().uuid('Invalid gym profile ID').nullable().optional(),
  isActive: z.boolean().default(true),
});

export type CreateProgramInput = z.infer<typeof createProgramSchema>;

export const updateProgramSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    splitType: splitTypeEnum.optional(),
    trainingDaysPerWeek: z.coerce.number().int().min(1).max(7).optional(),
    durationWeeks: z.coerce.number().int().min(1).max(52).optional(),
    currentWeek: z.coerce.number().int().min(1).max(52).optional(),
    targetSessionDurationMinutes: z.coerce.number().int().min(10).max(240).optional(),
    gymProfileId: z.string().uuid().nullable().optional(),
    isActive: z.boolean().optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

export type UpdateProgramInput = z.infer<typeof updateProgramSchema>;

export const createRoutineSchema = z.object({
  name: z.string().trim().min(1, 'Routine name is required').max(100),
  dayNumber: z.coerce.number().int().min(1).max(14),
  weekNumber: z.coerce.number().int().min(1).max(52).nullable().optional(),
  targetRpe: z.coerce.number().min(5).max(10).nullable().optional(),
  description: z.string().max(500).nullable().optional(),
});

export type CreateRoutineInput = z.infer<typeof createRoutineSchema>;

export const updateRoutineSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    dayNumber: z.coerce.number().int().min(1).max(14).optional(),
    weekNumber: z.coerce.number().int().min(1).max(52).nullable().optional(),
    targetRpe: z.coerce.number().min(5).max(10).nullable().optional(),
    description: z.string().max(500).nullable().optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

export type UpdateRoutineInput = z.infer<typeof updateRoutineSchema>;

export const createRoutineExerciseSchema = z.object({
  exerciseId: z.string().uuid('Invalid exercise ID'),
  orderIndex: z.coerce.number().int().min(0).default(0),
  prescribedSets: z.coerce.number().int().min(1).max(10).default(3),
  repRangeMin: z.coerce.number().int().min(1).max(100).default(8),
  repRangeMax: z.coerce.number().int().min(1).max(100).default(12),
  targetWeightKg: z.coerce.number().positive().max(1000).nullable().optional(),
  targetRpe: z.coerce.number().min(5).max(10).nullable().optional(),
  restSeconds: z.coerce.number().int().min(0).max(600).default(90),
  notes: z.string().max(300).nullable().optional(),
});

export type CreateRoutineExerciseInput = z.infer<typeof createRoutineExerciseSchema>;

export const updateRoutineExerciseSchema = z
  .object({
    orderIndex: z.coerce.number().int().min(0).optional(),
    prescribedSets: z.coerce.number().int().min(1).max(10).optional(),
    repRangeMin: z.coerce.number().int().min(1).max(100).optional(),
    repRangeMax: z.coerce.number().int().min(1).max(100).optional(),
    targetWeightKg: z.coerce.number().positive().max(1000).nullable().optional(),
    targetRpe: z.coerce.number().min(5).max(10).nullable().optional(),
    restSeconds: z.coerce.number().int().min(0).max(600).optional(),
    notes: z.string().max(300).nullable().optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

export type UpdateRoutineExerciseInput = z.infer<typeof updateRoutineExerciseSchema>;

export const swapRoutineExerciseSchema = z.object({
  replacementExerciseId: z.string().uuid('Invalid replacement exercise ID'),
  reason: z.string().max(200).optional(),
});

export type SwapRoutineExerciseInput = z.infer<typeof swapRoutineExerciseSchema>;

// ---------------------------------------------------------------------------
// Swagger UI Request Body JSON Schemas
// ---------------------------------------------------------------------------

export const generateProgramBodySchema = {
  type: 'object',
  required: ['splitType'],
  properties: {

    name: {
      type: 'string',
      description: 'Title for the personalized workout program',
      example: '4-Week Hypertrophy Dumbbell Block',
    },
    splitType: {
      type: 'string',
      enum: ['push_pull_legs', 'upper_lower', 'full_body'],
      description: 'Training frequency split methodology',
      example: 'upper_lower',
    },
    trainingDaysPerWeek: {
      type: 'integer',
      minimum: 3,
      maximum: 6,
      default: 4,
      description: 'Number of weekly workout sessions',
      example: 4,
    },
    durationWeeks: {
      type: 'integer',
      minimum: 1,
      maximum: 16,
      default: 4,
      description: 'Mesocycle duration in weeks',
      example: 4,
    },
    targetSessionDurationMinutes: {
      type: 'integer',
      minimum: 20,
      maximum: 120,
      default: 45,
      description: 'Desired workout session length in minutes',
      example: 45,
    },
    gymProfileId: {
      type: 'string',
      format: 'uuid',
      nullable: true,
      description: 'Optional gym hardware profile to ground exercises against',
      example: null,
    },
    goal: {
      type: 'string',
      enum: ['strength', 'hypertrophy', 'endurance'],
      default: 'hypertrophy',
      description: 'Primary physiological adaptation target',
      example: 'hypertrophy',
    },
  },
};

export const createProgramBodySchema = {
  type: 'object',
  required: ['name', 'splitType'],
  properties: {
    name: {
      type: 'string',
      description: 'Program name',
      example: 'Custom Push Pull Legs',
    },
    splitType: {
      type: 'string',
      enum: ['push_pull_legs', 'upper_lower', 'full_body'],
      example: 'push_pull_legs',
    },
    trainingDaysPerWeek: { type: 'integer', default: 4, example: 4 },
    durationWeeks: { type: 'integer', default: 4, example: 4 },
    currentWeek: { type: 'integer', default: 1, example: 1 },
    targetSessionDurationMinutes: { type: 'integer', default: 45, example: 45 },
    gymProfileId: { type: 'string', format: 'uuid', nullable: true, example: null },
    isActive: { type: 'boolean', default: true, example: true },
  },
};

export const updateProgramBodySchema = {
  type: 'object',
  properties: {
    name: { type: 'string', example: 'Updated 4-Week Block' },
    splitType: { type: 'string', enum: ['push_pull_legs', 'upper_lower', 'full_body'] },
    trainingDaysPerWeek: { type: 'integer', example: 4 },
    durationWeeks: { type: 'integer', example: 6 },
    currentWeek: { type: 'integer', example: 2 },
    targetSessionDurationMinutes: { type: 'integer', example: 50 },
    gymProfileId: { type: 'string', format: 'uuid', nullable: true },
    isActive: { type: 'boolean', example: true },
  },
};

export const createRoutineBodySchema = {
  type: 'object',
  required: ['name', 'dayNumber'],
  properties: {
    name: { type: 'string', description: 'Routine title', example: 'Push Day A' },
    dayNumber: { type: 'integer', description: 'Day sequence within the week', example: 1 },
    weekNumber: { type: 'integer', nullable: true, example: 1 },
    targetRpe: { type: 'number', nullable: true, example: 8.0 },
    description: { type: 'string', nullable: true, example: 'Chest, front delts, and triceps focus' },
  },
};

export const createRoutineExerciseBodySchema = {
  type: 'object',
  required: ['exerciseId'],
  properties: {
    exerciseId: { type: 'string', format: 'uuid', description: 'Exercise ID from catalog' },
    orderIndex: { type: 'integer', default: 0, example: 0 },
    prescribedSets: { type: 'integer', default: 3, example: 3 },
    repRangeMin: { type: 'integer', default: 8, example: 8 },
    repRangeMax: { type: 'integer', default: 12, example: 12 },
    targetWeightKg: { type: 'number', nullable: true, example: 20 },
    targetRpe: { type: 'number', nullable: true, example: 8.0 },
    restSeconds: { type: 'integer', default: 90, example: 90 },
    notes: { type: 'string', nullable: true, example: 'Control eccentric for 2 seconds' },
  },
};

export const swapRoutineExerciseBodySchema = {
  type: 'object',
  required: ['replacementExerciseId'],
  properties: {
    replacementExerciseId: {
      type: 'string',
      format: 'uuid',
      description: 'UUID of compatible alternative exercise',
      example: '00000000-0000-0000-0000-000000000001',
    },
    reason: {
      type: 'string',
      description: 'Optional note or reason for exercise replacement',
      example: 'Machine is occupied in the gym',
    },
  },
};
