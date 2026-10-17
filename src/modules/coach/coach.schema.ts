import { z } from 'zod';

export const coachChatContextSchema = z
  .object({
    sessionId: z
      .string()
      .uuid('Invalid sessionId UUID')
      .nullable()
      .optional(),
    gymProfileId: z
      .string()
      .uuid('Invalid gymProfileId UUID')
      .nullable()
      .optional(),
  })
  .optional();

export const coachChatRequestSchema = z.object({
  message: z
    .string({ required_error: 'Message is required' })
    .trim()
    .min(1, 'Message cannot be empty')
    .max(1000, 'Message exceeds maximum length of 1000 characters'),
  context: coachChatContextSchema,
});

export type CoachChatRequestInput = z.infer<typeof coachChatRequestSchema>;
export type CoachChatContextInput = z.infer<typeof coachChatContextSchema>;

export const suggestedExerciseSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string(),
  primaryMuscleGroup: z.string().optional(),
  movementPattern: z.string().optional(),
  requiredEquipment: z.string().optional(),
  isCompatible: z.boolean(),
  reason: z.string().optional(),
});

export type SuggestedExercise = z.infer<typeof suggestedExerciseSchema>;

export const coachChatResponseDataSchema = z.object({
  reply: z.string(),
  suggestedExercises: z.array(suggestedExerciseSchema),
  userContext: z.object({
    gymProfileName: z.string().nullable(),
    activeConstraints: z.array(z.string()),
    equipmentEnvironment: z.string().nullable(),
  }),
  safetyAlert: z.string().nullable(),
});

export type CoachChatResponseData = z.infer<typeof coachChatResponseDataSchema>;
