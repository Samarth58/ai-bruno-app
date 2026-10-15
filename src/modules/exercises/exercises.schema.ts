import { z } from 'zod';
import type { Exercise } from '../../db/schema.js';

export type ExerciseRow = Exercise;

export const idParamSchema = z.object({
  id: z.string().uuid('Invalid exercise ID format'),
});

export const listExercisesQuerySchema = z.object({
  gymProfileId: z.string().uuid('Invalid gym profile ID').optional(),
  useProfileEquipment: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .default('true'),
  useActiveConstraints: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .default('true'),
  primaryMuscleGroup: z.string().trim().optional(),
  movementPattern: z.string().trim().optional(),
  search: z.string().trim().optional(),
});

export type ListExercisesQuery = z.infer<typeof listExercisesQuerySchema>;
