import {
  calculateExerciseProgression,
  calculateSystemicRecovery,
  type ProgressionRecommendation,
  type RecoveryStatus,
} from './overload.engine.js';
import {
  batchUpdateRoutineExerciseTargets,
  findRecentSessionsForRecovery,
  findRecentSetsForExercise,
  findRoutineExerciseWithExercise,
  findRoutineWithPrescribedExercises,
  updateRoutineExerciseTarget,
} from './overload.repository.js';
import type {
  ApplyDeloadInput,
  ApplyProgressionInput,
  ApplyRoutineProgressionInput,
} from './overload.schema.js';
import type { RoutineExercise } from '../../db/schema.js';

// ---------------------------------------------------------------------------
// Domain Errors
// ---------------------------------------------------------------------------

export class OverloadResourceNotFoundError extends Error {
  public readonly code = 'RESOURCE_NOT_FOUND';
  public readonly statusCode = 404;

  constructor(message: string) {
    super(message);
    this.name = 'OverloadResourceNotFoundError';
  }
}

export class OverloadValidationError extends Error {
  public readonly code = 'VALIDATION_ERROR';
  public readonly statusCode = 400;

  constructor(message: string) {
    super(message);
    this.name = 'OverloadValidationError';
  }
}

// ---------------------------------------------------------------------------
// Business Operations
// ---------------------------------------------------------------------------

/**
 * Calculates progression recommendation for a single routine exercise based on past set logs.
 */
export async function getProgressionRecommendationForExercise(
  routineExerciseId: string,
  userId: string,
): Promise<ProgressionRecommendation> {
  const row = await findRoutineExerciseWithExercise(routineExerciseId, userId);
  if (!row) {
    throw new OverloadResourceNotFoundError(
      'Routine exercise not found or not owned by authenticated user',
    );
  }

  const recentSets = await findRecentSetsForExercise(
    row.exerciseId,
    userId,
    routineExerciseId,
  );

  return calculateExerciseProgression({
    routineExercise: row,
    exercise: row.exercise,
    recentSets,
  });
}

/**
 * Calculates progression recommendations for all prescribed exercises in a routine,
 * coupled with systemic recovery context.
 */
export async function getProgressionRecommendationsForRoutine(
  routineId: string,
  userId: string,
): Promise<{
  routineId: string;
  routineName: string;
  recommendations: ProgressionRecommendation[];
  recoveryStatus: RecoveryStatus;
}> {
  const data = await findRoutineWithPrescribedExercises(routineId, userId);
  if (!data) {
    throw new OverloadResourceNotFoundError(
      'Workout routine not found or not owned by authenticated user',
    );
  }

  const recommendations: ProgressionRecommendation[] = [];

  for (const item of data.exercises) {
    const recentSets = await findRecentSetsForExercise(
      item.exercise.id,
      userId,
      item.routineExercise.id,
    );

    const rec = calculateExerciseProgression({
      routineExercise: item.routineExercise,
      exercise: item.exercise,
      recentSets,
    });

    recommendations.push(rec);
  }

  const recentSessions = await findRecentSessionsForRecovery(userId, 10);
  const recoveryStatus = calculateSystemicRecovery({ recentSessions });

  return {
    routineId: data.routine.id,
    routineName: data.routine.name,
    recommendations,
    recoveryStatus,
  };
}

/**
 * Applies approved progression parameters to a single routine exercise.
 */
export async function applyProgressionToExercise(
  routineExerciseId: string,
  userId: string,
  input: ApplyProgressionInput,
): Promise<{
  routineExercise: RoutineExercise;
  applied: {
    targetWeightKg: number | null;
    targetReps: number;
    prescribedSets: number;
    targetRpe: number | null;
  };
}> {
  const row = await findRoutineExerciseWithExercise(routineExerciseId, userId);
  if (!row) {
    throw new OverloadResourceNotFoundError(
      'Routine exercise not found or not owned by authenticated user',
    );
  }

  // If parameters are omitted, derive defaults from algorithmic recommendation
  const recentSets = await findRecentSetsForExercise(
    row.exerciseId,
    userId,
    routineExerciseId,
  );
  const rec = calculateExerciseProgression({
    routineExercise: row,
    exercise: row.exercise,
    recentSets,
  });

  const targetWeightKg =
    input.targetWeightKg !== undefined ? input.targetWeightKg : rec.suggestedWeightKg;
  const targetReps =
    input.targetReps !== undefined ? input.targetReps : rec.suggestedReps;
  const prescribedSets =
    input.prescribedSets !== undefined ? input.prescribedSets : rec.suggestedSets;
  const targetRpe =
    input.targetRpe !== undefined ? input.targetRpe : rec.suggestedRpe;
  const notes = input.notes ?? rec.changeReason;

  const updated = await updateRoutineExerciseTarget(routineExerciseId, {
    targetWeightKg,
    prescribedSets,
    targetRpe,
    repRangeMin: targetReps,
    notes,
  });

  if (!updated) {
    throw new OverloadResourceNotFoundError('Failed to update routine exercise progression');
  }

  return {
    routineExercise: updated,
    applied: {
      targetWeightKg,
      targetReps,
      prescribedSets,
      targetRpe,
    },
  };
}

/**
 * Batch applies progression recommendations across an entire routine, respecting any manual overrides.
 */
export async function applyProgressionToRoutine(
  routineId: string,
  userId: string,
  input: ApplyRoutineProgressionInput,
): Promise<{
  routineId: string;
  updatedCount: number;
  updatedExercises: RoutineExercise[];
}> {
  const data = await findRoutineWithPrescribedExercises(routineId, userId);
  if (!data) {
    throw new OverloadResourceNotFoundError(
      'Workout routine not found or not owned by authenticated user',
    );
  }

  const overridesMap = new Map(
    (input.overrides ?? []).map((o) => [o.routineExerciseId, o]),
  );

  const updatesPayload: Array<{
    id: string;
    data: {
      targetWeightKg: number | null;
      targetRpe: number | null;
      prescribedSets: number;
      repRangeMin: number;
      notes: string;
    };
  }> = [];

  for (const item of data.exercises) {
    const override = overridesMap.get(item.routineExercise.id);
    const recentSets = await findRecentSetsForExercise(
      item.exercise.id,
      userId,
      item.routineExercise.id,
    );
    const rec = calculateExerciseProgression({
      routineExercise: item.routineExercise,
      exercise: item.exercise,
      recentSets,
    });

    const targetWeightKg =
      override?.targetWeightKg !== undefined ? override.targetWeightKg : rec.suggestedWeightKg;
    const targetReps =
      override?.targetReps !== undefined ? override.targetReps : rec.suggestedReps;
    const prescribedSets =
      override?.prescribedSets !== undefined ? override.prescribedSets : rec.suggestedSets;
    const targetRpe =
      override?.targetRpe !== undefined ? override.targetRpe : rec.suggestedRpe;

    updatesPayload.push({
      id: item.routineExercise.id,
      data: {
        targetWeightKg,
        targetRpe,
        prescribedSets,
        repRangeMin: targetReps,
        notes: rec.changeReason,
      },
    });
  }

  const updatedExercises = await batchUpdateRoutineExerciseTargets(updatesPayload);

  return {
    routineId,
    updatedCount: updatedExercises.length,
    updatedExercises,
  };
}

/**
 * Computes systemic recovery status and deload readiness from the lifter's past sessions.
 */
export async function getUserRecoveryStatus(userId: string): Promise<RecoveryStatus> {
  const recentSessions = await findRecentSessionsForRecovery(userId, 10);
  return calculateSystemicRecovery({ recentSessions });
}

/**
 * Applies a deload mesocycle adjustment across a routine (reducing load & set volume).
 */
export async function applyRoutineDeload(
  routineId: string,
  userId: string,
  input: ApplyDeloadInput,
): Promise<{
  routineId: string;
  deloadedExercisesCount: number;
  reductionPercentage: number;
  reducedSetsBy: number;
  deloadedExercises: RoutineExercise[];
}> {
  const data = await findRoutineWithPrescribedExercises(routineId, userId);
  if (!data) {
    throw new OverloadResourceNotFoundError(
      'Workout routine not found or not owned by authenticated user',
    );
  }

  const factor = 1 - input.reductionPercentage / 100;

  const updatesPayload = data.exercises.map((item) => {
    const curWeight = item.routineExercise.targetWeightKg;
    const deloadWeight =
      curWeight !== null && curWeight !== undefined
        ? Math.max(0, Math.round(curWeight * factor * 2) / 2) // rounded to nearest 0.5kg
        : null;

    const deloadSets = Math.max(1, item.routineExercise.prescribedSets - input.reduceSetsBy);

    return {
      id: item.routineExercise.id,
      data: {
        targetWeightKg: deloadWeight,
        prescribedSets: deloadSets,
        notes:
          input.notes ??
          `Deload active: -${input.reductionPercentage}% load, -${input.reduceSetsBy} set(s) for recovery.`,
      },
    };
  });

  const deloadedExercises = await batchUpdateRoutineExerciseTargets(updatesPayload);

  return {
    routineId,
    deloadedExercisesCount: deloadedExercises.length,
    reductionPercentage: input.reductionPercentage,
    reducedSetsBy: input.reduceSetsBy,
    deloadedExercises,
  };
}
