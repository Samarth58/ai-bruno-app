import { and, asc, desc, eq, isNull } from 'drizzle-orm';
import { db as defaultDb } from '../../db/connection.js';
import {
  exercises,
  routineExercises,
  workoutPrograms,
  workoutRoutines,
  type Exercise,
} from '../../db/schema.js';
import type { GeneratedProgramPlan } from './programs.generator.js';
import type {
  CreateProgramInput,
  CreateRoutineExerciseInput,
  CreateRoutineInput,
  RoutineExerciseRow,
  UpdateProgramInput,
  UpdateRoutineExerciseInput,
  UpdateRoutineInput,
  WorkoutProgramRow,
  WorkoutRoutineRow,
} from './programs.schema.js';

export interface RoutineExerciseDetail extends RoutineExerciseRow {
  exercise?: Exercise;
}

export interface WorkoutRoutineDetail extends WorkoutRoutineRow {
  exercises: RoutineExerciseDetail[];
}

export interface WorkoutProgramDetail extends WorkoutProgramRow {
  routines: WorkoutRoutineDetail[];
}

/**
 * Persists an entire generated workout program plan atomically inside a transaction.
 */
export async function insertProgramWithPlan(
  userId: string,
  plan: GeneratedProgramPlan,
  db = defaultDb,
): Promise<WorkoutProgramDetail> {
  return await db.transaction(async (tx) => {
    // 1. Deactivate existing active programs for this user so only one is primary
    await tx
      .update(workoutPrograms)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(eq(workoutPrograms.userId, userId), isNull(workoutPrograms.deletedAt)));

    // 2. Insert the program
    const [program] = await tx
      .insert(workoutPrograms)
      .values({
        userId,
        name: plan.name,
        splitType: plan.splitType,
        durationWeeks: plan.durationWeeks,
        currentWeek: 1,
        trainingDaysPerWeek: plan.trainingDaysPerWeek,
        targetSessionDurationMinutes: plan.targetSessionDurationMinutes,
        gymProfileId: plan.gymProfileId,
        isActive: true,
      })
      .returning();

    const createdRoutines: WorkoutRoutineDetail[] = [];

    // 3. Insert routines and their prescribed exercises
    for (const r of plan.routines) {
      const [routine] = await tx
        .insert(workoutRoutines)
        .values({
          programId: program.id,
          name: r.name,
          dayNumber: r.dayNumber,
          targetRpe: r.targetRpe,
          description: r.description,
        })
        .returning();

      const createdExercises: RoutineExerciseDetail[] = [];

      for (const e of r.exercises) {
        const [rex] = await tx
          .insert(routineExercises)
          .values({
            routineId: routine.id,
            exerciseId: e.exerciseId,
            orderIndex: e.orderIndex,
            prescribedSets: e.prescribedSets,
            repRangeMin: e.repRangeMin,
            repRangeMax: e.repRangeMax,
            targetRpe: e.targetRpe,
            restSeconds: e.restSeconds,
            notes: e.notes,
          })
          .returning();

        createdExercises.push(rex);
      }

      createdRoutines.push({
        ...routine,
        exercises: createdExercises,
      });
    }

    return {
      ...program,
      routines: createdRoutines,
    };
  });
}

/**
 * Creates a single custom program row.
 */
export async function insertProgram(
  userId: string,
  input: CreateProgramInput,
  db = defaultDb,
): Promise<WorkoutProgramRow> {
  if (input.isActive) {
    await db
      .update(workoutPrograms)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(eq(workoutPrograms.userId, userId), isNull(workoutPrograms.deletedAt)));
  }

  const [created] = await db
    .insert(workoutPrograms)
    .values({
      userId,
      ...input,
    })
    .returning();

  return created;
}

/**
 * Lists all programs for a user, with optional active filter.
 */
export async function findProgramsByUserId(
  userId: string,
  isActive?: boolean,
  db = defaultDb,
): Promise<WorkoutProgramRow[]> {
  const conditions = [eq(workoutPrograms.userId, userId), isNull(workoutPrograms.deletedAt)];

  if (typeof isActive === 'boolean') {
    conditions.push(eq(workoutPrograms.isActive, isActive));
  }

  return db
    .select()
    .from(workoutPrograms)
    .where(and(...conditions))
    .orderBy(desc(workoutPrograms.isActive), desc(workoutPrograms.createdAt));
}

/**
 * Retrieves a single program by ID with tenant isolation, populating all nested routines and exercises.
 */
export async function findProgramById(
  id: string,
  userId: string,
  db = defaultDb,
): Promise<WorkoutProgramDetail | null> {
  const [program] = await db
    .select()
    .from(workoutPrograms)
    .where(
      and(
        eq(workoutPrograms.id, id),
        eq(workoutPrograms.userId, userId),
        isNull(workoutPrograms.deletedAt),
      ),
    )
    .limit(1);

  if (!program) return null;

  // Retrieve routines
  const routinesList = await db
    .select()
    .from(workoutRoutines)
    .where(and(eq(workoutRoutines.programId, program.id), isNull(workoutRoutines.deletedAt)))
    .orderBy(asc(workoutRoutines.dayNumber), asc(workoutRoutines.createdAt));

  // Retrieve routine exercises with joined exercise metadata
  const detailedRoutines: WorkoutRoutineDetail[] = [];

  for (const routine of routinesList) {
    const rows = await db
      .select({
        routineExercise: routineExercises,
        exercise: exercises,
      })
      .from(routineExercises)
      .leftJoin(exercises, eq(routineExercises.exerciseId, exercises.id))
      .where(eq(routineExercises.routineId, routine.id))
      .orderBy(asc(routineExercises.orderIndex), asc(routineExercises.createdAt));

    const exercisesForRoutine: RoutineExerciseDetail[] = rows.map((r) => ({
      ...r.routineExercise,
      exercise: r.exercise ?? undefined,
    }));

    detailedRoutines.push({
      ...routine,
      exercises: exercisesForRoutine,
    });
  }

  return {
    ...program,
    routines: detailedRoutines,
  };
}

/**
 * Updates program metadata.
 */
export async function updateProgramById(
  id: string,
  userId: string,
  input: UpdateProgramInput,
  db = defaultDb,
): Promise<WorkoutProgramRow | null> {
  if (input.isActive) {
    await db
      .update(workoutPrograms)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(eq(workoutPrograms.userId, userId), isNull(workoutPrograms.deletedAt)));
  }

  const [updated] = await db
    .update(workoutPrograms)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(workoutPrograms.id, id),
        eq(workoutPrograms.userId, userId),
        isNull(workoutPrograms.deletedAt),
      ),
    )
    .returning();

  return updated ?? null;
}

/**
 * Soft deletes a workout program.
 */
export async function softDeleteProgramById(
  id: string,
  userId: string,
  db = defaultDb,
): Promise<boolean> {
  const [deleted] = await db
    .update(workoutPrograms)
    .set({
      deletedAt: new Date(),
      isActive: false,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(workoutPrograms.id, id),
        eq(workoutPrograms.userId, userId),
        isNull(workoutPrograms.deletedAt),
      ),
    )
    .returning();

  return Boolean(deleted);
}

/**
 * Activates a workout program and deactivates all other programs for the user.
 */
export async function activateProgramById(
  id: string,
  userId: string,
  db = defaultDb,
): Promise<WorkoutProgramRow | null> {
  return await db.transaction(async (tx) => {
    // 1. Verify program exists and belongs to user
    const [existing] = await tx
      .select({ id: workoutPrograms.id })
      .from(workoutPrograms)
      .where(
        and(
          eq(workoutPrograms.id, id),
          eq(workoutPrograms.userId, userId),
          isNull(workoutPrograms.deletedAt),
        ),
      )
      .limit(1);

    if (!existing) return null;

    // 2. Deactivate others
    await tx
      .update(workoutPrograms)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(eq(workoutPrograms.userId, userId), isNull(workoutPrograms.deletedAt)));

    // 3. Activate this one
    const [activated] = await tx
      .update(workoutPrograms)
      .set({ isActive: true, updatedAt: new Date() })
      .where(eq(workoutPrograms.id, id))
      .returning();

    return activated ?? null;
  });
}

// ---------------------------------------------------------------------------
// Routine CRUD Operations
// ---------------------------------------------------------------------------

export async function insertRoutine(
  programId: string,
  input: CreateRoutineInput,
  db = defaultDb,
): Promise<WorkoutRoutineRow> {
  const [created] = await db
    .insert(workoutRoutines)
    .values({
      programId,
      ...input,
    })
    .returning();

  return created;
}

export async function findRoutineByIdWithOwnership(
  routineId: string,
  userId: string,
  db = defaultDb,
): Promise<(WorkoutRoutineRow & { programUserId: string }) | null> {
  const [row] = await db
    .select({
      routine: workoutRoutines,
      programUserId: workoutPrograms.userId,
    })
    .from(workoutRoutines)
    .innerJoin(workoutPrograms, eq(workoutRoutines.programId, workoutPrograms.id))
    .where(
      and(
        eq(workoutRoutines.id, routineId),
        eq(workoutPrograms.userId, userId),
        isNull(workoutRoutines.deletedAt),
        isNull(workoutPrograms.deletedAt),
      ),
    )
    .limit(1);

  if (!row) return null;

  return {
    ...row.routine,
    programUserId: row.programUserId,
  };
}

export async function updateRoutineById(
  routineId: string,
  input: UpdateRoutineInput,
  db = defaultDb,
): Promise<WorkoutRoutineRow | null> {
  const [updated] = await db
    .update(workoutRoutines)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(and(eq(workoutRoutines.id, routineId), isNull(workoutRoutines.deletedAt)))
    .returning();

  return updated ?? null;
}

export async function softDeleteRoutineById(
  routineId: string,
  db = defaultDb,
): Promise<boolean> {
  const [deleted] = await db
    .update(workoutRoutines)
    .set({
      deletedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(workoutRoutines.id, routineId), isNull(workoutRoutines.deletedAt)))
    .returning();

  return Boolean(deleted);
}

// ---------------------------------------------------------------------------
// Routine Exercise CRUD Operations
// ---------------------------------------------------------------------------

export async function insertRoutineExercise(
  routineId: string,
  input: CreateRoutineExerciseInput,
  db = defaultDb,
): Promise<RoutineExerciseRow> {
  const [created] = await db
    .insert(routineExercises)
    .values({
      routineId,
      ...input,
    })
    .returning();

  return created;
}

export async function findRoutineExerciseByIdWithOwnership(
  routineExerciseId: string,
  userId: string,
  db = defaultDb,
): Promise<(RoutineExerciseRow & { programUserId: string; gymProfileId: string | null }) | null> {
  const [row] = await db
    .select({
      routineExercise: routineExercises,
      programUserId: workoutPrograms.userId,
      gymProfileId: workoutPrograms.gymProfileId,
    })
    .from(routineExercises)
    .innerJoin(workoutRoutines, eq(routineExercises.routineId, workoutRoutines.id))
    .innerJoin(workoutPrograms, eq(workoutRoutines.programId, workoutPrograms.id))
    .where(
      and(
        eq(routineExercises.id, routineExerciseId),
        eq(workoutPrograms.userId, userId),
        isNull(workoutRoutines.deletedAt),
        isNull(workoutPrograms.deletedAt),
      ),
    )
    .limit(1);

  if (!row) return null;

  return {
    ...row.routineExercise,
    programUserId: row.programUserId,
    gymProfileId: row.gymProfileId,
  };
}

export async function updateRoutineExerciseById(
  routineExerciseId: string,
  input: UpdateRoutineExerciseInput,
  db = defaultDb,
): Promise<RoutineExerciseRow | null> {
  const [updated] = await db
    .update(routineExercises)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(eq(routineExercises.id, routineExerciseId))
    .returning();

  return updated ?? null;
}

export async function deleteRoutineExerciseById(
  routineExerciseId: string,
  db = defaultDb,
): Promise<boolean> {
  const [deleted] = await db
    .delete(routineExercises)
    .where(eq(routineExercises.id, routineExerciseId))
    .returning();

  return Boolean(deleted);
}

export async function swapRoutineExerciseById(
  routineExerciseId: string,
  replacementExerciseId: string,
  reason?: string,
  db = defaultDb,
): Promise<RoutineExerciseRow | null> {
  const [existing] = await db
    .select()
    .from(routineExercises)
    .where(eq(routineExercises.id, routineExerciseId))
    .limit(1);

  if (!existing) return null;

  const updatedNotes = reason
    ? existing.notes
      ? `${existing.notes} | Swapped: ${reason}`
      : `Swapped: ${reason}`
    : existing.notes;

  const [updated] = await db
    .update(routineExercises)
    .set({
      exerciseId: replacementExerciseId,
      notes: updatedNotes,
      updatedAt: new Date(),
    })
    .where(eq(routineExercises.id, routineExerciseId))
    .returning();

  return updated ?? null;
}
