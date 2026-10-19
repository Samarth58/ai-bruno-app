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
import { generateWorkoutProgramPlan } from './programs.generator.js';
import {
  activateProgramById,
  deleteRoutineExerciseById,
  findProgramById,
  findProgramsByUserId,
  findRoutineByIdWithOwnership,
  findRoutineExerciseByIdWithOwnership,
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

export class ProgramValidationError extends Error {
  public readonly code = 'VALIDATION_ERROR';
  public readonly statusCode = 400;

  constructor(message: string) {
    super(message);
    this.name = 'ProgramValidationError';
  }
}

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

  // 4. Run Algorithmic Generation
  const plan = generateWorkoutProgramPlan({
    input,
    exercises: allExercises,
    gymProfile,
    activeConstraints,
  });

  // 5. Persist Atomically
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
