import 'dotenv/config';
import { db, pool } from '../src/db/connection.js';
import { exercises } from '../src/db/schema.js';
import { curatedExercises } from '../src/db/seeds/exercises.js';

/**
 * Idempotently seeds the curated exercise database.
 * If an exercise already exists by unique name, its attributes are updated.
 */
export async function seedExercises(): Promise<{ total: number; processed: number }> {
  console.log(`Starting idempotent seed of ${curatedExercises.length} exercises...`);

  let count = 0;
  for (const item of curatedExercises) {
    await db
      .insert(exercises)
      .values({
        name: item.name,
        primaryMuscleGroup: item.primaryMuscleGroup,
        secondaryMuscleGroups: item.secondaryMuscleGroups,
        movementPattern: item.movementPattern,
        requiredEquipment: item.requiredEquipment,
        contraindicatedInjuries: item.contraindicatedInjuries,
        instructions: item.instructions,
      })
      .onConflictDoUpdate({
        target: exercises.name,
        set: {
          primaryMuscleGroup: item.primaryMuscleGroup,
          secondaryMuscleGroups: item.secondaryMuscleGroups,
          movementPattern: item.movementPattern,
          requiredEquipment: item.requiredEquipment,
          contraindicatedInjuries: item.contraindicatedInjuries,
          instructions: item.instructions,
          updatedAt: new Date(),
        },
      });
    count++;
  }

  console.log(`Successfully seeded ${count} exercises.`);
  return { total: curatedExercises.length, processed: count };
}

// Auto-run if executed directly
if (process.argv[1]?.endsWith('seedExercises.ts') || process.argv[1]?.endsWith('seedExercises.js')) {
  seedExercises()
    .then(() => {
      console.log('Seed completed successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seed execution failed:', err);
      process.exit(1);
    })
    .finally(async () => {
      await pool.end();
    });
}
