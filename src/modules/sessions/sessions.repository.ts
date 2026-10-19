import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import { db } from '../../db/connection.js';
import {
  exercises,
  routineExercises,
  workoutPrograms,
  workoutRoutines,
  workoutSessions,
  workoutSetLogs,
  type Exercise,
  type RoutineExercise,
  type WorkoutRoutine,
  type WorkoutSession,
  type WorkoutSetLog,
} from '../../db/schema.js';
import type { LogSetInput, UpdateSetInput } from './sessions.schema.js';

export interface PopulatedSetLog extends WorkoutSetLog {
  exercise: Pick<
    Exercise,
    'id' | 'name' | 'primaryMuscleGroup' | 'movementPattern' | 'requiredEquipment'
  >;
  routineExercise?: Pick<
    RoutineExercise,
    'id' | 'prescribedSets' | 'repRangeMin' | 'repRangeMax' | 'targetRpe'
  > | null;
}

export interface PopulatedSessionDetail extends WorkoutSession {
  routine: (WorkoutRoutine & { programName?: string }) | null;
  setLogs: PopulatedSetLog[];
}

/**
 * Finds an active (in_progress) session for a user with all logged sets.
 */
export async function findActiveSessionByUserId(
  userId: string,
): Promise<PopulatedSessionDetail | null> {
  const [session] = await db
    .select()
    .from(workoutSessions)
    .where(
      and(
        eq(workoutSessions.userId, userId),
        eq(workoutSessions.status, 'in_progress'),
        isNull(workoutSessions.deletedAt),
      ),
    )
    .limit(1);

  if (!session) {
    return null;
  }

  return assemblePopulatedSession(session);
}

/**
 * Finds a session by ID ensuring ownership and non-deleted state.
 */
export async function findSessionByIdAndUserId(
  sessionId: string,
  userId: string,
): Promise<PopulatedSessionDetail | null> {
  const [session] = await db
    .select()
    .from(workoutSessions)
    .where(
      and(
        eq(workoutSessions.id, sessionId),
        eq(workoutSessions.userId, userId),
        isNull(workoutSessions.deletedAt),
      ),
    )
    .limit(1);

  if (!session) {
    return null;
  }

  return assemblePopulatedSession(session);
}

/**
 * Creates a new workout session record.
 */
export async function insertSession(data: {
  userId: string;
  routineId?: string | null;
  notes?: string;
}): Promise<WorkoutSession> {
  const [created] = await db
    .insert(workoutSessions)
    .values({
      userId: data.userId,
      routineId: data.routineId ?? null,
      notes: data.notes ?? null,
      status: 'in_progress',
      startedAt: new Date(),
    })
    .returning();

  return created;
}

/**
 * Updates a workout session header (completion, cancellation, notes, RPE).
 */
export async function updateSessionById(
  sessionId: string,
  userId: string,
  data: Partial<{
    status: 'in_progress' | 'completed' | 'abandoned';
    completedAt: Date;
    perceivedRpe: number | null;
    jointSoreness: number | null;
    notes: string | null;
    hitPrescribedTargets: boolean;
  }>,
): Promise<WorkoutSession | null> {
  const [updated] = await db
    .update(workoutSessions)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(workoutSessions.id, sessionId),
        eq(workoutSessions.userId, userId),
        isNull(workoutSessions.deletedAt),
      ),
    )
    .returning();

  return updated ?? null;
}

/**
 * Inserts a recorded set log into a workout session.
 */
export async function insertSetLog(
  sessionId: string,
  data: LogSetInput,
): Promise<PopulatedSetLog> {
  const [created] = await db
    .insert(workoutSetLogs)
    .values({
      sessionId,
      exerciseId: data.exerciseId,
      routineExerciseId: data.routineExerciseId ?? null,
      setNumber: data.setNumber,
      actualWeightKg: data.actualWeightKg,
      actualReps: data.actualReps,
      rpe: data.rpe ?? null,
      isWarmup: data.isWarmup ?? false,
      targetWeightKg: data.targetWeightKg ?? null,
      targetReps: data.targetReps ?? null,
      targetHit: data.targetHit ?? false,
    })
    .returning();

  const [exercise] = await db
    .select({
      id: exercises.id,
      name: exercises.name,
      primaryMuscleGroup: exercises.primaryMuscleGroup,
      movementPattern: exercises.movementPattern,
      requiredEquipment: exercises.requiredEquipment,
    })
    .from(exercises)
    .where(eq(exercises.id, created.exerciseId))
    .limit(1);

  return {
    ...created,
    exercise: exercise ?? {
      id: created.exerciseId,
      name: 'Unknown Exercise',
      primaryMuscleGroup: 'unknown',
      movementPattern: 'unknown',
      requiredEquipment: 'bodyweight',
    },
  };
}

/**
 * Finds a set log by ID and checks whether it belongs to the given session.
 */
export async function findSetLogById(
  setId: string,
  sessionId: string,
): Promise<WorkoutSetLog | null> {
  const [set] = await db
    .select()
    .from(workoutSetLogs)
    .where(
      and(
        eq(workoutSetLogs.id, setId),
        eq(workoutSetLogs.sessionId, sessionId),
      ),
    )
    .limit(1);

  return set ?? null;
}

/**
 * Updates a set log entry.
 */
export async function updateSetLogById(
  setId: string,
  sessionId: string,
  data: UpdateSetInput,
): Promise<PopulatedSetLog | null> {
  const [updated] = await db
    .update(workoutSetLogs)
    .set({
      ...(data.setNumber !== undefined && { setNumber: data.setNumber }),
      ...(data.actualWeightKg !== undefined && { actualWeightKg: data.actualWeightKg }),
      ...(data.actualReps !== undefined && { actualReps: data.actualReps }),
      ...(data.rpe !== undefined && { rpe: data.rpe }),
      ...(data.isWarmup !== undefined && { isWarmup: data.isWarmup }),
      ...(data.targetWeightKg !== undefined && { targetWeightKg: data.targetWeightKg }),
      ...(data.targetReps !== undefined && { targetReps: data.targetReps }),
      ...(data.targetHit !== undefined && { targetHit: data.targetHit }),
    })
    .where(
      and(
        eq(workoutSetLogs.id, setId),
        eq(workoutSetLogs.sessionId, sessionId),
      ),
    )
    .returning();

  if (!updated) {
    return null;
  }

  const [exercise] = await db
    .select({
      id: exercises.id,
      name: exercises.name,
      primaryMuscleGroup: exercises.primaryMuscleGroup,
      movementPattern: exercises.movementPattern,
      requiredEquipment: exercises.requiredEquipment,
    })
    .from(exercises)
    .where(eq(exercises.id, updated.exerciseId))
    .limit(1);

  return {
    ...updated,
    exercise: exercise ?? {
      id: updated.exerciseId,
      name: 'Unknown Exercise',
      primaryMuscleGroup: 'unknown',
      movementPattern: 'unknown',
      requiredEquipment: 'bodyweight',
    },
  };
}

/**
 * Deletes a set log entry.
 */
export async function deleteSetLogById(
  setId: string,
  sessionId: string,
): Promise<boolean> {
  const deleted = await db
    .delete(workoutSetLogs)
    .where(
      and(
        eq(workoutSetLogs.id, setId),
        eq(workoutSetLogs.sessionId, sessionId),
      ),
    )
    .returning({ id: workoutSetLogs.id });

  return deleted.length > 0;
}

/**
 * Lists sessions for a user with status filter and limit-offset pagination.
 */
export async function listSessionsByUserId(
  userId: string,
  options: {
    status?: 'in_progress' | 'completed' | 'abandoned';
    limit: number;
    offset: number;
  },
): Promise<{ sessions: WorkoutSession[]; total: number }> {
  const conditions = [
    eq(workoutSessions.userId, userId),
    isNull(workoutSessions.deletedAt),
  ];

  if (options.status) {
    conditions.push(eq(workoutSessions.status, options.status));
  }

  const whereClause = and(...conditions);

  const sessions = await db
    .select()
    .from(workoutSessions)
    .where(whereClause)
    .orderBy(desc(workoutSessions.startedAt))
    .limit(options.limit)
    .offset(options.offset);

  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(workoutSessions)
    .where(whereClause);

  return {
    sessions,
    total: Number(countResult?.count ?? 0),
  };
}

/**
 * Helper to fetch all sets and routine data for a session.
 */
async function assemblePopulatedSession(
  session: WorkoutSession,
): Promise<PopulatedSessionDetail> {
  let routine: (WorkoutRoutine & { programName?: string }) | null = null;

  if (session.routineId) {
    const [routineRow] = await db
      .select({
        routine: workoutRoutines,
        programName: workoutPrograms.name,
      })
      .from(workoutRoutines)
      .leftJoin(workoutPrograms, eq(workoutRoutines.programId, workoutPrograms.id))
      .where(eq(workoutRoutines.id, session.routineId))
      .limit(1);

    if (routineRow) {
      routine = {
        ...routineRow.routine,
        programName: routineRow.programName ?? undefined,
      };
    }
  }

  const rawSets = await db
    .select({
      setLog: workoutSetLogs,
      exercise: {
        id: exercises.id,
        name: exercises.name,
        primaryMuscleGroup: exercises.primaryMuscleGroup,
        movementPattern: exercises.movementPattern,
        requiredEquipment: exercises.requiredEquipment,
      },
    })
    .from(workoutSetLogs)
    .leftJoin(exercises, eq(workoutSetLogs.exerciseId, exercises.id))
    .where(eq(workoutSetLogs.sessionId, session.id))
    .orderBy(workoutSetLogs.createdAt);

  const setLogs: PopulatedSetLog[] = rawSets.map((r) => ({
    ...r.setLog,
    exercise: r.exercise ?? {
      id: r.setLog.exerciseId,
      name: 'Unknown Exercise',
      primaryMuscleGroup: 'unknown',
      movementPattern: 'unknown',
      requiredEquipment: 'bodyweight',
    },
  }));

  return {
    ...session,
    routine,
    setLogs,
  };
}
