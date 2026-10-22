import { findConstraintsByUserId } from '../constraints/constraints.repository.js';
import {
  isExerciseContraindicated,
  isExerciseEquipmentCompatible,
} from '../exercises/exerciseFilter.js';
import {
  findAllActiveExercises,
  findExerciseById,
} from '../exercises/exercises.repository.js';
import {
  findDefaultGymProfile,
  findGymProfileById,
  findGymProfilesByUserId,
} from '../gymProfiles/gymProfiles.repository.js';
import {
  findUserHistoricalBaselines,
  resolveUserBaselineBenchmarks,
} from './programs.baseline.js';
import {
  generateWorkoutProgramPlan,
  ProgramValidationError,
} from './programs.generator.js';
import {
  activateProgramById,
  deleteRoutineExerciseById,
  findProgramById,
  findProgramsByUserId,
  findRoutineByIdWithOwnership,
  findRoutineExerciseByIdWithOwnership,
  findRoutineExercisesByRoutineId,
  insertProgram,
  insertProgramWithPlan,
  insertRoutine,
  insertRoutineExercise,
  softDeleteProgramById,
  softDeleteRoutineById,
  swapRoutineExerciseById,
  updateProgramById,
  updateRoutineById,
  updateRoutineExerciseById,
  type RoutineExerciseDetail,
  type WorkoutProgramDetail,
} from './programs.repository.js';
import type {
  CreateProgramInput,
  CreateRoutineExerciseInput,
  CreateRoutineInput,
  GenerateProgramInput,
  RoutineExerciseRow,
  SmartSwapAlternativesResult,
  SwapAlternativeExercise,
  SwapRoutineExerciseInput,
  UpdateProgramInput,
  UpdateRoutineExerciseInput,
  UpdateRoutineInput,
  WorkoutProgramRow,
  WorkoutRoutineRow,
} from './programs.schema.js';

export class ProgramResourceNotFoundError extends Error {
  public readonly code = 'RESOURCE_NOT_FOUND';
  public readonly statusCode = 404;

  constructor(message: string) {
    super(message);
    this.name = 'ProgramResourceNotFoundError';
  }
}

export { ProgramValidationError };

/**
 * Generates a periodized, equipment-grounded, and injury-safe workout program.
 */
export async function generatePersonalizedProgram(
  userId: string,
  input: GenerateProgramInput,
): Promise<WorkoutProgramDetail> {
  // 1. Resolve Gym Profile
  let gymProfile = null;
  if (input.gymProfileId) {
    gymProfile = await findGymProfileById(input.gymProfileId, userId);
    if (!gymProfile) {
      throw new ProgramResourceNotFoundError('Gym profile not found');
    }
  } else {
    gymProfile = await findDefaultGymProfile(userId);
    if (!gymProfile) {
      const userProfiles = await findGymProfilesByUserId(userId);
      gymProfile = userProfiles[0] ?? null;
    }
  }

  // 2. Resolve Active Constraints
  const activeConstraints = await findConstraintsByUserId(userId, true);

  // 3. Resolve Exercise Catalog
  const allExercises = await findAllActiveExercises();

  // 4. Resolve Baseline Strength Benchmarks (explicit inputs + historical workout logs)
  const historicalBaselines = await findUserHistoricalBaselines(userId);
  const resolvedBaselines = resolveUserBaselineBenchmarks(
  input.baselineLifts,
  historicalBaselines,
);

  // 5. Run Algorithmic Generation with Baseline Seeding
  const plan = generateWorkoutProgramPlan({
  input,
  exercises: allExercises,
  gymProfile,
  activeConstraints,
  baselines: resolvedBaselines,
});

  // 6. Persist Atomically
  return await insertProgramWithPlan(userId, plan);
}

export async function createCustomProgram(
  userId: string,
  input: CreateProgramInput,
): Promise<WorkoutProgramRow> {
  if (input.gymProfileId) {
    const gymProfile = await findGymProfileById(input.gymProfileId, userId);
    if (!gymProfile) {
      throw new ProgramResourceNotFoundError('Gym profile not found');
    }
  }

  return await insertProgram(userId, input);
}

export async function listUserPrograms(
  userId: string,
  isActive?: boolean,
): Promise<WorkoutProgramRow[]> {
  return await findProgramsByUserId(userId, isActive);
}

export async function getUserProgramById(
  id: string,
  userId: string,
): Promise<WorkoutProgramDetail | null> {
  return await findProgramById(id, userId);
}

export async function updateUserProgram(
  id: string,
  userId: string,
  input: UpdateProgramInput,
): Promise<WorkoutProgramRow | null> {
  if (input.gymProfileId) {
    const gymProfile = await findGymProfileById(input.gymProfileId, userId);
    if (!gymProfile) {
      throw new ProgramResourceNotFoundError('Gym profile not found');
    }
  }

  return await updateProgramById(id, userId, input);
}

export async function deleteUserProgram(
  id: string,
  userId: string,
): Promise<boolean> {
  return await softDeleteProgramById(id, userId);
}

export async function activateUserProgram(
  id: string,
  userId: string,
): Promise<WorkoutProgramRow | null> {
  return await activateProgramById(id, userId);
}

// ---------------------------------------------------------------------------
// Routine Services
// ---------------------------------------------------------------------------

export async function addRoutineToProgram(
  programId: string,
  userId: string,
  input: CreateRoutineInput,
): Promise<WorkoutRoutineRow> {
  const program = await findProgramById(programId, userId);
  if (!program) {
    throw new ProgramResourceNotFoundError('Workout program not found');
  }

  return await insertRoutine(programId, input);
}

export async function updateRoutine(
  programId: string,
  routineId: string,
  userId: string,
  input: UpdateRoutineInput,
): Promise<WorkoutRoutineRow> {
  const routine = await findRoutineByIdWithOwnership(routineId, userId);
  if (!routine || routine.programId !== programId) {
    throw new ProgramResourceNotFoundError('Routine not found in this program');
  }

  const updated = await updateRoutineById(routineId, input);
  if (!updated) {
    throw new ProgramResourceNotFoundError('Routine not found');
  }

  return updated;
}

export async function deleteRoutine(
  programId: string,
  routineId: string,
  userId: string,
): Promise<boolean> {
  const routine = await findRoutineByIdWithOwnership(routineId, userId);
  if (!routine || routine.programId !== programId) {
    throw new ProgramResourceNotFoundError('Routine not found in this program');
  }

  return await softDeleteRoutineById(routineId);
}

// ---------------------------------------------------------------------------
// Routine Exercise Services & Exercise Swapping
// ---------------------------------------------------------------------------

export async function addExerciseToRoutine(
  routineId: string,
  userId: string,
  input: CreateRoutineExerciseInput,
): Promise<RoutineExerciseRow> {
  const routine = await findRoutineByIdWithOwnership(routineId, userId);
  if (!routine) {
    throw new ProgramResourceNotFoundError('Routine not found');
  }

  const exercise = await findExerciseById(input.exerciseId);
  if (!exercise) {
    throw new ProgramResourceNotFoundError('Exercise not found in catalog');
  }

  return await insertRoutineExercise(routineId, input);
}

export async function updateRoutineExercise(
  routineId: string,
  routineExerciseId: string,
  userId: string,
  input: UpdateRoutineExerciseInput,
): Promise<RoutineExerciseRow> {
  const re = await findRoutineExerciseByIdWithOwnership(routineExerciseId, userId);
  if (!re || re.routineId !== routineId) {
    throw new ProgramResourceNotFoundError('Prescribed exercise not found in routine');
  }

  const updated = await updateRoutineExerciseById(routineExerciseId, input);
  if (!updated) {
    throw new ProgramResourceNotFoundError('Prescribed exercise not found');
  }

  return updated;
}

export async function deleteRoutineExercise(
  routineId: string,
  routineExerciseId: string,
  userId: string,
): Promise<boolean> {
  const re = await findRoutineExerciseByIdWithOwnership(routineExerciseId, userId);
  if (!re || re.routineId !== routineId) {
    throw new ProgramResourceNotFoundError('Prescribed exercise not found in routine');
  }

  return await deleteRoutineExerciseById(routineExerciseId);
}

/**
 * Performs a smart, safe exercise swap.
 * Verifies that the replacement exercise exists and is safe against the user's
 * equipment and active injury constraints.
 */
export async function swapRoutineExercise(
  routineId: string,
  routineExerciseId: string,
  userId: string,
  input: SwapRoutineExerciseInput,
): Promise<RoutineExerciseRow> {
  const re = await findRoutineExerciseByIdWithOwnership(routineExerciseId, userId);
  if (!re || re.routineId !== routineId) {
    throw new ProgramResourceNotFoundError('Prescribed exercise not found in routine');
  }

  const replacement = await findExerciseById(input.replacementExerciseId);
  if (!replacement) {
    throw new ProgramResourceNotFoundError('Replacement exercise not found in catalog');
  }

  // Verify against active physical constraints
  const activeConstraints = await findConstraintsByUserId(userId, true);
  const isContra = isExerciseContraindicated(
    replacement.contraindicatedInjuries,
    activeConstraints,
  );

  if (isContra) {
    throw new ProgramValidationError(
      `Replacement exercise "${replacement.name}" is contraindicated by your active physical sensitivity: ${replacement.contraindicatedInjuries.join(', ')}`,
    );
  }

  // Verify against gym profile equipment if attached
  if (re.gymProfileId) {
    const gymProfile = await findGymProfileById(re.gymProfileId, userId);
    if (gymProfile) {
      const isEquipOk = isExerciseEquipmentCompatible(replacement, gymProfile);
      if (!isEquipOk) {
        throw new ProgramValidationError(
          `Replacement exercise "${replacement.name}" requires ${replacement.requiredEquipment}, which is not available in your gym profile.`,
        );
      }
    }
  }

  const updated = await swapRoutineExerciseById(
    routineExerciseId,
    input.replacementExerciseId,
    input.reason,
  );

  if (!updated) {
    throw new ProgramResourceNotFoundError('Failed to swap prescribed exercise');
  }

  return updated;
}

/**
 * Returns up to 3 smart machine swap replacement alternatives for an occupied exercise.
 * Evaluates primary muscle groups, movement patterns, gym hardware profile,
 * and user active injury constraints, while excluding exercises already in the routine.
 */
export async function getSmartSwapAlternatives(
  routineId: string,
  routineExerciseId: string,
  userId: string,
): Promise<SmartSwapAlternativesResult> {
  // 1. Verify routine exercise ownership and routine association
  const re = await findRoutineExerciseByIdWithOwnership(routineExerciseId, userId);
  if (!re || re.routineId !== routineId) {
    throw new ProgramResourceNotFoundError('Prescribed exercise not found in routine');
  }

  // 2. Fetch original exercise details
  const currentExercise = await findExerciseById(re.exerciseId);
  if (!currentExercise) {
    throw new ProgramResourceNotFoundError('Prescribed exercise details not found');
  }

  // 3. Resolve active gym equipment profile
  let gymProfile = null;
  if (re.gymProfileId) {
    gymProfile = await findGymProfileById(re.gymProfileId, userId);
  } else {
    gymProfile = await findDefaultGymProfile(userId);
    if (!gymProfile) {
      const userProfiles = await findGymProfilesByUserId(userId);
      gymProfile = userProfiles[0] ?? null;
    }
  }

  // 4. Resolve active physical injury constraints
  const activeConstraints = await findConstraintsByUserId(userId, true);

  // 5. Query all exercises already in this routine to avoid duplicate prescriptions
  const routineRows = await findRoutineExercisesByRoutineId(routineId);
  const existingExerciseIds = new Set(routineRows.map((r) => r.exerciseId));
  // Ensure the current exercise is excluded
  existingExerciseIds.add(currentExercise.id);

  // 6. Fetch full catalog of active exercises
  const allExercises = await findAllActiveExercises();

  // 7. Filter and rank alternatives
  const currentMuscle = currentExercise.primaryMuscleGroup.toLowerCase().trim();
  const currentPattern = currentExercise.movementPattern.toLowerCase().trim();
  const currentSecondary = (currentExercise.secondaryMuscleGroups ?? []).map((m) =>
    m.toLowerCase().trim(),
  );

  interface ScoredCandidate {
    exercise: (typeof allExercises)[0];
    score: number;
    matchType: 'exact_match' | 'movement_pattern_match' | 'muscle_group_match' | 'synergist_match';
    matchReason: string;
  }

  const scoredCandidates: ScoredCandidate[] = [];

  for (const ex of allExercises) {
    // Exclude exercises already in this routine (including original exercise)
    if (existingExerciseIds.has(ex.id)) {
      continue;
    }

    // Check equipment compatibility
    if (gymProfile) {
      const isEquipOk = isExerciseEquipmentCompatible(ex, gymProfile);
      if (!isEquipOk) {
        continue;
      }
    }

    // Check active injury contraindications
    if (activeConstraints.length > 0) {
      const isContra = isExerciseContraindicated(ex.contraindicatedInjuries, activeConstraints);
      if (isContra) {
        continue;
      }
    }

    const candMuscle = ex.primaryMuscleGroup.toLowerCase().trim();
    const candPattern = ex.movementPattern.toLowerCase().trim();
    const candSecondary = (ex.secondaryMuscleGroups ?? []).map((m) =>
      m.toLowerCase().trim(),
    );

    const sameMuscle = candMuscle === currentMuscle;
    const samePattern = candPattern === currentPattern;
    const secondaryOverlap =
      candSecondary.includes(currentMuscle) ||
      currentSecondary.includes(candMuscle) ||
      candSecondary.some((m) => currentSecondary.includes(m));

    let score = 0;
    let matchType: ScoredCandidate['matchType'] = 'synergist_match';
    let matchReason = '';

    if (sameMuscle && samePattern) {
      score = 100;
      matchType = 'exact_match';
      matchReason = `Exact match: Targets ${ex.primaryMuscleGroup} with identical ${ex.movementPattern} movement pattern using available ${ex.requiredEquipment}.`;
    } else if (samePattern) {
      score = 75;
      matchType = 'movement_pattern_match';
      matchReason = `Movement pattern match: Shares ${ex.movementPattern} pattern, targeting ${ex.primaryMuscleGroup} using available ${ex.requiredEquipment}.`;
    } else if (sameMuscle) {
      score = 60;
      matchType = 'muscle_group_match';
      matchReason = `Muscle group match: Targets ${ex.primaryMuscleGroup} with ${ex.movementPattern} pattern using available ${ex.requiredEquipment}.`;
    } else if (secondaryOverlap) {
      score = 40;
      matchType = 'synergist_match';
      matchReason = `Synergist match: Engages shared muscle groups using available ${ex.requiredEquipment}.`;
    } else {
      // Not a biomechanically suitable swap candidate
      continue;
    }

    scoredCandidates.push({
      exercise: ex,
      score,
      matchType,
      matchReason,
    });
  }

  // Sort candidates by score descending, then alphabetical name for deterministic order
  scoredCandidates.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.exercise.name.localeCompare(b.exercise.name);
  });

  // Pick top 3 candidates
  const topCandidates = scoredCandidates.slice(0, 3);

  const alternatives: SwapAlternativeExercise[] = topCandidates.map((c) => ({
    id: c.exercise.id,
    name: c.exercise.name,
    primaryMuscleGroup: c.exercise.primaryMuscleGroup,
    secondaryMuscleGroups: c.exercise.secondaryMuscleGroups,
    movementPattern: c.exercise.movementPattern,
    requiredEquipment: c.exercise.requiredEquipment,
    instructions: c.exercise.instructions,
    matchType: c.matchType,
    matchScore: c.score,
    matchReason: c.matchReason,
    swapPayload: {
      replacementExerciseId: c.exercise.id,
      reason: `Machine busy: swapped to ${c.exercise.name} (${c.exercise.requiredEquipment})`,
    },
  }));

  return {
    routineId,
    routineExerciseId,
    currentExercise: {
      id: currentExercise.id,
      name: currentExercise.name,
      primaryMuscleGroup: currentExercise.primaryMuscleGroup,
      secondaryMuscleGroups: currentExercise.secondaryMuscleGroups,
      movementPattern: currentExercise.movementPattern,
      requiredEquipment: currentExercise.requiredEquipment,
      prescribedSets: re.prescribedSets,
      repRangeMin: re.repRangeMin,
      repRangeMax: re.repRangeMax,
      targetWeightKg: re.targetWeightKg,
      targetRpe: re.targetRpe,
    },
    gymProfile: gymProfile
      ? {
        id: gymProfile.id,
        name: gymProfile.name,
        environmentType: gymProfile.environmentType,
      }
      : null,
    activeConstraintsCount: activeConstraints.length,
    alternatives,
    totalFound: alternatives.length,
    message:
      alternatives.length === 0
        ? 'No suitable replacement exercises found that match your available equipment and injury restrictions.'
        : undefined,
  };
}
