import {
  findDefaultGymProfile,
  findGymProfileById,
} from '../gymProfiles/gymProfiles.repository.js';
import { findConstraintsByUserId } from '../constraints/constraints.repository.js';
import {
  filterExercises,
  type FilterResult,
  MEDICAL_DISCLAIMER,
} from './exerciseFilter.js';
import {
  findAllActiveExercises,
  findExerciseById,
} from './exercises.repository.js';
import type { ExerciseRow, ListExercisesQuery } from './exercises.schema.js';

export interface ExerciseListResponse {
  exercises: ExerciseRow[];
  meta: {
    totalAvailable: number;
    totalMatched: number;
    excludedByEquipment: number;
    excludedByContraindications: number;
    equipmentProfileApplied: string | null;
    activeConstraintsApplied: string[];
    disclaimer: string;
  };
}

export async function listFilteredExercises(
  userId: string,
  query: ListExercisesQuery,
): Promise<ExerciseListResponse> {
  const allExercises = await findAllActiveExercises();

  // 1. Resolve gym equipment profile if requested
  let profile = null;
  if (query.useProfileEquipment) {
    if (query.gymProfileId) {
      profile = await findGymProfileById(query.gymProfileId, userId);
    } else {
      profile = await findDefaultGymProfile(userId);
    }
  }

  // 2. Resolve active user constraints if requested
  let activeConstraints: Array<{ jointArea: string; isActive: boolean }> = [];
  if (query.useActiveConstraints) {
    activeConstraints = await findConstraintsByUserId(userId, true);
  }

  // 3. Execute algorithmic filtering
  const filterRes: FilterResult = filterExercises({
    exercises: allExercises,
    gymProfile: profile,
    activeConstraints,
    excludeContraindicated: query.useActiveConstraints,
    primaryMuscleGroup: query.primaryMuscleGroup,
    movementPattern: query.movementPattern,
    search: query.search,
  });

  return {
    exercises: filterRes.compatible,
    meta: {
      totalAvailable: allExercises.length,
      totalMatched: filterRes.compatible.length,
      excludedByEquipment: filterRes.excludedByEquipmentCount,
      excludedByContraindications: filterRes.excludedByContraindicationCount,
      equipmentProfileApplied: profile ? profile.name : null,
      activeConstraintsApplied: filterRes.activeConstraintsApplied,
      disclaimer: MEDICAL_DISCLAIMER,
    },
  };
}

export async function getExerciseDetails(
  id: string,
): Promise<ExerciseRow | null> {
  return findExerciseById(id);
}
