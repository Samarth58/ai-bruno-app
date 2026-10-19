import { z } from 'zod';

// ---------------------------------------------------------------------------
// Path Parameters Schemas
// ---------------------------------------------------------------------------

export const exerciseIdParamSchema = z.object({
  exerciseId: z.string().uuid('Invalid exercise ID format'),
});

// ---------------------------------------------------------------------------
// Query Schemas
// ---------------------------------------------------------------------------

export const volumeByMuscleQuerySchema = z.object({
  startDate: z
    .string()
    .datetime({ message: 'startDate must be a valid ISO 8601 string' })
    .optional(),
  endDate: z
    .string()
    .datetime({ message: 'endDate must be a valid ISO 8601 string' })
    .optional(),
});

export type VolumeByMuscleQuery = z.infer<typeof volumeByMuscleQuerySchema>;

export const estimated1rmQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  formula: z.enum(['epley', 'brzycki']).default('epley'),
});

export type Estimated1rmQuery = z.infer<typeof estimated1rmQuerySchema>;

export const consistencyQuerySchema = z.object({
  weeks: z.coerce.number().int().min(4).max(52).default(8),
});

export type ConsistencyQuery = z.infer<typeof consistencyQuerySchema>;
