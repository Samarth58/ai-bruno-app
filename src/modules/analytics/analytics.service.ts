import { getUserRecoveryStatus } from '../overload/overload.service.js';
import {
  calculateEstimated1rm,
  calculateTrainingStreaks,
  getMondayOfWeek,
  getSundayOfWeek,
  type TrainingStreakSummary,
} from './analytics.engine.js';
import {
  calculateAllTimeVolumeAndReps,
  countUserCompletedWorkouts,
  countUserCompletedWorkoutsInRange,
  findExerciseWorkingSetsFor1rm,
  findUserActiveProgram,
  findUserCompletedSessionDates,
  findUserRecentActivity,
  findVolumeByMuscleGroup,
  type MuscleGroupVolumeStat,
} from './analytics.repository.js';
import type {
  ConsistencyQuery,
  Estimated1rmQuery,
  VolumeByMuscleQuery,
} from './analytics.schema.js';

// ---------------------------------------------------------------------------
// Domain Errors
// ---------------------------------------------------------------------------

export class AnalyticsResourceNotFoundError extends Error {
  public readonly code = 'RESOURCE_NOT_FOUND';
  public readonly statusCode = 404;

  constructor(message: string) {
    super(message);
    this.name = 'AnalyticsResourceNotFoundError';
  }
}

export class AnalyticsValidationError extends Error {
  public readonly code = 'VALIDATION_ERROR';
  public readonly statusCode = 400;

  constructor(message: string) {
    super(message);
    this.name = 'AnalyticsValidationError';
  }
}

// ---------------------------------------------------------------------------
// Business Operations
// ---------------------------------------------------------------------------

/**
 * Returns a high-level overview of completed workouts, weekly volume, active program, and recent sessions.
 */
export async function getLifterOverview(userId: string) {
  const now = new Date();
  const startOfCurrentWeek = getMondayOfWeek(now);
  const endOfCurrentWeek = getSundayOfWeek(now);

  const [totalWorkouts, currentWeekWorkouts, allTimeTotals, activeProgram, recentActivity, sessionDates] =
    await Promise.all([
      countUserCompletedWorkouts(userId),
      countUserCompletedWorkoutsInRange(userId, startOfCurrentWeek, endOfCurrentWeek),
      calculateAllTimeVolumeAndReps(userId),
      findUserActiveProgram(userId),
      findUserRecentActivity(userId, 5),
      findUserCompletedSessionDates(userId),
    ]);

  const streaks = calculateTrainingStreaks(sessionDates, 8, activeProgram?.trainingDaysPerWeek ?? 4);

  return {
    totalWorkouts,
    currentWeekWorkouts,
    targetWeeklyWorkouts: activeProgram?.trainingDaysPerWeek ?? 4,
    currentStreakWeeks: streaks.currentStreakWeeks,
    allTimeTotalVolumeKg: allTimeTotals.totalVolumeKg,
    allTimeTotalReps: allTimeTotals.totalReps,
    activeProgram: activeProgram
      ? {
          id: activeProgram.id,
          name: activeProgram.name,
          splitType: activeProgram.splitType,
          durationWeeks: activeProgram.durationWeeks,
          trainingDaysPerWeek: activeProgram.trainingDaysPerWeek,
        }
      : null,
    recentActivity: recentActivity.map((item) => ({
      sessionId: item.session.id,
      routineName: item.routineName,
      startedAt: item.session.startedAt,
      completedAt: item.session.completedAt,
      durationMinutes: item.durationMinutes,
      totalVolumeKg: item.totalVolumeKg,
      totalSets: item.totalSets,
      workingSets: item.workingSets,
      perceivedRpe: item.session.perceivedRpe,
      jointSoreness: item.session.jointSoreness,
    })),
  };
}

/**
 * Returns working set volume and set distributions aggregated across muscle groups over a date range.
 */
export async function getVolumeByMuscleAnalytics(
  userId: string,
  query: VolumeByMuscleQuery,
) {
  const now = new Date();
  const endDate = query.endDate ? new Date(query.endDate) : now;
  const startDate = query.startDate
    ? new Date(query.startDate)
    : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Default 30 days

  if (startDate > endDate) {
    throw new AnalyticsValidationError('startDate cannot be after endDate');
  }

  const rawStats = await findVolumeByMuscleGroup(userId, startDate, endDate);

  const totalVolumeKg = rawStats.reduce((sum, s) => sum + s.totalVolumeKg, 0);
  const totalWorkingSets = rawStats.reduce((sum, s) => sum + s.workingSetsCount, 0);

  const muscleGroups = rawStats.map((stat: MuscleGroupVolumeStat) => ({
    ...stat,
    percentageOfTotalVolume:
      totalVolumeKg > 0
        ? Math.round((stat.totalVolumeKg / totalVolumeKg) * 1000) / 10
        : 0,
  }));

  return {
    dateRange: {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    },
    totalVolumeKg: Math.round(totalVolumeKg),
    totalWorkingSets,
    muscleGroups,
  };
}

/**
 * Returns estimated 1RM chronological progression data for a specific exercise.
 */
export async function getEstimated1rmTrend(
  userId: string,
  exerciseId: string,
  query: Estimated1rmQuery,
) {
  const { exercise, records } = await findExerciseWorkingSetsFor1rm(
    userId,
    exerciseId,
    query.limit,
  );

  if (!exercise) {
    throw new AnalyticsResourceNotFoundError('Exercise not found');
  }

  const history = records.map((r) => {
    const estimated1rmKg = calculateEstimated1rm(r.weightKg, r.reps, query.formula);
    return {
      date: r.sessionDate.toISOString(),
      sessionId: r.sessionId,
      weightKg: r.weightKg,
      reps: r.reps,
      rpe: r.rpe,
      estimated1rmKg,
    };
  });

  const allTimePeakEstimated1rmKg =
    history.length > 0 ? Math.max(...history.map((h) => h.estimated1rmKg)) : null;

  // Recent peak from the last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentHistory = history.filter((h) => new Date(h.date) >= thirtyDaysAgo);
  const currentEstimated1rmKg =
    recentHistory.length > 0
      ? Math.max(...recentHistory.map((h) => h.estimated1rmKg))
      : (history[history.length - 1]?.estimated1rmKg ?? null);

  return {
    exercise: {
      id: exercise.id,
      name: exercise.name,
      primaryMuscleGroup: exercise.primaryMuscleGroup,
      movementPattern: exercise.movementPattern,
      requiredEquipment: exercise.requiredEquipment,
    },
    formula: query.formula,
    disclaimer:
      'Calculated estimates based on submaximal training performance. Values represent algorithmic estimations rather than tested maximal lifts.',
    currentEstimated1rmKg,
    allTimePeakEstimated1rmKg,
    totalWorkingSetsLogged: history.length,
    history,
  };
}

/**
 * Returns weekly workout counts, consistency percentages, and active training streaks.
 */
export async function getTrainingConsistency(
  userId: string,
  query: ConsistencyQuery,
): Promise<TrainingStreakSummary> {
  const sessionDates = await findUserCompletedSessionDates(userId);
  return calculateTrainingStreaks(sessionDates, query.weeks);
}

/**
 * Returns a mobile-optimized executive dashboard combining volume trends, streaks, and recovery.
 */
export async function getMobileProgressSummary(userId: string) {
  const now = new Date();
  const startOfThisWeek = getMondayOfWeek(now);
  const endOfThisWeek = getSundayOfWeek(now);

  const startOfLastWeek = new Date(startOfThisWeek.getTime());
  startOfLastWeek.setUTCDate(startOfLastWeek.getUTCDate() - 7);
  const endOfLastWeek = new Date(startOfThisWeek.getTime() - 1);

  const [
    overview,
    thisWeekVolumeStats,
    lastWeekVolumeStats,
    recoveryStatus,
  ] = await Promise.all([
    getLifterOverview(userId),
    findVolumeByMuscleGroup(userId, startOfThisWeek, endOfThisWeek),
    findVolumeByMuscleGroup(userId, startOfLastWeek, endOfLastWeek),
    getUserRecoveryStatus(userId),
  ]);

  const thisWeekVolume = thisWeekVolumeStats.reduce((sum, s) => sum + s.totalVolumeKg, 0);
  const lastWeekVolume = lastWeekVolumeStats.reduce((sum, s) => sum + s.totalVolumeKg, 0);

  let volumeChangePercentage = 0;
  if (lastWeekVolume > 0) {
    volumeChangePercentage =
      Math.round(((thisWeekVolume - lastWeekVolume) / lastWeekVolume) * 1000) / 10;
  }

  return {
    summary: {
      totalWorkouts: overview.totalWorkouts,
      currentWeekWorkouts: overview.currentWeekWorkouts,
      targetWeeklyWorkouts: overview.targetWeeklyWorkouts,
      currentStreakWeeks: overview.currentStreakWeeks,
      thisWeekVolumeKg: Math.round(thisWeekVolume),
      lastWeekVolumeKg: Math.round(lastWeekVolume),
      volumeChangePercentage,
    },
    recovery: {
      readinessScore: recoveryStatus.readinessScore,
      fatigueLevel: recoveryStatus.fatigueLevel,
      averageJointSoreness: recoveryStatus.averageJointSoreness,
      jointSorenessRisk: recoveryStatus.jointSorenessRisk,
      shouldDeload: recoveryStatus.shouldDeload,
      deloadType: recoveryStatus.deloadType,
      coachingNotes: recoveryStatus.coachingNotes,
    },
    muscleVolumeDistribution: thisWeekVolumeStats.map((s) => ({
      muscleGroup: s.muscleGroup,
      volumeKg: s.totalVolumeKg,
      workingSetsCount: s.workingSetsCount,
    })),
    recentSessions: overview.recentActivity.slice(0, 3),
  };
}
