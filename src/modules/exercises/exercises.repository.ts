import { asc, eq, isNull } from 'drizzle-orm';
import { db as defaultDb } from '../../db/connection.js';
import { exercises } from '../../db/schema.js';
import type { ExerciseRow } from './exercises.schema.js';

export async function findAllActiveExercises(
  db = defaultDb,
): Promise<ExerciseRow[]> {
  return db
    .select()
    .from(exercises)
    .where(isNull(exercises.deletedAt))
    .orderBy(asc(exercises.primaryMuscleGroup), asc(exercises.name));
}

export async function findExerciseById(
  id: string,
  db = defaultDb,
): Promise<ExerciseRow | null> {
  const [row] = await db
    .select()
    .from(exercises)
    .where(eq(exercises.id, id))
    .limit(1);

  return row ?? null;
}
