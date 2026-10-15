import { z } from 'zod';
import { userConstraints } from '../../db/schema.js';

export type UserConstraintRow = typeof userConstraints.$inferSelect;

export const idParamSchema = z.object({
  id: z.string().uuid('Invalid constraint ID format'),
});

export const createConstraintSchema = z.object({
  jointArea: z.string().trim().min(1, 'Joint area is required').max(50),
  restrictionType: z.string().trim().min(1).max(50).default('pain'),
  notes: z.string().trim().max(1000).nullable().optional(),
  isActive: z.boolean().default(true),
});

export type CreateConstraintInput = z.infer<typeof createConstraintSchema>;

export const updateConstraintSchema = z
  .object({
    jointArea: z.string().trim().min(1).max(50).optional(),
    restrictionType: z.string().trim().min(1).max(50).optional(),
    notes: z.string().trim().max(1000).nullable().optional(),
    isActive: z.boolean().optional(),
  })
  .strict()
  .refine(
    (data) => Object.keys(data).length > 0,
    {
      message: 'At least one field must be provided for update',
    },
  );

export type UpdateConstraintInput = z.infer<typeof updateConstraintSchema>;

export const listConstraintsQuerySchema = z.object({
  isActive: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
});

export type ListConstraintsQuery = z.infer<typeof listConstraintsQuerySchema>;
