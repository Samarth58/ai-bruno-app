import { and, desc, eq, isNull } from 'drizzle-orm';
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

export interface RoutineExerciseWithExercise extends RoutineExercise {
  exercise: Exercise;
  programUserId: string;
}

/**
 * Finds a single routine exercise with exercise metadata, enforcing user ownership.
 */
export async function findRoutineExerciseWithExercise(
  routineExerciseId: string,
  userId: string,
): Promise<RoutineExerciseWithExercise | null> {
  const [row] = await db
    .select({
      routineExercise: routineExercises,
      exercise: exercises,
      programUserId: workoutPrograms.userId,
    })
    .from(routineExercises)
    .innerJoin(exercises, eq(routineExercises.exerciseId, exercises.id))
    .innerJoin(workoutRoutines, eq(routineExercises.routineId, workoutRoutines.id))
    .innerJoin(workoutPrograms, eq(workoutRoutines.programId, workoutPrograms.id))
    .where(
      and(
        eq(routineExercises.id, routineExerciseId),
        eq(workoutPrograms.userId, userId),
        isNull(workoutRoutines.deletedAt),
        isNull(workoutPrograms.deletedAt),
      ),
    )
    .limit(1);

  if (!row) {
    return null;
  }

  return {
    ...row.routineExercise,
    exercise: row.exercise,
    programUserId: row.programUserId,
  };
}

/**
 * Finds all prescribed exercises for a routine, enforcing user ownership.
 */
export async function findRoutineWithPrescribedExercises(
  routineId: string,
  userId: string,
): Promise<{
  routine: WorkoutRoutine;
  exercises: Array<{ routineExercise: RoutineExercise; exercise: Exercise }>;
} | null> {
  const [routineRow] = await db
    .select({
      routine: workoutRoutines,
      programUserId: workoutPrograms.userId,
    })
    .from(workoutRoutines)
    .innerJoin(workoutPrograms, eq(workoutRoutines.programId, workoutPrograms.id))
    .where(
      and(
        eq(workoutRoutines.id, routineId),
        eq(workoutPrograms.userId, userId),
        isNull(workoutRoutines.deletedAt),
        isNull(workoutPrograms.deletedAt),
      ),
    )
    .limit(1);

  if (!routineRow) {
    return null;
  }

  const rows = await db
    .select({
      routineExercise: routineExercises,
      exercise: exercises,
    })
    .from(routineExercises)
    .innerJoin(exercises, eq(routineExercises.exerciseId, exercises.id))
    .where(eq(routineExercises.routineId, routineId))
    .orderBy(routineExercises.orderIndex);

  return {
    routine: routineRow.routine,
    exercises: rows,
  };
}

/**
 * Fetches recent working sets logged for a routine exercise or exercise ID by this user.
 */
export async function findRecentSetsForExercise(
  exerciseId: string,
  userId: string,
  routineExerciseId?: string,
  limit = 12,
): Promise<WorkoutSetLog[]> {
  // Query sets logged in completed or active sessions for this user
  const conditions = [
    eq(workoutSessions.userId, userId),
    eq(workoutSetLogs.exerciseId, exerciseId),
    isNull(workoutSessions.deletedAt),
  ];

  if (routineExerciseId) {
    conditions.push(eq(workoutSetLogs.routineExerciseId, routineExerciseId));
  }

  const sets = await db
    .select({
      setLog: workoutSetLogs,
    })
    .from(workoutSetLogs)
    .innerJoin(workoutSessions, eq(workoutSetLogs.sessionId, workoutSessions.id))
    .where(and(...conditions))
    .orderBy(desc(workoutSetLogs.createdAt))
    .limit(limit);

  return sets.map((s) => s.setLog);
}

/**
 * Updates prescribed targets for a routine exercise.
 */
export async function updateRoutineExerciseTarget(
  routineExerciseId: string,
  data: Partial<{
    targetWeightKg: number | null;
    targetRpe: number | null;
    prescribedSets: number;
    repRangeMin: number;
    repRangeMax: number;
    notes: string | null;
  }>,
): Promise<RoutineExercise | null> {
  const [updated] = await db
    .update(routineExercises)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(routineExercises.id, routineExerciseId))
    .returning();

  return updated ?? null;
}

/**
 * Batch updates routine exercises in a single atomic transaction.
 */
export async function batchUpdateRoutineExerciseTargets(
  updates: Array<{
    id: string;
    data: Partial<{
      targetWeightKg: number | null;
      targetRpe: number | null;
      prescribedSets: number;
      repRangeMin: number;
      repRangeMax: number;
      notes: string | null;
    }>;
  }>,
): Promise<RoutineExercise[]> {
  return db.transaction(async (tx) => {
    const results: RoutineExercise[] = [];
    for (const item of updates) {
      const [updated] = await tx
        .update(routineExercises)
        .set({
          ...item.data,
          updatedAt: new Date(),
        })
        .where(eq(routineExercises.id, item.id))
        .returning();

      if (updated) {
        results.push(updated);
      }
    }
    return results;
  });
}

/**
 * Fetches recent sessions for systemic recovery & fatigue calculation.
 */
export async function findRecentSessionsForRecovery(
  userId: string,
  limit = 10,
): Promise<WorkoutSession[]> {
  return db
    .select()
    .from(workoutSessions)
    .where(and(eq(workoutSessions.userId, userId), isNull(workoutSessions.deletedAt)))
    .orderBy(desc(workoutSessions.startedAt))
    .limit(limit);
}
