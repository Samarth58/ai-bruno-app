import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import { db as defaultDb } from '../../db/connection.js';
import {
  exercises,
  workoutSessions,
  workoutSetLogs,
  type Exercise,
  type GymProfile,
} from '../../db/schema.js';
import type { GenerateProgramInput } from './programs.schema.js';

export interface BaselineStrengthBenchmark {
  benchmarkKey: string;
  exerciseId?: string;
  exerciseName?: string;
  weightKg: number;
  reps: number;
  estimated1rmKg: number;
  source: 'explicit_input' | 'workout_history';
}

/**
 * Canonical normalizer for lift names and benchmark keys.
 */
export function normalizeLiftKey(raw: string): string {
  const s = raw
    .trim()
    .toLowerCase()
    .replace(/[\s\-_]+/g, '_');

  if (s.includes('bench') && !s.includes('incline') && !s.includes('close')) {
    return 'bench_press';
  }
  if (s.includes('incline_bench') || s.includes('incline_press')) {
    return 'incline_bench_press';
  }
  if (
    s.includes('squat') &&
    !s.includes('split') &&
    !s.includes('belt') &&
    !s.includes('hack') &&
    !s.includes('goblet')
  ) {
    return 'squat';
  }
  if (
    s.includes('deadlift') &&
    !s.includes('romanian') &&
    !s.includes('rdl') &&
    !s.includes('stiff')
  ) {
    return 'deadlift';
  }
  if (
    s.includes('overhead') ||
    s.includes('military') ||
    s === 'ohp' ||
    s.includes('shoulder_press')
  ) {
    return 'overhead_press';
  }
  if (s.includes('row') && (s.includes('barbell') || s.includes('bent'))) {
    return 'barbell_row';
  }
  if (s.includes('lat_pull') || s.includes('pulldown')) {
    return 'lat_pulldown';
  }
  return s;
}

/**
 * Calculates estimated 1RM using Epley formula.
 */
export function calculateEstimated1rmKg(weightKg: number, reps: number): number {
  if (weightKg <= 0 || reps <= 0) return 0;
  if (reps === 1) return weightKg;
  return Math.round(weightKg * (1 + reps / 30) * 10) / 10;
}

/**
 * Parses user-supplied baseline lifts from various schema formats into normalized benchmarks.
 */
export function parseInputBaselines(
  input?: GenerateProgramInput['baselineLifts'],
): BaselineStrengthBenchmark[] {
  if (!input) return [];

  const results: BaselineStrengthBenchmark[] = [];

  if (Array.isArray(input)) {
    for (const item of input) {
      if (!item || typeof item !== 'object') continue;
      const weightKg = Number(item.weightKg);
      if (isNaN(weightKg) || weightKg <= 0) continue;

      const reps = Number(item.reps ?? 1);
      const est1rm =
        item.estimated1rmKg !== undefined && Number(item.estimated1rmKg) > 0
          ? Number(item.estimated1rmKg)
          : calculateEstimated1rmKg(weightKg, reps);

      const identifier = item.lift || item.name || item.exerciseId || 'unknown';
      const key = normalizeLiftKey(identifier);

      results.push({
        benchmarkKey: key,
        exerciseId: item.exerciseId,
        exerciseName: item.name,
        weightKg,
        reps,
        estimated1rmKg: est1rm,
        source: 'explicit_input',
      });
    }
  } else if (typeof input === 'object') {
    for (const [keyRaw, value] of Object.entries(input)) {
      if (value === null || value === undefined) continue;

      let weightKg = 0;
      let reps = 1;
      let est1rm = 0;

      if (typeof value === 'number') {
        weightKg = value;
        reps = 1;
        est1rm = weightKg;
      } else if (typeof value === 'object') {
        weightKg = Number((value as any).weightKg);
        reps = Number((value as any).reps ?? 1);
        est1rm =
          (value as any).estimated1rmKg !== undefined && Number((value as any).estimated1rmKg) > 0
            ? Number((value as any).estimated1rmKg)
            : calculateEstimated1rmKg(weightKg, reps);
      }

      if (isNaN(weightKg) || weightKg <= 0) continue;

      const normKey = normalizeLiftKey(keyRaw);
      results.push({
        benchmarkKey: normKey,
        exerciseName: keyRaw,
        weightKg,
        reps,
        estimated1rmKg: est1rm,
        source: 'explicit_input',
      });
    }
  }

  return results;
}

/**
 * Queries completed working set logs for the user to establish historical baseline 1RMs.
 */
export async function findUserHistoricalBaselines(
  userId: string,
  db = defaultDb,
): Promise<BaselineStrengthBenchmark[]> {
  const sets = await db
    .select({
      exerciseId: workoutSetLogs.exerciseId,
      exerciseName: exercises.name,
      movementPattern: exercises.movementPattern,
      actualWeightKg: workoutSetLogs.actualWeightKg,
      actualReps: workoutSetLogs.actualReps,
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
        sql`${workoutSetLogs.actualWeightKg} > 0`,
        sql`${workoutSetLogs.actualReps} <= 20`,
      ),
    )
    .orderBy(desc(workoutSessions.startedAt));

  const bestByExercise = new Map<string, BaselineStrengthBenchmark>();

  for (const s of sets) {
    const est1rm = calculateEstimated1rmKg(s.actualWeightKg, s.actualReps);
    const existing = bestByExercise.get(s.exerciseId);

    if (!existing || est1rm > existing.estimated1rmKg) {
      bestByExercise.set(s.exerciseId, {
        benchmarkKey: normalizeLiftKey(s.exerciseName),
        exerciseId: s.exerciseId,
        exerciseName: s.exerciseName,
        weightKg: s.actualWeightKg,
        reps: s.actualReps,
        estimated1rmKg: est1rm,
        source: 'workout_history',
      });
    }
  }

  return Array.from(bestByExercise.values());
}

/**
 * Combines explicit user input and historical workout logs into a prioritized baseline benchmark map.
 * Explicit inputs take precedence over historical data.
 */
export function resolveUserBaselineBenchmarks(
  explicitInput?: GenerateProgramInput['baselineLifts'],
  historicalBaselines: BaselineStrengthBenchmark[] = [],
): BaselineStrengthBenchmark[] {
  const explicitList = parseInputBaselines(explicitInput);
  const benchmarkMap = new Map<string, BaselineStrengthBenchmark>();

  // 1. Add historical benchmarks as baseline substrate
  for (const b of historicalBaselines) {
    if (b.exerciseId) benchmarkMap.set(`id:${b.exerciseId}`, b);
    if (b.benchmarkKey) benchmarkMap.set(`key:${b.benchmarkKey}`, b);
  }

  // 2. Explicit inputs override or supplement
  for (const b of explicitList) {
    if (b.exerciseId) benchmarkMap.set(`id:${b.exerciseId}`, b);
    if (b.benchmarkKey) benchmarkMap.set(`key:${b.benchmarkKey}`, b);
  }

  return Array.from(benchmarkMap.values());
}

interface BiomechanicalConversionRule {
  ratio: number;
  perHandDumbbell?: boolean;
}

/**
 * Computes defensible biomechanical conversion factor from a benchmark 1RM to target exercise.
 * Returns null if the exercise is incompatible (e.g. bodyweight or isolation without direct benchmark).
 */
function getBiomechanicalConversionRule(
  exercise: Exercise,
  benchmarkKey: string,
): BiomechanicalConversionRule | null {
  const normKey = normalizeLiftKey(benchmarkKey);
  const pattern = exercise.movementPattern.toLowerCase();
  const equip = exercise.requiredEquipment.toLowerCase();
  const name = exercise.name.toLowerCase();

  // Incompatible equipment types for compound lift transference
  if (equip === 'bodyweight' || equip === 'pullup_bar') {
    return null;
  }

  // Pure isolation movements should never be guessed from compound barbell benchmark
  if (pattern === 'isolation') {
    return null;
  }

  // 1. Horizontal Push (Bench Press Benchmark)
  if (normKey === 'bench_press' || normKey === 'incline_bench_press') {
    if (pattern !== 'horizontal_push') return null;

    if (equip === 'barbell') {
      if (name.includes('incline')) return { ratio: 0.8 };
      return { ratio: 1.0 };
    }
    if (equip === 'dumbbell') {
      if (name.includes('incline')) return { ratio: 0.28, perHandDumbbell: true };
      return { ratio: 0.32, perHandDumbbell: true };
    }
    if (equip === 'machine' || equip === 'smith_machine') {
      return { ratio: 0.75 };
    }
    return null;
  }

  // 2. Squat / Quad-Dominant Compound (Back Squat Benchmark)
  if (normKey === 'squat') {
    if (pattern !== 'squat' && pattern !== 'lunge') return null;

    if (name.includes('leg press')) {
      return { ratio: 1.5 };
    }
    if (name.includes('belt squat')) {
      return { ratio: 0.85 };
    }
    if (equip === 'barbell') {
      if (name.includes('front')) return { ratio: 0.8 };
      return { ratio: 1.0 };
    }
    if (equip === 'dumbbell') {
      // Unilateral DB squat/lunge (e.g. Bulgarian Split Squat, DB Lunge, Goblet)
      return { ratio: 0.2, perHandDumbbell: true };
    }
    if (equip === 'machine' || equip === 'smith_machine') {
      return { ratio: 0.85 };
    }
    return null;
  }

  // 3. Hinge / Posterior Chain (Conventional Deadlift Benchmark)
  if (normKey === 'deadlift') {
    if (pattern !== 'hinge') return null;

    if (equip === 'barbell') {
      if (name.includes('romanian') || name.includes('rdl') || name.includes('stiff')) {
        return { ratio: 0.7 };
      }
      return { ratio: 1.0 };
    }
    if (equip === 'dumbbell') {
      return { ratio: 0.25, perHandDumbbell: true };
    }
    if (equip === 'machine' || equip === 'cable') {
      return { ratio: 0.65 };
    }
    return null;
  }

  // 4. Vertical Push (Overhead Barbell Press Benchmark)
  if (normKey === 'overhead_press') {
    if (pattern !== 'vertical_push') return null;

    if (equip === 'barbell') {
      return { ratio: 1.0 };
    }
    if (equip === 'dumbbell') {
      return { ratio: 0.32, perHandDumbbell: true };
    }
    if (equip === 'machine' || equip === 'smith_machine') {
      return { ratio: 0.75 };
    }
    return null;
  }

  // 5. Horizontal Pull (Barbell Row Benchmark)
  if (normKey === 'barbell_row') {
    if (pattern !== 'horizontal_pull' && pattern !== 'vertical_pull') return null;

    if (pattern === 'horizontal_pull') {
      if (equip === 'barbell') return { ratio: 1.0 };
      if (equip === 'dumbbell') return { ratio: 0.35, perHandDumbbell: true };
      if (equip === 'cable' || equip === 'machine') return { ratio: 0.75 };
    }

    if (pattern === 'vertical_pull') {
      if (name.includes('lat pulldown') || equip === 'cable') return { ratio: 0.75 };
    }

    return null;
  }

  // 6. Vertical Pull (Lat Pulldown Benchmark)
  if (normKey === 'lat_pulldown') {
    if (pattern !== 'vertical_pull' && pattern !== 'horizontal_pull') return null;

    if (name.includes('lat pulldown')) return { ratio: 1.0 };
    if (equip === 'cable' || equip === 'machine') return { ratio: 0.85 };
    return null;
  }

  return null;
}

/**
 * Predicts and rounds prescribed targetWeightKg for a generated routine exercise.
 * Strictly avoids arbitrary weights: returns null if no compatible baseline exists.
 */
export function seedExerciseTargetWeight(params: {
  exercise: Exercise;
  repRangeMin: number;
  repRangeMax: number;
  baselines: BaselineStrengthBenchmark[];
  gymProfile: GymProfile | null;
}): number | null {
  const { exercise, repRangeMin, repRangeMax, baselines, gymProfile } = params;
  if (!baselines || baselines.length === 0) return null;

  const targetReps = Math.round((repRangeMin + repRangeMax) / 2);
  const repDivider = 1 + targetReps / 30;

  // 1. Direct Match Check (by exerciseId or normalized exact name)
  const normExerciseName = normalizeLiftKey(exercise.name);
  const directMatch = baselines.find(
    (b) =>
      (b.exerciseId && b.exerciseId === exercise.id) ||
      (b.exerciseName &&
        normalizeLiftKey(b.exerciseName) === normExerciseName &&
        b.benchmarkKey === normExerciseName),
  );

  if (directMatch) {
    const rawWeight = directMatch.estimated1rmKg / repDivider;
    return roundAndEnforceLimits({
      rawWeight,
      exercise,
      gymProfile,
      perHandDumbbell: exercise.requiredEquipment === 'dumbbell',
    });
  }

  // 2. Compatible Biomechanical Compound Mapping
  for (const b of baselines) {
    const rule = getBiomechanicalConversionRule(exercise, b.benchmarkKey);
    if (!rule) continue;

    const benchmarkWorkingWeight = b.estimated1rmKg / repDivider;
    const rawWeight = benchmarkWorkingWeight * rule.ratio;

    return roundAndEnforceLimits({
      rawWeight,
      exercise,
      gymProfile,
      perHandDumbbell: rule.perHandDumbbell ?? false,
    });
  }

  // 3. No compatible baseline available -> leave null (no arbitrary defaults)
  return null;
}

/**
 * Enforces plate increments (2.5kg standard), Olympic bar minimums, non-negative bounds,
 * and hardware equipment caps (e.g. maxDumbbellWeightKg).
 */
function roundAndEnforceLimits(params: {
  rawWeight: number;
  exercise: Exercise;
  gymProfile: GymProfile | null;
  perHandDumbbell: boolean;
}): number | null {
  const { rawWeight, exercise, gymProfile, perHandDumbbell } = params;
  if (isNaN(rawWeight) || rawWeight <= 0) return null;

  const equip = exercise.requiredEquipment.toLowerCase();
  let weight = rawWeight;

  // Enforce equipment hardware constraints
  if (perHandDumbbell || equip === 'dumbbell') {
    if (gymProfile?.maxDumbbellWeightKg && weight > gymProfile.maxDumbbellWeightKg) {
      weight = gymProfile.maxDumbbellWeightKg;
    }
  }

  // Rounding: 2.5 kg increments for plates / dumbbells
  let rounded = Math.round(weight / 2.5) * 2.5;

  // Barbell Olympic empty bar constraint (standard 20.0 kg minimum for barbell compound)
  if (equip === 'barbell' && rounded > 0 && rounded < 20.0) {
    rounded = 20.0;
  }

  // Dumbbell minimum plate increment (2.5 kg minimum if positive)
  if (equip === 'dumbbell' && rounded > 0 && rounded < 2.5) {
    rounded = 2.5;
  }

  // Strict non-negative guard
  rounded = Math.max(0, rounded);

  return rounded > 0 ? rounded : null;
}
