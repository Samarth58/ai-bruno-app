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

export const coachChatBodySchema = {
  type: 'object',
  required: ['message'],
  properties: {
    message: {
      type: 'string',
      minLength: 1,
      maxLength: 1000,
      description: 'Lifter message, training inquiry, or exercise question',
      example: 'What should I train today with my dumbbells?',
    },
    context: {
      type: 'object',
      description: 'Optional workout session or gym profile context for coaching personalization',
      properties: {
        sessionId: {
          type: 'string',
          format: 'uuid',
          nullable: true,
          description: 'Optional UUID of an active or recent workout session',
          example: null,
        },
        gymProfileId: {
          type: 'string',
          format: 'uuid',
          nullable: true,
          description: 'Optional UUID of a specific gym hardware profile',
          example: null,
        },
      },
      example: {
        sessionId: null,
        gymProfileId: null,
      },
    },
  },
};

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

// ---------------------------------------------------------------------------
// Pre-Session Briefing Schemas
// ---------------------------------------------------------------------------

export const briefingPlannedExerciseSchema = z.object({
  id: z.string().uuid(),
  exerciseId: z.string().uuid(),
  name: z.string(),
  primaryMuscleGroup: z.string(),
  movementPattern: z.string(),
  prescribedSets: z.number().int(),
  repRangeMin: z.number().int(),
  repRangeMax: z.number().int(),
  targetWeightKg: z.number().nullable(),
  targetRpe: z.number().nullable(),
});

export const preSessionBriefingSchema = z.object({
  hasScheduledRoutine: z.boolean(),
  activeProgramName: z.string().nullable(),
  todayWorkout: z
    .object({
      routineId: z.string().uuid(),
      routineName: z.string(),
      dayNumber: z.number().int(),
      targetRpe: z.number().nullable(),
      description: z.string().nullable(),
      prescribedExercisesCount: z.number().int(),
      exercises: z.array(briefingPlannedExerciseSchema),
    })
    .nullable(),
  previousSession: z
    .object({
      sessionId: z.string().uuid(),
      routineName: z.string().nullable(),
      completedAt: z.string().nullable(),
      durationMinutes: z.number(),
      totalVolumeKg: z.number(),
      workingSets: z.number(),
      perceivedRpe: z.number().nullable(),
      hitPrescribedTargets: z.boolean(),
    })
    .nullable(),
  readinessScore: z.number(),
  fatigueLevel: z.enum(['low', 'moderate', 'high', 'severe']),
  coachingTip: z.string(),
});

export type PreSessionBriefingData = z.infer<typeof preSessionBriefingSchema>;

// ---------------------------------------------------------------------------
// Weekly Review Schemas
// ---------------------------------------------------------------------------

export const weeklyReviewMuscleStatSchema = z.object({
  muscleGroup: z.string(),
  workingSetsCount: z.number(),
  totalVolumeKg: z.number(),
  exerciseCount: z.number(),
});

export const weeklyReviewSchema = z.object({
  weekStartDate: z.string(),
  weekEndDate: z.string(),
  completedWorkouts: z.number().int(),
  targetWorkouts: z.number().int(),
  adherencePercentage: z.number(),
  totalWorkingSets: z.number().int(),
  totalVolumeKg: z.number(),
  totalDurationMinutes: z.number().int(),
  currentStreakWeeks: z.number().int(),
  verdict: z.enum(['needs_momentum', 'in_progress', 'on_track', 'target_achieved']),
  feedback: z.string(),
  muscleGroupBreakdown: z.array(weeklyReviewMuscleStatSchema),
});

export type WeeklyReviewData = z.infer<typeof weeklyReviewSchema>;

// ---------------------------------------------------------------------------
// Mascot Visual State Schemas
// ---------------------------------------------------------------------------

export const mascotVisualStateEnum = z.enum([
  'studying_journal',
  'approving_nod',
  'waiting_with_watch',
]);

export type MascotVisualState = z.infer<typeof mascotVisualStateEnum>;

export const mascotStateSchema = z.object({
  visualState: mascotVisualStateEnum,
  headline: z.string(),
  subtext: z.string(),
  mood: z.enum(['proud', 'analytical', 'impatient']),
  context: z.object({
    daysSinceLastWorkout: z.number().nullable(),
    currentStreakWeeks: z.number().int(),
    weeklyWorkoutsCompleted: z.number().int(),
    weeklyWorkoutsTarget: z.number().int(),
    readinessScore: z.number(),
  }),
});

export type MascotStateData = z.infer<typeof mascotStateSchema>;
