import type { Exercise, GymProfile, UserConstraint } from '../../db/schema.js';

export const MEDICAL_DISCLAIMER =
  'DISCLAIMER: Exercise compatibility filtering is an algorithmic heuristic based on equipment inventories and user-flagged movement restrictions. It does not provide medical evaluation, physical therapy advice, or injury clearance.';

export type EquipmentState = Pick<
  GymProfile,
  | 'environmentType'
  | 'hasBarbell'
  | 'hasSquatRack'
  | 'hasBench'
  | 'hasCableStack'
  | 'hasSmithMachine'
  | 'hasPullupBar'
  | 'hasAdjustableBench'
  | 'hasDumbbells'
  | 'maxDumbbellWeightKg'
>;

/**
 * Checks whether an exercise can be performed with the available gym equipment.
 */
export function isExerciseEquipmentCompatible(
  exercise: Pick<Exercise, 'name' | 'requiredEquipment' | 'movementPattern'>,
  equipment: EquipmentState,
): boolean {
  const req = exercise.requiredEquipment.toLowerCase().trim();
  const name = exercise.name.toLowerCase();

  switch (req) {
    case 'bodyweight':
      return true;

    case 'barbell': {
      if (!equipment.hasBarbell) {
        return false;
      }
      // Squat movements with a barbell require a squat rack
      if (exercise.movementPattern === 'squat' && !equipment.hasSquatRack) {
        return false;
      }
      // Bench presses require a bench
      if (name.includes('bench') && !equipment.hasBench && !equipment.hasAdjustableBench) {
        return false;
      }
      return true;
    }

    case 'dumbbell': {
      if (!equipment.hasDumbbells) {
        return false;
      }
      // Incline or bench-supported dumbbell movements require a bench
      if (
        (name.includes('bench') || name.includes('incline') || name.includes('supported')) &&
        !equipment.hasBench &&
        !equipment.hasAdjustableBench
      ) {
        return false;
      }
      return true;
    }

    case 'cable':
      return equipment.hasCableStack;

    case 'pullup_bar':
      return equipment.hasPullupBar;

    case 'machine':
      // Commercial gyms generally feature full machine circuits
      if (equipment.environmentType === 'commercial') {
        return true;
      }
      return equipment.hasSmithMachine || equipment.hasCableStack;

    case 'bench':
      return equipment.hasBench || equipment.hasAdjustableBench;

    default:
      return false;
  }
}

/**
 * Normalizes an injury or constraint string for conservative matching.
 * e.g., "lower back", "lower-back", "LOWER_BACK" -> "lower_back"
 */
export function normalizeInjuryTag(tag: string): string {
  return tag.toLowerCase().trim().replace(/[\s-]+/g, '_');
}

/**
 * Checks if an exercise is contraindicated for a user with given active constraints.
 * Conservative rule: Any overlap between the exercise's contraindicatedInjuries and
 * the user's active joint restrictions causes the exercise to be flagged as contraindicated.
 */
export function isExerciseContraindicated(
  contraindicatedInjuries: string[],
  activeConstraints: Array<Pick<UserConstraint, 'jointArea' | 'isActive'>>,
): boolean {
  if (!contraindicatedInjuries || contraindicatedInjuries.length === 0) {
    return false;
  }

  const activeAreas = activeConstraints
    .filter((c) => c.isActive)
    .map((c) => normalizeInjuryTag(c.jointArea));

  if (activeAreas.length === 0) {
    return false;
  }

  const normalizedContras = contraindicatedInjuries.map(normalizeInjuryTag);

  return normalizedContras.some((contra) => {
    return activeAreas.some((userArea) => {
      // Direct exact match
      if (contra === userArea) return true;

      // Substring matching: e.g. user area "shoulder" matches "shoulder_impingement"
      // user area "knee" matches "knee_pain"
      // user area "back" matches "lower_back"
      if (contra.includes(userArea) || userArea.includes(contra)) {
        return true;
      }

      return false;
    });
  });
}

export interface FilterExercisesOptions {
  exercises: Exercise[];
  gymProfile?: EquipmentState | null;
  activeConstraints?: Array<Pick<UserConstraint, 'jointArea' | 'isActive'>>;
  excludeContraindicated?: boolean;
  primaryMuscleGroup?: string;
  movementPattern?: string;
  search?: string;
}

export interface FilterResult {
  compatible: Exercise[];
  excludedCount: number;
  excludedByEquipmentCount: number;
  excludedByContraindicationCount: number;
  activeConstraintsApplied: string[];
  disclaimer: string;
}

/**
 * Reusable exercise filtering pipeline for Program Generation, Machine Swap, and API queries.
 */
export function filterExercises(options: FilterExercisesOptions): FilterResult {
  const {
    exercises,
    gymProfile,
    activeConstraints = [],
    excludeContraindicated = true,
    primaryMuscleGroup,
    movementPattern,
    search,
  } = options;

  let excludedByEquipment = 0;
  let excludedByContraindication = 0;

  const activeConstraintAreas = activeConstraints
    .filter((c) => c.isActive)
    .map((c) => normalizeInjuryTag(c.jointArea));

  const filtered = exercises.filter((ex) => {
    // 1. Text search filter
    if (search && !ex.name.toLowerCase().includes(search.toLowerCase().trim())) {
      return false;
    }

    // 2. Primary muscle group filter
    if (
      primaryMuscleGroup &&
      ex.primaryMuscleGroup.toLowerCase() !== primaryMuscleGroup.toLowerCase().trim()
    ) {
      return false;
    }

    // 3. Movement pattern filter
    if (
      movementPattern &&
      ex.movementPattern.toLowerCase() !== movementPattern.toLowerCase().trim()
    ) {
      return false;
    }

    // 4. Equipment compatibility check
    if (gymProfile) {
      const isEquipOk = isExerciseEquipmentCompatible(ex, gymProfile);
      if (!isEquipOk) {
        excludedByEquipment++;
        return false;
      }
    }

    // 5. Conservative injury contraindication check
    if (excludeContraindicated && activeConstraintAreas.length > 0) {
      const isContra = isExerciseContraindicated(ex.contraindicatedInjuries, activeConstraints);
      if (isContra) {
        excludedByContraindication++;
        return false;
      }
    }

    return true;
  });

  return {
    compatible: filtered,
    excludedCount: excludedByEquipment + excludedByContraindication,
    excludedByEquipmentCount: excludedByEquipment,
    excludedByContraindicationCount: excludedByContraindication,
    activeConstraintsApplied: activeConstraintAreas,
    disclaimer: MEDICAL_DISCLAIMER,
  };
}
