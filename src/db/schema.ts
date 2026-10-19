import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  doublePrecision,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

// ---------------------------------------------------------------------------
// Core Auth & Starter Kit Tables
// ---------------------------------------------------------------------------

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    email: text('email').notNull(),
    passwordHash: text('password_hash').notNull(),
    name: text('name'),
    role: text('role', { enum: ['user', 'admin'] }).notNull().default('user'),
    createdAt: timestamp('created_at').notNull().default(sql`now()`),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    uniqueIndex('users_email_active_unique')
      .on(table.email)
      .where(sql`${table.deletedAt} IS NULL`),
  ],
);

export const userSessions = pgTable(
  'user_sessions',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    jtiHash: text('jti_hash').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => [
    index('user_sessions_user_id_idx').on(table.userId),
    uniqueIndex('user_sessions_jti_hash_unique').on(table.jtiHash),
  ],
);

export const passwordResetChallenges = pgTable(
  'password_reset_challenges',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    email: text('email').notNull(),
    otpHash: text('otp_hash').notNull(),
    otpExpiresAt: timestamp('otp_expires_at', { withTimezone: true }).notNull(),
    attempts: integer('attempts').notNull().default(0),
    maxAttempts: integer('max_attempts').notNull().default(5),
    resendCooldownExpiresAt: timestamp('resend_cooldown_expires_at', {
      withTimezone: true,
    }).notNull(),
    otpVerifiedAt: timestamp('otp_verified_at', { withTimezone: true }),
    resetTokenHash: text('reset_token_hash'),
    resetTokenExpiresAt: timestamp('reset_token_expires_at', {
      withTimezone: true,
    }),
    consumedAt: timestamp('consumed_at', { withTimezone: true }),
    supersededAt: timestamp('superseded_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => [
    index('password_reset_challenges_user_id_idx').on(table.userId),
    index('password_reset_challenges_email_idx').on(table.email),
    uniqueIndex('password_reset_challenges_reset_token_hash_unique')
      .on(table.resetTokenHash)
      .where(sql`${table.resetTokenHash} IS NOT NULL`),
  ],
);

export const examples = pgTable(
  'examples',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    index('examples_user_id_idx').on(table.userId),
    index('examples_created_at_idx').on(table.createdAt),
  ],
);

export { categories } from '../modules/categories/index.js';

// ---------------------------------------------------------------------------
// Bruno AI Gym Buddy: Exercise Knowledge Base
// ---------------------------------------------------------------------------

export const exercises = pgTable(
  'exercises',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    name: text('name').notNull().unique('exercises_name_unique'),
    primaryMuscleGroup: text('primary_muscle_group').notNull(),
    secondaryMuscleGroups: text('secondary_muscle_groups')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    movementPattern: text('movement_pattern').notNull(),
    requiredEquipment: text('required_equipment').notNull(),
    contraindicatedInjuries: text('contraindicated_injuries')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    instructions: text('instructions'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    index('exercises_primary_muscle_idx').on(table.primaryMuscleGroup),
    index('exercises_movement_pattern_idx').on(table.movementPattern),
    index('exercises_required_equipment_idx').on(table.requiredEquipment),
  ],
);

// ---------------------------------------------------------------------------
// Bruno AI Gym Buddy: Gym Hardware Profiles & Equipment Checklists
// ---------------------------------------------------------------------------

export const gymProfiles = pgTable(
  'gym_profiles',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    environmentType: text('environment_type').notNull().default('commercial'),
    maxDumbbellWeightKg: doublePrecision('max_dumbbell_weight_kg'),
    hasBarbell: boolean('has_barbell').notNull().default(false),
    hasSquatRack: boolean('has_squat_rack').notNull().default(false),
    hasBench: boolean('has_bench').notNull().default(true),
    hasCableStack: boolean('has_cable_stack').notNull().default(false),
    hasSmithMachine: boolean('has_smith_machine').notNull().default(false),
    hasPullupBar: boolean('has_pullup_bar').notNull().default(false),
    hasAdjustableBench: boolean('has_adjustable_bench').notNull().default(false),
    hasDumbbells: boolean('has_dumbbells').notNull().default(true),
    isDefault: boolean('is_default').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    index('gym_profiles_user_id_idx').on(table.userId),
  ],
);

// ---------------------------------------------------------------------------
// Bruno AI Gym Buddy: Physical Constraints & Injury Blacklist
// ---------------------------------------------------------------------------

export const userConstraints = pgTable(
  'user_constraints',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    jointArea: text('joint_area').notNull(),
    restrictionType: text('restriction_type').notNull().default('pain'),
    notes: text('notes'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    index('user_constraints_user_id_idx').on(table.userId),
  ],
);

// ---------------------------------------------------------------------------
// Bruno AI Gym Buddy: Periodized Workout Programs
// ---------------------------------------------------------------------------

export const workoutPrograms = pgTable(
  'workout_programs',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    gymProfileId: uuid('gym_profile_id')
      .references(() => gymProfiles.id, { onDelete: 'set null' }),
    name: text('name').notNull(),
    splitType: text('split_type', {
      enum: ['push_pull_legs', 'upper_lower', 'full_body'],
    }).notNull(),
    durationWeeks: integer('duration_weeks').notNull().default(4),
    currentWeek: integer('current_week').notNull().default(1),
    trainingDaysPerWeek: integer('training_days_per_week').notNull().default(4),
    targetSessionDurationMinutes: integer('target_session_duration_minutes')
      .notNull()
      .default(45),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    index('workout_programs_user_id_idx').on(table.userId),
    index('workout_programs_gym_profile_id_idx').on(table.gymProfileId),
  ],
);

// ---------------------------------------------------------------------------
// Bruno AI Gym Buddy: Workout Routines (Training Days in Program)
// ---------------------------------------------------------------------------

export const workoutRoutines = pgTable(
  'workout_routines',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    programId: uuid('program_id')
      .notNull()
      .references(() => workoutPrograms.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    dayNumber: integer('day_number').notNull(),
    weekNumber: integer('week_number'),
    targetRpe: doublePrecision('target_rpe'),
    description: text('description'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    index('workout_routines_program_id_idx').on(table.programId),
  ],
);

// ---------------------------------------------------------------------------
// Bruno AI Gym Buddy: Routine Exercises (Prescribed Targets)
// ---------------------------------------------------------------------------

export const routineExercises = pgTable(
  'routine_exercises',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    routineId: uuid('routine_id')
      .notNull()
      .references(() => workoutRoutines.id, { onDelete: 'cascade' }),
    exerciseId: uuid('exercise_id')
      .notNull()
      .references(() => exercises.id, { onDelete: 'restrict' }),
    orderIndex: integer('order_index').notNull().default(0),
    prescribedSets: integer('prescribed_sets').notNull().default(3),
    repRangeMin: integer('rep_range_min').notNull().default(8),
    repRangeMax: integer('rep_range_max').notNull().default(10),
    targetWeightKg: doublePrecision('target_weight_kg'),
    targetRpe: doublePrecision('target_rpe'),
    restSeconds: integer('rest_seconds').default(90),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => [
    index('routine_exercises_routine_id_idx').on(table.routineId),
    index('routine_exercises_exercise_id_idx').on(table.exerciseId),
  ],
);

// ---------------------------------------------------------------------------
// Bruno AI Gym Buddy: Workout Sessions (Completed / Active Logs)
// ---------------------------------------------------------------------------

export const workoutSessions = pgTable(
  'workout_sessions',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    routineId: uuid('routine_id')
      .references(() => workoutRoutines.id, { onDelete: 'set null' }),
    startedAt: timestamp('started_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    perceivedRpe: doublePrecision('perceived_rpe'),
    jointSoreness: integer('joint_soreness'),
    hitPrescribedTargets: boolean('hit_prescribed_targets').default(false),
    status: text('status', {
      enum: ['in_progress', 'completed', 'abandoned'],
    }).notNull().default('in_progress'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    index('workout_sessions_user_id_idx').on(table.userId),
    index('workout_sessions_routine_id_idx').on(table.routineId),
    index('workout_sessions_started_at_idx').on(table.startedAt),
  ],
);

// ---------------------------------------------------------------------------
// Bruno AI Gym Buddy: Workout Set Logs (Granular Recorded Sets)
// ---------------------------------------------------------------------------

export const workoutSetLogs = pgTable(
  'workout_set_logs',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => workoutSessions.id, { onDelete: 'cascade' }),
    exerciseId: uuid('exercise_id')
      .notNull()
      .references(() => exercises.id, { onDelete: 'restrict' }),
    routineExerciseId: uuid('routine_exercise_id')
      .references(() => routineExercises.id, { onDelete: 'set null' }),
    setNumber: integer('set_number').notNull(),
    targetWeightKg: doublePrecision('target_weight_kg'),
    targetReps: integer('target_reps'),
    actualWeightKg: doublePrecision('actual_weight_kg').notNull(),
    actualReps: integer('actual_reps').notNull(),
    rpe: doublePrecision('rpe'),
    targetHit: boolean('target_hit').notNull().default(false),
    isWarmup: boolean('is_warmup').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true })

      .notNull()
      .default(sql`now()`),
  },
  (table) => [
    index('workout_set_logs_session_id_idx').on(table.sessionId),
    index('workout_set_logs_exercise_id_idx').on(table.exerciseId),
  ],
);

// ---------------------------------------------------------------------------
// Drizzle Relational Declarations
// ---------------------------------------------------------------------------

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(userSessions),
  passwordResetChallenges: many(passwordResetChallenges),
  gymProfiles: many(gymProfiles),
  userConstraints: many(userConstraints),
  workoutPrograms: many(workoutPrograms),
  workoutSessions: many(workoutSessions),
}));

export const userSessionsRelations = relations(userSessions, ({ one }) => ({
  user: one(users, {
    fields: [userSessions.userId],
    references: [users.id],
  }),
}));

export const passwordResetChallengesRelations = relations(
  passwordResetChallenges,
  ({ one }) => ({
    user: one(users, {
      fields: [passwordResetChallenges.userId],
      references: [users.id],
    }),
  }),
);

export const gymProfilesRelations = relations(gymProfiles, ({ one, many }) => ({
  user: one(users, {
    fields: [gymProfiles.userId],
    references: [users.id],
  }),
  programs: many(workoutPrograms),
}));

export const userConstraintsRelations = relations(userConstraints, ({ one }) => ({
  user: one(users, {
    fields: [userConstraints.userId],
    references: [users.id],
  }),
}));

export const exercisesRelations = relations(exercises, ({ many }) => ({
  routineExercises: many(routineExercises),
  setLogs: many(workoutSetLogs),
}));

export const workoutProgramsRelations = relations(workoutPrograms, ({ one, many }) => ({
  user: one(users, {
    fields: [workoutPrograms.userId],
    references: [users.id],
  }),
  gymProfile: one(gymProfiles, {
    fields: [workoutPrograms.gymProfileId],
    references: [gymProfiles.id],
  }),
  routines: many(workoutRoutines),
}));

export const workoutRoutinesRelations = relations(workoutRoutines, ({ one, many }) => ({
  program: one(workoutPrograms, {
    fields: [workoutRoutines.programId],
    references: [workoutPrograms.id],
  }),
  routineExercises: many(routineExercises),
  sessions: many(workoutSessions),
}));

export const routineExercisesRelations = relations(routineExercises, ({ one, many }) => ({
  routine: one(workoutRoutines, {
    fields: [routineExercises.routineId],
    references: [workoutRoutines.id],
  }),
  exercise: one(exercises, {
    fields: [routineExercises.exerciseId],
    references: [exercises.id],
  }),
  setLogs: many(workoutSetLogs),
}));

export const workoutSessionsRelations = relations(workoutSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [workoutSessions.userId],
    references: [users.id],
  }),
  routine: one(workoutRoutines, {
    fields: [workoutSessions.routineId],
    references: [workoutRoutines.id],
  }),
  setLogs: many(workoutSetLogs),
}));

export const workoutSetLogsRelations = relations(workoutSetLogs, ({ one }) => ({
  session: one(workoutSessions, {
    fields: [workoutSetLogs.sessionId],
    references: [workoutSessions.id],
  }),
  exercise: one(exercises, {
    fields: [workoutSetLogs.exerciseId],
    references: [exercises.id],
  }),
  routineExercise: one(routineExercises, {
    fields: [workoutSetLogs.routineExerciseId],
    references: [routineExercises.id],
  }),
}));

// ---------------------------------------------------------------------------
// Inferred TypeScript Model Types
// ---------------------------------------------------------------------------

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type UserSession = typeof userSessions.$inferSelect;
export type NewUserSession = typeof userSessions.$inferInsert;

export type PasswordResetChallenge = typeof passwordResetChallenges.$inferSelect;
export type NewPasswordResetChallenge = typeof passwordResetChallenges.$inferInsert;

export type Exercise = typeof exercises.$inferSelect;
export type NewExercise = typeof exercises.$inferInsert;

export type GymProfile = typeof gymProfiles.$inferSelect;
export type NewGymProfile = typeof gymProfiles.$inferInsert;

export type UserConstraint = typeof userConstraints.$inferSelect;
export type NewUserConstraint = typeof userConstraints.$inferInsert;

export type WorkoutProgram = typeof workoutPrograms.$inferSelect;
export type NewWorkoutProgram = typeof workoutPrograms.$inferInsert;

export type WorkoutRoutine = typeof workoutRoutines.$inferSelect;
export type NewWorkoutRoutine = typeof workoutRoutines.$inferInsert;

export type RoutineExercise = typeof routineExercises.$inferSelect;
export type NewRoutineExercise = typeof routineExercises.$inferInsert;

export type WorkoutSession = typeof workoutSessions.$inferSelect;
export type NewWorkoutSession = typeof workoutSessions.$inferInsert;

export type WorkoutSetLog = typeof workoutSetLogs.$inferSelect;
export type NewWorkoutSetLog = typeof workoutSetLogs.$inferInsert;
