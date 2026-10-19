import type { Exercise, GymProfile, UserConstraint } from '../../db/schema.js';
import { filterExercises } from '../exercises/exerciseFilter.js';
import {
  seedExerciseTargetWeight,
  type BaselineStrengthBenchmark,
} from './programs.baseline.js';
import type { GenerateProgramInput } from './programs.schema.js';

export interface GeneratedRoutineExercise {
  exerciseId: string;
  exerciseName: string;
  orderIndex: number;
  prescribedSets: number;
  repRangeMin: number;
  repRangeMax: number;
  targetWeightKg?: number | null;
  targetRpe: number;
  restSeconds: number;
  notes?: string;
}

export interface GeneratedRoutine {
  name: string;
  dayNumber: number;
  description: string;
  targetRpe: number;
  exercises: GeneratedRoutineExercise[];
}

export interface GeneratedProgramPlan {
  name: string;
  splitType: 'push_pull_legs' | 'upper_lower' | 'full_body';
  trainingDaysPerWeek: number;
  durationWeeks: number;
  targetSessionDurationMinutes: number;
  gymProfileId: string | null;
  routines: GeneratedRoutine[];
}

interface RoutineTemplateSlot {
  label: string;
  targetMovementPatterns?: string[];
  targetMuscleGroups?: string[];
}

interface RoutineTemplate {
  name: string;
  description: string;
  slots: RoutineTemplateSlot[];
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
 * Science-based workout program generation engine.
 * Tailors volume, rest periods, rep ranges, and movement patterns
 * strictly to the user's available equipment and physical injury constraints.
 */
export function generateWorkoutProgramPlan(params: {
  input: GenerateProgramInput;
  exercises: Exercise[];
  gymProfile: GymProfile | null;
  activeConstraints: UserConstraint[];
  baselines?: BaselineStrengthBenchmark[];
}): GeneratedProgramPlan {
  const { input, exercises, gymProfile, activeConstraints, baselines = [] } = params;

  // 1. Run deterministic exercise safety and equipment filtering
  const filterResult = filterExercises({
    exercises,
    gymProfile,
    activeConstraints,
    excludeContraindicated: true,
  });

  const compatiblePool = filterResult.compatible;
  if (compatiblePool.length === 0) {
    throw new ProgramValidationError(
      'Unable to generate program: No compatible exercises match your current equipment and injury restrictions.',
    );
  }

  // 2. Determine volume and rep parameters based on training goal
  let repRangeMin = 8;
  let repRangeMax = 12;
  let defaultSets = 3;
  let defaultRpe = 8.0;
  let defaultRest = 90;

  switch (input.goal) {
    case 'strength':
      repRangeMin = 5;
      repRangeMax = 8;
      defaultSets = 4;
      defaultRpe = 8.5;
      defaultRest = 150;
      break;
    case 'endurance':
      repRangeMin = 12;
      repRangeMax = 15;
      defaultSets = 3;
      defaultRpe = 7.5;
      defaultRest = 60;
      break;
    case 'hypertrophy':
    default:
      repRangeMin = 8;
      repRangeMax = 12;
      defaultSets = 3;
      defaultRpe = 8.0;
      defaultRest = 90;
      break;
  }

  // 3. Determine target exercise count per session from duration
  let maxExercisesPerSession = 5;
  if (input.targetSessionDurationMinutes <= 35) {
    maxExercisesPerSession = 4;
  } else if (input.targetSessionDurationMinutes >= 60) {
    maxExercisesPerSession = 6;
  }

  // 4. Retrieve split templates
  const routineTemplates = getRoutineTemplates(input.splitType, input.trainingDaysPerWeek);

  // 5. Build routines and select exercises
  const routines: GeneratedRoutine[] = [];

  for (let i = 0; i < routineTemplates.length; i++) {
    const template = routineTemplates[i];
    const dayNumber = i + 1;
    const selectedExercisesInDay = new Set<string>();
    const routineExercisesList: GeneratedRoutineExercise[] = [];

    const activeSlots = template.slots.slice(0, maxExercisesPerSession);

    for (let slotIdx = 0; slotIdx < activeSlots.length; slotIdx++) {
      const slot = activeSlots[slotIdx];
      const match = findBestExerciseForSlot(
        compatiblePool,
        slot,
        selectedExercisesInDay,
      );

      if (match) {
        selectedExercisesInDay.add(match.id);

        const targetWeightKg =
          baselines.length > 0
            ? seedExerciseTargetWeight({
                exercise: match,
                repRangeMin,
                repRangeMax,
                baselines,
                gymProfile,
              })
            : null;

        routineExercisesList.push({
          exerciseId: match.id,
          exerciseName: match.name,
          orderIndex: slotIdx,
          prescribedSets: defaultSets,
          repRangeMin,
          repRangeMax,
          targetWeightKg,
          targetRpe: defaultRpe,
          restSeconds: defaultRest,
          notes: `${slot.label} - Focus on controlled eccentric and clean form.`,
        });
      }
    }

    routines.push({
      name: template.name,
      dayNumber,
      description: template.description,
      targetRpe: defaultRpe,
      exercises: routineExercisesList,
    });
  }

  return {
    name: input.name,
    splitType: input.splitType,
    trainingDaysPerWeek: input.trainingDaysPerWeek,
    durationWeeks: input.durationWeeks,
    targetSessionDurationMinutes: input.targetSessionDurationMinutes,
    gymProfileId: gymProfile?.id ?? null,
    routines,
  };
}

/**
 * Searches for the best compatible exercise matching the movement slot criteria.
 */
function findBestExerciseForSlot(
  pool: Exercise[],
  slot: RoutineTemplateSlot,
  alreadySelected: Set<string>,
): Exercise | null {
  // First pass: exact movement pattern or primary muscle match not yet picked
  for (const ex of pool) {
    if (alreadySelected.has(ex.id)) continue;

    if (
      slot.targetMovementPatterns &&
      slot.targetMovementPatterns.some(
        (p) => ex.movementPattern.toLowerCase() === p.toLowerCase(),
      )
    ) {
      return ex;
    }

    if (
      slot.targetMuscleGroups &&
      slot.targetMuscleGroups.some(
        (m) => ex.primaryMuscleGroup.toLowerCase() === m.toLowerCase(),
      )
    ) {
      return ex;
    }
  }

  // Second pass: any exercise from the pool not yet picked
  for (const ex of pool) {
    if (!alreadySelected.has(ex.id)) {
      return ex;
    }
  }

  // Fallback: first available
  return pool[0] ?? null;
}

/**
 * Provides periodized routine structures based on split type and weekly frequency.
 */
function getRoutineTemplates(
  splitType: 'push_pull_legs' | 'upper_lower' | 'full_body',
  daysPerWeek: number,
): RoutineTemplate[] {
  switch (splitType) {
    case 'full_body':
      return [
        {
          name: 'Full Body A (Squat & Press Focus)',
          description: 'Quad, chest horizontal press, horizontal row, and core work',
          slots: [
            { label: 'Squat / Quad Compound', targetMovementPatterns: ['squat'] },
            { label: 'Horizontal Push', targetMovementPatterns: ['horizontal_push'], targetMuscleGroups: ['chest'] },
            { label: 'Horizontal Pull', targetMovementPatterns: ['horizontal_pull'], targetMuscleGroups: ['lats', 'upper_back'] },
            { label: 'Posterior Chain Hinge', targetMovementPatterns: ['hinge'], targetMuscleGroups: ['hamstrings', 'glutes'] },
            { label: 'Core / Abs', targetMovementPatterns: ['core'], targetMuscleGroups: ['core'] },
            { label: 'Arms Finisher', targetMuscleGroups: ['biceps', 'triceps'] },
          ],
        },
        {
          name: 'Full Body B (Hinge & Vertical Focus)',
          description: 'Posterior chain deadlift/hinge, vertical press, and vertical pull',
          slots: [
            { label: 'Hinge Compound', targetMovementPatterns: ['hinge'] },
            { label: 'Vertical Push', targetMovementPatterns: ['vertical_push'], targetMuscleGroups: ['shoulders'] },
            { label: 'Vertical Pull', targetMovementPatterns: ['vertical_pull'], targetMuscleGroups: ['lats'] },
            { label: 'Unilateral / Quad', targetMovementPatterns: ['lunge', 'squat'], targetMuscleGroups: ['quadriceps'] },
            { label: 'Triceps Isolation', targetMuscleGroups: ['triceps'] },
            { label: 'Core / Obliques', targetMovementPatterns: ['core'] },
          ],
        },
        {
          name: 'Full Body C (Hypertrophy & Pump)',
          description: 'Lunge, chest accessory, upper back, and calves',
          slots: [
            { label: 'Unilateral Leg', targetMovementPatterns: ['lunge', 'squat'] },
            { label: 'Incline Push / Chest', targetMovementPatterns: ['horizontal_push'], targetMuscleGroups: ['chest'] },
            { label: 'Row / Upper Back', targetMovementPatterns: ['horizontal_pull'], targetMuscleGroups: ['lats'] },
            { label: 'Hamstring Curl / Hinge', targetMovementPatterns: ['hinge'], targetMuscleGroups: ['hamstrings'] },
            { label: 'Calves / Calves Isolation', targetMuscleGroups: ['calves'] },
            { label: 'Biceps Isolation', targetMuscleGroups: ['biceps'] },
          ],
        },
      ].slice(0, daysPerWeek);

    case 'upper_lower':
      return [
        {
          name: 'Upper Body A',
          description: 'Horizontal press, horizontal pull, overhead press, and arms',
          slots: [
            { label: 'Heavy Horizontal Press', targetMovementPatterns: ['horizontal_push'], targetMuscleGroups: ['chest'] },
            { label: 'Heavy Horizontal Row', targetMovementPatterns: ['horizontal_pull'], targetMuscleGroups: ['lats'] },
            { label: 'Vertical Overhead Press', targetMovementPatterns: ['vertical_push'], targetMuscleGroups: ['shoulders'] },
            { label: 'Vertical Lat Pulldown / Pullup', targetMovementPatterns: ['vertical_pull'], targetMuscleGroups: ['lats'] },
            { label: 'Triceps Isolation', targetMuscleGroups: ['triceps'] },
            { label: 'Biceps Curl', targetMuscleGroups: ['biceps'] },
          ],
        },
        {
          name: 'Lower Body A',
          description: 'Squat pattern, hinge pattern, quads, calves, and abs',
          slots: [
            { label: 'Primary Squat Compound', targetMovementPatterns: ['squat'], targetMuscleGroups: ['quadriceps'] },
            { label: 'Romanian Deadlift / Hinge', targetMovementPatterns: ['hinge'], targetMuscleGroups: ['hamstrings'] },
            { label: 'Unilateral Leg / Lunge', targetMovementPatterns: ['lunge'], targetMuscleGroups: ['glutes', 'quadriceps'] },
            { label: 'Hamstring Isolation', targetMovementPatterns: ['hinge'], targetMuscleGroups: ['hamstrings'] },
            { label: 'Calf Raise', targetMuscleGroups: ['calves'] },
            { label: 'Core Stabilization', targetMovementPatterns: ['core'] },
          ],
        },
        {
          name: 'Upper Body B',
          description: 'Incline chest, lat emphasis, lateral raises, and arm volume',
          slots: [
            { label: 'Incline / Secondary Press', targetMovementPatterns: ['horizontal_push'], targetMuscleGroups: ['chest'] },
            { label: 'Vertical Pulling', targetMovementPatterns: ['vertical_pull'], targetMuscleGroups: ['lats'] },
            { label: 'Lateral Raise / Delts', targetMovementPatterns: ['vertical_push'], targetMuscleGroups: ['shoulders'] },
            { label: 'Chest Supported Row', targetMovementPatterns: ['horizontal_pull'], targetMuscleGroups: ['lats'] },
            { label: 'Triceps Overhead Extension', targetMuscleGroups: ['triceps'] },
            { label: 'Incline Biceps Curl', targetMuscleGroups: ['biceps'] },
          ],
        },
        {
          name: 'Lower Body B',
          description: 'Hinge emphasis, front squat/lunge, hamstring, and core work',
          slots: [
            { label: 'Deadlift / Heavy Hinge', targetMovementPatterns: ['hinge'], targetMuscleGroups: ['hamstrings', 'glutes'] },
            { label: 'Secondary Squat / Goblet', targetMovementPatterns: ['squat'], targetMuscleGroups: ['quadriceps'] },
            { label: 'Bulgarian Split Squat / Lunge', targetMovementPatterns: ['lunge'] },
            { label: 'Hamstring Curl / Glute Bridge', targetMuscleGroups: ['hamstrings', 'glutes'] },
            { label: 'Calves Isolation', targetMuscleGroups: ['calves'] },
            { label: 'Hanging Leg Raise / Plank', targetMovementPatterns: ['core'] },
          ],
        },
      ].slice(0, daysPerWeek);

    case 'push_pull_legs':
    default:
      const pplTemplates: RoutineTemplate[] = [
        {
          name: 'Push Day (Chest, Shoulders & Triceps)',
          description: 'Horizontal and vertical pressing with deltoid and triceps isolation',
          slots: [
            { label: 'Primary Chest Press', targetMovementPatterns: ['horizontal_push'], targetMuscleGroups: ['chest'] },
            { label: 'Incline / Secondary Press', targetMovementPatterns: ['horizontal_push'], targetMuscleGroups: ['chest'] },
            { label: 'Overhead Shoulder Press', targetMovementPatterns: ['vertical_push'], targetMuscleGroups: ['shoulders'] },
            { label: 'Lateral Raise', targetMovementPatterns: ['vertical_push'], targetMuscleGroups: ['shoulders'] },
            { label: 'Triceps Pushdown / Extension', targetMuscleGroups: ['triceps'] },
            { label: 'Chest Fly / Pushup', targetMuscleGroups: ['chest'] },
          ],
        },
        {
          name: 'Pull Day (Back, Rear Delts & Biceps)',
          description: 'Vertical and horizontal pulling with posterior chain and biceps volume',
          slots: [
            { label: 'Heavy Row Compound', targetMovementPatterns: ['horizontal_pull'], targetMuscleGroups: ['lats'] },
            { label: 'Vertical Pull / Lat Pulldown', targetMovementPatterns: ['vertical_pull'], targetMuscleGroups: ['lats'] },
            { label: 'Secondary Row', targetMovementPatterns: ['horizontal_pull'] },
            { label: 'Rear Delt Fly / Face Pull', targetMuscleGroups: ['shoulders', 'upper_back'] },
            { label: 'Barbell / Dumbbell Biceps Curl', targetMuscleGroups: ['biceps'] },
            { label: 'Hammer Curl', targetMuscleGroups: ['biceps'] },
          ],
        },
        {
          name: 'Leg Day (Quads, Hamstrings & Calves)',
          description: 'Squat and hinge foundations with unilateral quad and hamstring work',
          slots: [
            { label: 'Primary Squat Compound', targetMovementPatterns: ['squat'], targetMuscleGroups: ['quadriceps'] },
            { label: 'Romanian Deadlift / Hinge', targetMovementPatterns: ['hinge'], targetMuscleGroups: ['hamstrings'] },
            { label: 'Unilateral Lunge / Split Squat', targetMovementPatterns: ['lunge'] },
            { label: 'Hamstring Curl / Extension', targetMuscleGroups: ['hamstrings', 'quadriceps'] },
            { label: 'Standing Calf Raise', targetMuscleGroups: ['calves'] },
            { label: 'Abdominal Plank / Leg Raise', targetMovementPatterns: ['core'] },
          ],
        },
        {
          name: 'Upper Body Accessory',
          description: 'High-frequency upper body volume for chest, lats, and arms',
          slots: [
            { label: 'Dumbbell Bench Press', targetMovementPatterns: ['horizontal_push'], targetMuscleGroups: ['chest'] },
            { label: 'Neutral Grip Lat Pulldown', targetMovementPatterns: ['vertical_pull'], targetMuscleGroups: ['lats'] },
            { label: 'Dumbbell Lateral Raise', targetMuscleGroups: ['shoulders'] },
            { label: 'Cable Row / Chest Supported Row', targetMovementPatterns: ['horizontal_pull'] },
            { label: 'Triceps Skullcrusher', targetMuscleGroups: ['triceps'] },
            { label: 'Preacher / Incline Curl', targetMuscleGroups: ['biceps'] },
          ],
        },
        {
          name: 'Lower Body Accessory',
          description: 'Unilateral leg strength, posterior chain volume, and core stability',
          slots: [
            { label: 'Front Squat / Goblet Squat', targetMovementPatterns: ['squat'] },
            { label: 'Dumbbell RDL', targetMovementPatterns: ['hinge'], targetMuscleGroups: ['hamstrings'] },
            { label: 'Walking Lunges', targetMovementPatterns: ['lunge'] },
            { label: 'Leg Curl / Glute Bridge', targetMuscleGroups: ['hamstrings'] },
            { label: 'Calf Raises', targetMuscleGroups: ['calves'] },
            { label: 'Core / Hanging Knee Raise', targetMovementPatterns: ['core'] },
          ],
        },
        {
          name: 'Arms, Abs & Weak Point Hypertrophy',
          description: 'Dedicated arm, shoulder isolation, and core development session',
          slots: [
            { label: 'Close Grip Bench / Dip', targetMovementPatterns: ['horizontal_push'], targetMuscleGroups: ['triceps'] },
            { label: 'Barbell / EZ-Bar Biceps Curl', targetMuscleGroups: ['biceps'] },
            { label: 'Overhead Cable Triceps', targetMuscleGroups: ['triceps'] },
            { label: 'Hammer Curl', targetMuscleGroups: ['biceps'] },
            { label: 'Lateral Raise Dropset', targetMuscleGroups: ['shoulders'] },
            { label: 'Weighted Plank / Ab Crunch', targetMovementPatterns: ['core'] },
          ],
        },
      ];

      return pplTemplates.slice(0, daysPerWeek);
  }
}
