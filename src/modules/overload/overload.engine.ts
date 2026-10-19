import type { Exercise, RoutineExercise, WorkoutSession, WorkoutSetLog } from '../../db/schema.js';

export type ProgressionAction =
  | 'increase_weight'
  | 'increase_reps'
  | 'maintain'
  | 'deload_weight'
  | 'deload_volume';

export interface RecentLogsSummary {
  setsCount: number;
  averageWeightKg: number;
  averageReps: number;
  averageRpe: number | null;
  successRate: number;
}

export interface ProgressionRecommendation {
  routineExerciseId: string;
  exerciseId: string;
  exerciseName: string;
  primaryMuscleGroup: string;
  movementPattern: string;
  currentWeightKg: number | null;
  currentRepsMin: number;
  currentRepsMax: number;
  currentPrescribedSets: number;
  suggestedWeightKg: number | null;
  suggestedReps: number;
  suggestedSets: number;
  suggestedRpe: number;
  action: ProgressionAction;
  changeReason: string;
  confidenceScore: number;
  recentLogsSummary: RecentLogsSummary;
}

export interface RecoveryStatus {
  readinessScore: number; // 0 to 100
  fatigueLevel: 'low' | 'moderate' | 'high' | 'severe';
  averageJointSoreness: number; // 0 to 10
  jointSorenessRisk: 'low' | 'caution' | 'high_risk';
  averageSessionRpe: number;
  shouldDeload: boolean;
  deloadType: 'none' | 'intensity' | 'volume' | 'full';
  daysSinceLastWorkout: number;
  coachingNotes: string;
}

/**
 * Determines weight increment based on movement pattern and muscle group.
 * Lower body compounds increment faster (+2.5 to +5.0kg) than upper isolation (+1.0 to +2.5kg).
 */
export function getRecommendedWeightIncrement(
  exercise: Pick<Exercise, 'primaryMuscleGroup' | 'movementPattern'>,
  currentWeightKg: number | null,
): number {
  const currentWeight = currentWeightKg ?? 20;
  const pattern = exercise.movementPattern.toLowerCase();
  const muscle = exercise.primaryMuscleGroup.toLowerCase();

  const isLowerCompound =
    pattern.includes('squat') ||
    pattern.includes('deadlift') ||
    pattern.includes('hinge') ||
    pattern.includes('lunge') ||
    muscle.includes('quads') ||
    muscle.includes('hamstrings') ||
    muscle.includes('glutes');

  if (isLowerCompound) {
    return currentWeight >= 100 ? 5.0 : 2.5;
  }

  const isUpperCompound =
    pattern.includes('push') ||
    pattern.includes('pull') ||
    muscle.includes('chest') ||
    muscle.includes('back') ||
    muscle.includes('lats');

  if (isUpperCompound) {
    return currentWeight >= 60 ? 2.5 : 1.25;
  }

  // Isolation exercises (curls, lateral raises, triceps extensions)
  return 1.0;
}

/**
 * Scientific double progression calculation for a single routine exercise
 * based on working sets logged in recent sessions.
 */
export function calculateExerciseProgression(params: {
  routineExercise: Pick<
    RoutineExercise,
    | 'id'
    | 'exerciseId'
    | 'prescribedSets'
    | 'repRangeMin'
    | 'repRangeMax'
    | 'targetWeightKg'
    | 'targetRpe'
  >;
  exercise: Pick<
    Exercise,
    'id' | 'name' | 'primaryMuscleGroup' | 'movementPattern'
  >;
  recentSets: Array<
    Pick<
      WorkoutSetLog,
      'actualWeightKg' | 'actualReps' | 'rpe' | 'targetHit' | 'isWarmup'
    >
  >;
}): ProgressionRecommendation {
  const { routineExercise, exercise, recentSets } = params;

  const currentWeightKg = routineExercise.targetWeightKg ?? null;
  const repRangeMin = routineExercise.repRangeMin;
  const repRangeMax = routineExercise.repRangeMax;
  const prescribedSets = routineExercise.prescribedSets;
  const targetRpe = routineExercise.targetRpe ?? 8.0;

  // Filter for working sets only (ignore warmups)
  const workingSets = recentSets.filter((s) => !s.isWarmup);

  // If no previous working set history exists, return baseline recommendation
  if (workingSets.length === 0) {
    return {
      routineExerciseId: routineExercise.id,
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      primaryMuscleGroup: exercise.primaryMuscleGroup,
      movementPattern: exercise.movementPattern,
      currentWeightKg,
      currentRepsMin: repRangeMin,
      currentRepsMax: repRangeMax,
      currentPrescribedSets: prescribedSets,
      suggestedWeightKg: currentWeightKg,
      suggestedReps: repRangeMin,
      suggestedSets: prescribedSets,
      suggestedRpe: targetRpe,
      action: 'maintain',
      changeReason: `Initial baseline session. Calibrate starting weight around ${currentWeightKg ?? 'bodyweight'} kg and track RPE.`,
      confidenceScore: 0.5,
      recentLogsSummary: {
        setsCount: 0,
        averageWeightKg: currentWeightKg ?? 0,
        averageReps: 0,
        averageRpe: null,
        successRate: 0,
      },
    };
  }

  // Aggregate set metrics
  const totalWeight = workingSets.reduce((sum, s) => sum + s.actualWeightKg, 0);
  const totalReps = workingSets.reduce((sum, s) => sum + s.actualReps, 0);
  const setsWithRpe = workingSets.filter((s) => s.rpe !== null && s.rpe !== undefined);
  const totalRpe = setsWithRpe.reduce((sum, s) => sum + Number(s.rpe), 0);
  const targetHits = workingSets.filter((s) => s.targetHit).length;

  const averageWeightKg = Math.round((totalWeight / workingSets.length) * 100) / 100;
  const averageReps = Math.round((totalReps / workingSets.length) * 10) / 10;
  const averageRpe =
    setsWithRpe.length > 0 ? Math.round((totalRpe / setsWithRpe.length) * 10) / 10 : null;
  const successRate = Math.round((targetHits / workingSets.length) * 100) / 100;

  const summary: RecentLogsSummary = {
    setsCount: workingSets.length,
    averageWeightKg,
    averageReps,
    averageRpe,
    successRate,
  };

  const effectiveWeight = currentWeightKg ?? averageWeightKg;
  const increment = getRecommendedWeightIncrement(exercise, effectiveWeight);

  // -------------------------------------------------------------------------
  // Double Progression Rule Evaluation
  // -------------------------------------------------------------------------

  // Condition 1: Hit top of rep range across all sets at or under target RPE -> Increase Weight
  const allSetsHitMaxReps = workingSets.every((s) => s.actualReps >= repRangeMax);
  const avgRpeAcceptable = averageRpe === null || averageRpe <= targetRpe + 0.5;

  if ((allSetsHitMaxReps || averageReps >= repRangeMax) && avgRpeAcceptable) {
    const suggestedWeightKg = Math.round((effectiveWeight + increment) * 100) / 100;
    return {
      routineExerciseId: routineExercise.id,
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      primaryMuscleGroup: exercise.primaryMuscleGroup,
      movementPattern: exercise.movementPattern,
      currentWeightKg,
      currentRepsMin: repRangeMin,
      currentRepsMax: repRangeMax,
      currentPrescribedSets: prescribedSets,
      suggestedWeightKg,
      suggestedReps: repRangeMin, // Reset to bottom of rep range for double progression
      suggestedSets: prescribedSets,
      suggestedRpe: targetRpe,
      action: 'increase_weight',
      changeReason: `Hit rep ceiling (${repRangeMax} reps) across working sets at manageable exertion (RPE ${averageRpe ?? targetRpe}). Progress weight by +${increment} kg and reset to ${repRangeMin} reps.`,
      confidenceScore: 0.95,
      recentLogsSummary: summary,
    };
  }

  // Condition 2: Inside rep range with good form & manageable RPE -> Add Reps
  if (averageReps >= repRangeMin && averageReps < repRangeMax && avgRpeAcceptable) {
    const nextReps = Math.min(repRangeMax, Math.round(averageReps) + 1);
    return {
      routineExerciseId: routineExercise.id,
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      primaryMuscleGroup: exercise.primaryMuscleGroup,
      movementPattern: exercise.movementPattern,
      currentWeightKg,
      currentRepsMin: repRangeMin,
      currentRepsMax: repRangeMax,
      currentPrescribedSets: prescribedSets,
      suggestedWeightKg: effectiveWeight,
      suggestedReps: nextReps,
      suggestedSets: prescribedSets,
      suggestedRpe: targetRpe,
      action: 'increase_reps',
      changeReason: `Completed an average of ${averageReps} reps within prescribed ${repRangeMin}–${repRangeMax} range. Maintain ${effectiveWeight} kg and aim for +1 rep per set (${nextReps} reps).`,
      confidenceScore: 0.9,
      recentLogsSummary: summary,
    };
  }

  // Condition 3: Completed minimum reps but RPE is high (straining at limit) -> Maintain & Solidify
  if (averageReps >= repRangeMin && averageRpe !== null && averageRpe > targetRpe + 0.5) {
    return {
      routineExerciseId: routineExercise.id,
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      primaryMuscleGroup: exercise.primaryMuscleGroup,
      movementPattern: exercise.movementPattern,
      currentWeightKg,
      currentRepsMin: repRangeMin,
      currentRepsMax: repRangeMax,
      currentPrescribedSets: prescribedSets,
      suggestedWeightKg: effectiveWeight,
      suggestedReps: Math.round(averageReps),
      suggestedSets: prescribedSets,
      suggestedRpe: targetRpe,
      action: 'maintain',
      changeReason: `High perceived exertion recorded (RPE ${averageRpe} vs target ${targetRpe}). Consolidate current load at ${effectiveWeight} kg to build technical proficiency before pushing volume.`,
      confidenceScore: 0.85,
      recentLogsSummary: summary,
    };
  }

  // Condition 4: Failed to meet minimum prescribed reps -> Deload weight by 10%
  const missedRepTarget = averageReps < repRangeMin;
  if (missedRepTarget && effectiveWeight > 0) {
    const reducedWeight = Math.max(0, Math.round(effectiveWeight * 0.9 * 2) / 2); // 10% drop rounded to 0.5kg
    return {
      routineExerciseId: routineExercise.id,
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      primaryMuscleGroup: exercise.primaryMuscleGroup,
      movementPattern: exercise.movementPattern,
      currentWeightKg,
      currentRepsMin: repRangeMin,
      currentRepsMax: repRangeMax,
      currentPrescribedSets: prescribedSets,
      suggestedWeightKg: reducedWeight,
      suggestedReps: repRangeMin,
      suggestedSets: prescribedSets,
      suggestedRpe: targetRpe,
      action: 'deload_weight',
      changeReason: `Averaged ${averageReps} reps, falling below minimum target (${repRangeMin} reps). Recommended 10% weight drop to ${reducedWeight} kg to re-establish clean movement pathways.`,
      confidenceScore: 0.88,
      recentLogsSummary: summary,
    };
  }

  // Fallback: Maintain current setup
  return {
    routineExerciseId: routineExercise.id,
    exerciseId: exercise.id,
    exerciseName: exercise.name,
    primaryMuscleGroup: exercise.primaryMuscleGroup,
    movementPattern: exercise.movementPattern,
    currentWeightKg,
    currentRepsMin: repRangeMin,
    currentRepsMax: repRangeMax,
    currentPrescribedSets: prescribedSets,
    suggestedWeightKg: effectiveWeight,
    suggestedReps: Math.round(averageReps) || repRangeMin,
    suggestedSets: prescribedSets,
    suggestedRpe: targetRpe,
    action: 'maintain',
    changeReason: `Performance aligned with current expectations. Maintain current load and focus on execution.`,
    confidenceScore: 0.8,
    recentLogsSummary: summary,
  };
}

/**
 * Computes systemic recovery status, fatigue accumulation, joint soreness markers,
 * and determines whether a deload is scientifically recommended.
 */
export function calculateSystemicRecovery(params: {
  recentSessions: Array<
    Pick<
      WorkoutSession,
      'startedAt' | 'completedAt' | 'perceivedRpe' | 'jointSoreness' | 'status'
    >
  >;
}): RecoveryStatus {
  const { recentSessions } = params;

  if (recentSessions.length === 0) {
    return {
      readinessScore: 90,
      fatigueLevel: 'low',
      averageJointSoreness: 0,
      jointSorenessRisk: 'low',
      averageSessionRpe: 7.0,
      shouldDeload: false,
      deloadType: 'none',
      daysSinceLastWorkout: 0,
      coachingNotes: 'No prior workout history recorded. Optimal fresh recovery state ready to begin training.',
    };
  }

  // Calculate days since last workout
  const latestSession = recentSessions[0];
  const lastSessionDate = latestSession.completedAt ?? latestSession.startedAt;
  const hoursSinceLast = Math.max(
    0,
    (Date.now() - new Date(lastSessionDate).getTime()) / (1000 * 60 * 60),
  );
  const daysSinceLastWorkout = Math.round((hoursSinceLast / 24) * 10) / 10;

  // Filter completed sessions for RPE and soreness metrics
  const completedSessions = recentSessions.filter(
    (s) => s.status === 'completed' || s.status === 'in_progress',
  );

  const sorenessValues = completedSessions
    .map((s) => s.jointSoreness)
    .filter((v): v is number => v !== null && v !== undefined);

  const rpeValues = completedSessions
    .map((s) => s.perceivedRpe)
    .filter((v): v is number => v !== null && v !== undefined);

  const averageJointSoreness =
    sorenessValues.length > 0
      ? Math.round((sorenessValues.reduce((a, b) => a + b, 0) / sorenessValues.length) * 10) / 10
      : 1.0;

  const averageSessionRpe =
    rpeValues.length > 0
      ? Math.round((rpeValues.reduce((a, b) => a + b, 0) / rpeValues.length) * 10) / 10
      : 7.5;

  // -------------------------------------------------------------------------
  // Readiness Score Computation (Base 85)
  // -------------------------------------------------------------------------
  let score = 85;

  // Hours since last session factor
  if (hoursSinceLast >= 24 && hoursSinceLast <= 72) {
    score += 10; // Prime recovery window
  } else if (hoursSinceLast < 16) {
    score -= 15; // Inadequate rest window (< 16h)
  } else if (hoursSinceLast > 120) {
    score -= 5; // Long rest period (> 5 days)
  }

  // Joint Soreness penalty
  if (averageJointSoreness <= 2) {
    score += 5;
  } else if (averageJointSoreness >= 5 && averageJointSoreness < 7) {
    score -= 15;
  } else if (averageJointSoreness >= 7) {
    score -= 30; // Severe joint strain
  }

  // Session RPE exertion penalty
  if (averageSessionRpe <= 7.5) {
    score += 5;
  } else if (averageSessionRpe >= 8.5 && averageSessionRpe < 9.2) {
    score -= 10;
  } else if (averageSessionRpe >= 9.2) {
    score -= 20;
  }

  // Abandoned session check (indication of fatigue or injury)
  const abandonedCount = recentSessions.filter((s) => s.status === 'abandoned').length;
  if (abandonedCount > 0) {
    score -= abandonedCount * 10;
  }

  // Clamp score between 10 and 100
  score = Math.max(10, Math.min(100, Math.round(score)));

  // Fatigue Level Categorization
  let fatigueLevel: RecoveryStatus['fatigueLevel'] = 'low';
  if (score < 45) {
    fatigueLevel = 'severe';
  } else if (score < 65) {
    fatigueLevel = 'high';
  } else if (score < 80) {
    fatigueLevel = 'moderate';
  }

  // Joint Soreness Risk Categorization
  let jointSorenessRisk: RecoveryStatus['jointSorenessRisk'] = 'low';
  if (averageJointSoreness >= 7) {
    jointSorenessRisk = 'high_risk';
  } else if (averageJointSoreness >= 4) {
    jointSorenessRisk = 'caution';
  }

  // Deload Trigger Evaluation
  const shouldDeload =
    averageJointSoreness >= 6.5 ||
    (averageSessionRpe >= 8.8 && recentSessions.length >= 3) ||
    score < 50;

  let deloadType: RecoveryStatus['deloadType'] = 'none';
  if (shouldDeload) {
    if (averageJointSoreness >= 7 && averageSessionRpe >= 8.8) {
      deloadType = 'full';
    } else if (averageJointSoreness >= 6.5) {
      deloadType = 'intensity';
    } else {
      deloadType = 'volume';
    }
  }

  // Coaching Notes Synthesis
  let coachingNotes = 'Recovery status is strong. Full capacity for progressive overload in your next session.';
  if (shouldDeload) {
    if (deloadType === 'full') {
      coachingNotes = `High accumulated fatigue (RPE ${averageSessionRpe}) and elevated joint soreness (${averageJointSoreness}/10). Full deload recommended: reduce working sets by 40% and load by 15% for one week.`;
    } else if (deloadType === 'intensity') {
      coachingNotes = `Joint sensitivity detected (${averageJointSoreness}/10). Intensity deload recommended: reduce working load by 10%–15% while holding rep volume to protect connective tissues.`;
    } else {
      coachingNotes = `Exertion levels trending high (RPE ${averageSessionRpe}). Volume deload recommended: reduce total working sets by 1–2 sets per movement to disperse systemic fatigue.`;
    }
  } else if (fatigueLevel === 'moderate') {
    coachingNotes = `Moderate fatigue accumulation. Ensure proper warmups and hydrate adequately. Keep working sets at prescribed RPE.`;
  }

  return {
    readinessScore: score,
    fatigueLevel,
    averageJointSoreness,
    jointSorenessRisk,
    averageSessionRpe,
    shouldDeload,
    deloadType,
    daysSinceLastWorkout,
    coachingNotes,
  };
}
