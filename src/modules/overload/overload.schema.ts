import { z } from 'zod';

// ---------------------------------------------------------------------------
// Path Parameters Schemas
// ---------------------------------------------------------------------------

export const routineExerciseIdParamSchema = z.object({
  routineExerciseId: z.string().uuid('Invalid routine exercise ID format'),
});

export const routineIdParamSchema = z.object({
  routineId: z.string().uuid('Invalid routine ID format'),
});

// ---------------------------------------------------------------------------
// Request Body Schemas
// ---------------------------------------------------------------------------

export const applyProgressionSchema = z.object({
  targetWeightKg: z.coerce
    .number()
    .min(0, 'Target weight must be non-negative')
    .max(1000, 'Target weight exceeds allowable maximum')
    .nullable()
    .optional(),
  targetReps: z.coerce.number().int().min(1, 'Target reps must be at least 1').max(200).optional(),
  prescribedSets: z.coerce
    .number()
    .int()
    .min(1, 'Prescribed sets must be at least 1')
    .max(20)
    .optional(),
  targetRpe: z.coerce.number().min(1).max(10).nullable().optional(),
  notes: z.string().trim().max(500, 'Notes cannot exceed 500 characters').optional(),
});

export type ApplyProgressionInput = z.infer<typeof applyProgressionSchema>;

export const routineExerciseOverrideSchema = z.object({
  routineExerciseId: z.string().uuid('Invalid routine exercise ID format'),
  targetWeightKg: z.coerce.number().min(0).max(1000).nullable().optional(),
  prescribedSets: z.coerce.number().int().min(1).max(20).optional(),
  targetReps: z.coerce.number().int().min(1).max(200).optional(),
  targetRpe: z.coerce.number().min(1).max(10).nullable().optional(),
});

export const applyRoutineProgressionSchema = z.object({
  overrides: z.array(routineExerciseOverrideSchema).optional(),
});

export type ApplyRoutineProgressionInput = z.infer<typeof applyRoutineProgressionSchema>;

export const applyDeloadSchema = z.object({
  reductionPercentage: z.coerce
    .number()
    .min(5, 'Minimum deload reduction is 5%')
    .max(50, 'Maximum deload reduction is 50%')
    .default(10),
  reduceSetsBy: z.coerce
    .number()
    .int()
    .min(0, 'Cannot reduce sets by negative number')
    .max(3, 'Maximum set reduction is 3')
    .default(1),
  notes: z.string().trim().max(500).optional(),
});

export type ApplyDeloadInput = z.infer<typeof applyDeloadSchema>;

// ---------------------------------------------------------------------------
// Swagger UI Request Body JSON Schemas
// ---------------------------------------------------------------------------

export const applyProgressionBodySchema = {
  type: 'object',
  properties: {
    targetWeightKg: {
      type: 'number',
      minimum: 0,
      maximum: 1000,
      nullable: true,
      description: 'Approved new target working weight in kilograms',
      example: 82.5,
    },
    targetReps: {
      type: 'integer',
      minimum: 1,
      maximum: 200,
      description: 'Approved new target repetition count per set',
      example: 8,
    },
    prescribedSets: {
      type: 'integer',
      minimum: 1,
      maximum: 20,
      description: 'Adjusted prescribed working set volume',
      example: 3,
    },
    targetRpe: {
      type: 'number',
      minimum: 1,
      maximum: 10,
      nullable: true,
      description: 'Adjusted target RPE threshold',
      example: 8.0,
    },
    notes: {
      type: 'string',
      maxLength: 500,
      description: 'Progression reflection note or microcycle goal',
      example: 'Progressed from 80kg to 82.5kg after hitting 10 reps across all sets.',
    },
  },
};

export const applyRoutineProgressionBodySchema = {
  type: 'object',
  properties: {
    overrides: {
      type: 'array',
      description: 'Optional manual overrides for specific routine exercises',
      items: {
        type: 'object',
        required: ['routineExerciseId'],
        properties: {
          routineExerciseId: {
            type: 'string',
            format: 'uuid',
            example: '77777777-7777-7777-7777-777777777777',
          },
          targetWeightKg: {
            type: 'number',
            example: 85.0,
          },
          prescribedSets: {
            type: 'integer',
            example: 4,
          },
          targetReps: {
            type: 'integer',
            example: 8,
          },
          targetRpe: {
            type: 'number',
            example: 8.5,
          },
        },
      },
    },
  },
};

export const applyDeloadBodySchema = {
  type: 'object',
  properties: {
    reductionPercentage: {
      type: 'number',
      minimum: 5,
      maximum: 50,
      default: 10,
      description: 'Percentage to lower working weight across exercises (e.g. 10 for 10% reduction)',
      example: 10,
    },
    reduceSetsBy: {
      type: 'integer',
      minimum: 0,
      maximum: 3,
      default: 1,
      description: 'Number of sets to subtract from each exercise (minimum 1 set always preserved)',
      example: 1,
    },
    notes: {
      type: 'string',
      maxLength: 500,
      description: 'Reason for deload (e.g. joint soreness, planned recovery week)',
      example: 'Planned deload week following 4-week high volume hypertrophy mesocycle.',
    },
  },
};
