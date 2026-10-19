import { and, desc, eq, gte, isNull, lte, sql } from 'drizzle-orm';
import { db } from '../../db/connection.js';
import {
  exercises,
  workoutPrograms,
  workoutRoutines,
  workoutSessions,
  workoutSetLogs,
  type Exercise,
  type WorkoutProgram,
  type WorkoutSession,
} from '../../db/schema.js';

export interface MuscleGroupVolumeStat {
  muscleGroup: string;
  workingSetsCount: number;
  totalVolumeKg: number;
  averageReps: number;
  averageRpe: number | null;
  exerciseCount: number;
}

export interface Set1rmRecord {
  id: string;
  sessionId: string;
  sessionDate: Date;
  weightKg: number;
  reps: number;
  rpe: number | null;
}

/**
 * Counts total completed workout sessions for a user.
 */
export async function countUserCompletedWorkouts(userId: string): Promise<number> {
  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(workoutSessions)
    .where(
      and(
        eq(workoutSessions.userId, userId),
        eq(workoutSessions.status, 'completed'),
        isNull(workoutSessions.deletedAt),
      ),
    );

  return Number(result?.count ?? 0);
}

/**
 * Counts completed workout sessions in a specific date interval.
 */
export async function countUserCompletedWorkoutsInRange(
  userId: string,
  startDate: Date,
  endDate: Date,
): Promise<number> {
  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(workoutSessions)
    .where(
      and(
        eq(workoutSessions.userId, userId),
        eq(workoutSessions.status, 'completed'),
        isNull(workoutSessions.deletedAt),
        gte(workoutSessions.startedAt, startDate),
        lte(workoutSessions.startedAt, endDate),
      ),
    );

  return Number(result?.count ?? 0);
}

/**
 * Retrieves all dates of completed workouts for streak and frequency calculation.
 */
export async function findUserCompletedSessionDates(
  userId: string,
  sinceDate?: Date,
): Promise<Date[]> {
  const conditions = [
    eq(workoutSessions.userId, userId),
    eq(workoutSessions.status, 'completed'),
    isNull(workoutSessions.deletedAt),
  ];

  if (sinceDate) {
    conditions.push(gte(workoutSessions.startedAt, sinceDate));
  }

  const rows = await db
    .select({
      startedAt: workoutSessions.startedAt,
      completedAt: workoutSessions.completedAt,
    })
    .from(workoutSessions)
    .where(and(...conditions))
    .orderBy(desc(workoutSessions.startedAt));

  return rows.map((r) => r.completedAt ?? r.startedAt);
}

/**
 * Retrieves recent completed sessions with routine and set metrics.
 */
export async function findUserRecentActivity(
  userId: string,
  limit = 5,
): Promise<
  Array<{
    session: WorkoutSession;
    routineName: string | null;
    totalSets: number;
    workingSets: number;
    totalVolumeKg: number;
    durationMinutes: number;
  }>
> {
  const sessions = await db
    .select({
      session: workoutSessions,
      routineName: workoutRoutines.name,
    })
    .from(workoutSessions)
    .leftJoin(workoutRoutines, eq(workoutSessions.routineId, workoutRoutines.id))
    .where(
      and(
        eq(workoutSessions.userId, userId),
        eq(workoutSessions.status, 'completed'),
        isNull(workoutSessions.deletedAt),
      ),
    )
    .orderBy(desc(workoutSessions.startedAt))
    .limit(limit);

  const results = [];

  for (const item of sessions) {
    const sets = await db
      .select({
        actualWeightKg: workoutSetLogs.actualWeightKg,
        actualReps: workoutSetLogs.actualReps,
        isWarmup: workoutSetLogs.isWarmup,
      })
      .from(workoutSetLogs)
      .where(eq(workoutSetLogs.sessionId, item.session.id));

    const workingSetsList = sets.filter((s) => !s.isWarmup);
    const totalVolumeKg = workingSetsList.reduce(
      (sum, s) => sum + s.actualWeightKg * s.actualReps,
      0,
    );

    const startTime = new Date(item.session.startedAt).getTime();
    const endTime = item.session.completedAt
      ? new Date(item.session.completedAt).getTime()
      : startTime;
    const durationMinutes = Math.max(0, Math.round((endTime - startTime) / 60000));

    results.push({
      session: item.session,
      routineName: item.routineName ?? null,
      totalSets: sets.length,
      workingSets: workingSetsList.length,
      totalVolumeKg: Math.round(totalVolumeKg * 10) / 10,
      durationMinutes,
    });
  }

  return results;
}

/**
 * Retrieves the user's active workout program if one exists.
 */
export async function findUserActiveProgram(
  userId: string,
): Promise<WorkoutProgram | null> {
  const [program] = await db
    .select()
    .from(workoutPrograms)
    .where(
      and(
        eq(workoutPrograms.userId, userId),
        eq(workoutPrograms.isActive, true),
        isNull(workoutPrograms.deletedAt),
      ),
    )
    .limit(1);

  return program ?? null;
}

/**
 * Calculates working set volume and set counts aggregated by muscle group over a date range.
 */
export async function findVolumeByMuscleGroup(
  userId: string,
  startDate: Date,
  endDate: Date,
): Promise<MuscleGroupVolumeStat[]> {
  const rows = await db
    .select({
      muscleGroup: exercises.primaryMuscleGroup,
      actualWeightKg: workoutSetLogs.actualWeightKg,
      actualReps: workoutSetLogs.actualReps,
      rpe: workoutSetLogs.rpe,
      exerciseId: exercises.id,
    })
    .from(workoutSetLogs)
    .innerJoin(workoutSessions, eq(workoutSetLogs.sessionId, workoutSessions.id))
    .innerJoin(exercises, eq(workoutSetLogs.exerciseId, exercises.id))
    .where(
      and(
        eq(workoutSessions.userId, userId),
        eq(workoutSessions.status, 'completed'),
        isNull(workoutSessions.deletedAt),
        eq(workoutSetLogs.isWarmup, false),
        gte(workoutSessions.startedAt, startDate),
        lte(workoutSessions.startedAt, endDate),
      ),
    );

  // Group in-memory for granular statistical averages and unique exercise counts
  const map = new Map<
    string,
    {
      totalVolume: number;
      setsCount: number;
      totalReps: number;
      rpeSum: number;
      rpeCount: number;
      exercisesSet: Set<string>;
    }
  >();

  for (const row of rows) {
    const mg = row.muscleGroup || 'other';
    if (!map.has(mg)) {
      map.set(mg, {
        totalVolume: 0,
        setsCount: 0,
        totalReps: 0,
        rpeSum: 0,
        rpeCount: 0,
        exercisesSet: new Set(),
      });
    }

    const current = map.get(mg)!;
    current.totalVolume += row.actualWeightKg * row.actualReps;
    current.setsCount += 1;
    current.totalReps += row.actualReps;
    current.exercisesSet.add(row.exerciseId);

    if (row.rpe !== null && row.rpe !== undefined) {
      current.rpeSum += Number(row.rpe);
      current.rpeCount += 1;
    }
  }

  const results: MuscleGroupVolumeStat[] = [];
  for (const [muscleGroup, data] of map.entries()) {
    results.push({
      muscleGroup,
      workingSetsCount: data.setsCount,
      totalVolumeKg: Math.round(data.totalVolume),
      averageReps: Math.round((data.totalReps / data.setsCount) * 10) / 10,

      averageRpe:
        data.rpeCount > 0 ? Math.round((data.rpeSum / data.rpeCount) * 10) / 10 : null,
      exerciseCount: data.exercisesSet.size,
    });
  }

  // Sort descending by total volume
  return results.sort((a, b) => b.totalVolumeKg - a.totalVolumeKg);
}

/**
 * Fetches historical working sets for an exercise to calculate estimated 1RM progression.
 */
export async function findExerciseWorkingSetsFor1rm(
  userId: string,
  exerciseId: string,
  limit = 50,
): Promise<{ exercise: Exercise | null; records: Set1rmRecord[] }> {
  const [exercise] = await db
    .select()
    .from(exercises)
    .where(eq(exercises.id, exerciseId))
    .limit(1);

  if (!exercise) {
    return { exercise: null, records: [] };
  }

  const sets = await db
    .select({
      id: workoutSetLogs.id,
      sessionId: workoutSetLogs.sessionId,
      sessionDate: workoutSessions.startedAt,
      weightKg: workoutSetLogs.actualWeightKg,
      reps: workoutSetLogs.actualReps,
      rpe: workoutSetLogs.rpe,
    })
    .from(workoutSetLogs)
    .innerJoin(workoutSessions, eq(workoutSetLogs.sessionId, workoutSessions.id))
    .where(
      and(
        eq(workoutSessions.userId, userId),
        eq(workoutSessions.status, 'completed'),
        isNull(workoutSessions.deletedAt),
        eq(workoutSetLogs.exerciseId, exerciseId),
        eq(workoutSetLogs.isWarmup, false),
        sql`${workoutSetLogs.actualWeightKg} > 0`,
        sql`${workoutSetLogs.actualReps} <= 20`,
      ),
    )
    .orderBy(desc(workoutSessions.startedAt), desc(workoutSetLogs.createdAt))
    .limit(limit);

  // Return chronological order (oldest to newest)
  return {
    exercise,
    records: sets.reverse(),
  };
}

/**
 * Calculates all-time working-set volume and total completed reps for a user.
 */
export async function calculateAllTimeVolumeAndReps(
  userId: string,
): Promise<{ totalVolumeKg: number; totalReps: number }> {
  const [result] = await db
    .select({
      totalVolumeKg: sql<number>`coalesce(sum(${workoutSetLogs.actualWeightKg} * ${workoutSetLogs.actualReps}), 0)`,
      totalReps: sql<number>`coalesce(sum(${workoutSetLogs.actualReps}), 0)`,
    })
    .from(workoutSetLogs)
    .innerJoin(workoutSessions, eq(workoutSetLogs.sessionId, workoutSessions.id))
    .where(
      and(
        eq(workoutSessions.userId, userId),
        eq(workoutSessions.status, 'completed'),
        isNull(workoutSessions.deletedAt),
        eq(workoutSetLogs.isWarmup, false),
      ),
    );

  return {
    totalVolumeKg: Math.round(Number(result?.totalVolumeKg ?? 0)),
    totalReps: Number(result?.totalReps ?? 0),
  };
}
