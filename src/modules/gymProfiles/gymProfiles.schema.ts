import { z } from 'zod';
import { gymProfiles } from '../../db/schema.js';

export type GymProfileRow = typeof gymProfiles.$inferSelect;

export const idParamSchema = z.object({
  id: z.string().uuid('Invalid profile ID format'),
});

export const createGymProfileSchema = z.object({
  name: z.string().trim().min(1, 'Profile name is required').max(100),
  environmentType: z.enum(['commercial', 'apartment', 'home', 'other']).default('commercial'),
  maxDumbbellWeightKg: z.number().positive().max(500).nullable().optional(),
  hasBarbell: z.boolean().default(false),
  hasSquatRack: z.boolean().default(false),
  hasBench: z.boolean().default(true),
  hasCableStack: z.boolean().default(false),
  hasSmithMachine: z.boolean().default(false),
  hasPullupBar: z.boolean().default(false),
  hasAdjustableBench: z.boolean().default(false),
  hasDumbbells: z.boolean().default(true),
  isDefault: z.boolean().default(false),
});

export type CreateGymProfileInput = z.infer<typeof createGymProfileSchema>;

export const updateGymProfileSchema = z
  .object({
    name: z.string().trim().min(1, 'Profile name cannot be empty').max(100).optional(),
    environmentType: z.enum(['commercial', 'apartment', 'home', 'other']).optional(),
    maxDumbbellWeightKg: z.number().positive().max(500).nullable().optional(),
    hasBarbell: z.boolean().optional(),
    hasSquatRack: z.boolean().optional(),
    hasBench: z.boolean().optional(),
    hasCableStack: z.boolean().optional(),
    hasSmithMachine: z.boolean().optional(),
    hasPullupBar: z.boolean().optional(),
    hasAdjustableBench: z.boolean().optional(),
    hasDumbbells: z.boolean().optional(),
    isDefault: z.boolean().optional(),
  })
  .strict()
  .refine(
    (data) => Object.keys(data).length > 0,
    {
      message: 'At least one field must be provided for update',
    },
  );

export type UpdateGymProfileInput = z.infer<typeof updateGymProfileSchema>;
