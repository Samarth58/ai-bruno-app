import { and, asc, eq, isNull } from 'drizzle-orm';
import { db } from '../../db/connection.js';
import {
  routineExercises,
  workoutRoutines,
  workoutSessions,
  workoutSetLogs,
} from '../../db/schema.js';
import { findExerciseById } from '../exercises/exercises.repository.js';
import { findRoutineByIdWithOwnership } from '../programs/programs.repository.js';
import {
  deleteSetLogById,
  findActiveSessionByUserId,
  findSessionByIdAndUserId,
  findSetLogById,
  insertSession,
  insertSetLog,
  listSessionsByUserId,
  updateSessionById,
  updateSetLogById,
  type PopulatedSessionDetail,
  type PopulatedSetLog,
} from './sessions.repository.js';
import type {
  CancelSessionInput,
  FinishSessionInput,
  HitPrescribedSessionInput,
  ListSessionsQuery,
  LogSetInput,
  StartSessionInput,
  UpdateSetInput,
  WorkoutSessionRow,
} from './sessions.schema.js';

// ---------------------------------------------------------------------------
// Domain Errors
// ---------------------------------------------------------------------------

export class SessionResourceNotFoundError extends Error {
  public readonly code = 'RESOURCE_NOT_FOUND';
  public readonly statusCode = 404;

  constructor(message: string) {
    super(message);
    this.name = 'SessionResourceNotFoundError';
  }
}

export class SessionValidationError extends Error {
  public readonly code = 'VALIDATION_ERROR';
  public readonly statusCode = 400;

  constructor(message: string) {
    super(message);
    this.name = 'SessionValidationError';
  }
}

export class SessionConflictError extends Error {
  public readonly code = 'CONFLICT';
  public readonly statusCode = 409;

  constructor(message: string) {
    super(message);
    this.name = 'SessionConflictError';
  }
}

// ---------------------------------------------------------------------------
// Session Summary Computation Helper
// ---------------------------------------------------------------------------

export interface SessionMetricsSummary {
  durationSeconds: number;
  durationMinutes: number;
  totalVolumeKg: number;
  totalSets: number;
  workingSets: number;
  hitPrescribedTargets: boolean;
}

export function computeSessionMetrics(
  session: Pick<WorkoutSessionRow, 'startedAt' | 'completedAt' | 'hitPrescribedTargets'>,
  setLogs: PopulatedSetLog[],
): SessionMetricsSummary {
  const endTime = session.completedAt ? new Date(session.completedAt).getTime() : Date.now();
  const startTime = new Date(session.startedAt).getTime();
  const durationSeconds = Math.max(0, Math.round((endTime - startTime) / 1000));
  const durationMinutes = Math.round(durationSeconds / 60);

  const workingSetsList = setLogs.filter((s) => !s.isWarmup);
  const totalVolumeKg = workingSetsList.reduce(
    (sum, s) => sum + s.actualWeightKg * s.actualReps,
    0,
  );

  const hitPrescribed =
    workingSetsList.length > 0 && workingSetsList.every((s) => s.targetHit);

  return {
    durationSeconds,
    durationMinutes,
    totalVolumeKg: Math.round(totalVolumeKg * 100) / 100,
    totalSets: setLogs.length,
    workingSets: workingSetsList.length,
    hitPrescribedTargets: session.hitPrescribedTargets || hitPrescribed,
  };
}

// ---------------------------------------------------------------------------
// Business Operations
// ---------------------------------------------------------------------------

/**
 * Starts a new workout session for the authenticated user.
 * Strictly prevents multiple concurrent active sessions.
 */
export async function startWorkoutSession(
  userId: string,
  input: StartSessionInput,
): Promise<PopulatedSessionDetail> {
  // 1. Guard against duplicate active sessions
  const activeExisting = await findActiveSessionByUserId(userId);
  if (activeExisting) {
    throw new SessionConflictError(
      'An active workout session is already in progress. Please finish or cancel it before starting a new session.',
    );
  }

  // 2. Validate routine ownership if provided
  if (input.routineId) {
    const routine = await findRoutineByIdWithOwnership(input.routineId, userId);
    if (!routine) {
      throw new SessionResourceNotFoundError(
        'Scheduled workout routine not found or not owned by user',
      );
    }
  }

  // 3. Insert new session
  const created = await insertSession({
    userId,
    routineId: input.routineId,
    notes: input.notes,
  });

  const fullSession = await findSessionByIdAndUserId(created.id, userId);
  if (!fullSession) {
    throw new SessionResourceNotFoundError('Failed to retrieve newly created session');
  }

  return fullSession;
}

/**
 * Retrieves the currently active workout session for the authenticated user.
 */
export async function getActiveWorkoutSession(
  userId: string,
): Promise<(PopulatedSessionDetail & { summary: SessionMetricsSummary }) | null> {
  const active = await findActiveSessionByUserId(userId);
  if (!active) {
    return null;
  }

  const summary = computeSessionMetrics(active, active.setLogs);
  return {
    ...active,
    summary,
  };
}

/**
 * Logs a single completed or warmup exercise set in an active workout session.
 */
export async function logExerciseSet(
  sessionId: string,
  userId: string,
  input: LogSetInput,
): Promise<PopulatedSetLog> {
  const session = await findSessionByIdAndUserId(sessionId, userId);
  if (!session) {
    throw new SessionResourceNotFoundError('Workout session not found');
  }

  if (session.status !== 'in_progress') {
    throw new SessionValidationError(
      `Cannot log sets for a session with status "${session.status}". Only active in-progress sessions accept logs.`,
    );
  }

  // Validate exercise existence
  const exercise = await findExerciseById(input.exerciseId);
  if (!exercise) {
    throw new SessionResourceNotFoundError('Exercise not found in catalogue');
  }

  // Auto-calculate targetHit if not explicitly supplied
  let targetHit = input.targetHit;
  if (targetHit === undefined) {
    if (input.targetReps !== undefined && input.targetReps !== null) {
      targetHit = input.actualReps >= input.targetReps;
    } else {
      targetHit = false;
    }
  }

  return insertSetLog(sessionId, {
    ...input,
    targetHit,
  });
}

/**
 * Updates a previously recorded set log in an active workout session.
 */
export async function updateExerciseSet(
  sessionId: string,
  setId: string,
  userId: string,
  input: UpdateSetInput,
): Promise<PopulatedSetLog> {
  const session = await findSessionByIdAndUserId(sessionId, userId);
  if (!session) {
    throw new SessionResourceNotFoundError('Workout session not found');
  }

  if (session.status !== 'in_progress') {
    throw new SessionValidationError(
      `Cannot update sets for a session with status "${session.status}". Only active in-progress sessions can be modified.`,
    );
  }

  const existingSet = await findSetLogById(setId, sessionId);
  if (!existingSet) {
    throw new SessionResourceNotFoundError('Set log not found in this workout session');
  }

  // Determine updated targetHit if reps adjusted without explicit targetHit
  let targetHit = input.targetHit;
  if (targetHit === undefined) {
    const effectiveTargetReps =
      input.targetReps !== undefined ? input.targetReps : existingSet.targetReps;
    const effectiveActualReps =
      input.actualReps !== undefined ? input.actualReps : existingSet.actualReps;

    if (effectiveTargetReps !== null && effectiveTargetReps !== undefined) {
      targetHit = effectiveActualReps >= effectiveTargetReps;
    }
  }

  const updated = await updateSetLogById(setId, sessionId, {
    ...input,
    ...(targetHit !== undefined && { targetHit }),
  });

  if (!updated) {
    throw new SessionResourceNotFoundError('Failed to update set log');
  }

  return updated;
}

/**
 * Deletes a recorded set log from an active workout session.
 */
export async function deleteExerciseSet(
  sessionId: string,
  setId: string,
  userId: string,
): Promise<boolean> {
  const session = await findSessionByIdAndUserId(sessionId, userId);
  if (!session) {
    throw new SessionResourceNotFoundError('Workout session not found');
  }

  if (session.status !== 'in_progress') {
    throw new SessionValidationError(
      `Cannot delete sets from a session with status "${session.status}".`,
    );
  }

  const existingSet = await findSetLogById(setId, sessionId);
  if (!existingSet) {
    throw new SessionResourceNotFoundError('Set log not found in this workout session');
  }

  return deleteSetLogById(setId, sessionId);
}

/**
 * Finishes an in-progress workout session and records final metrics, duration, and notes.
 */
export async function finishWorkoutSession(
  sessionId: string,
  userId: string,
  input: FinishSessionInput,
): Promise<{
  session: PopulatedSessionDetail;
  summary: SessionMetricsSummary;
}> {
  const session = await findSessionByIdAndUserId(sessionId, userId);
  if (!session) {
    throw new SessionResourceNotFoundError('Workout session not found');
  }

  if (session.status !== 'in_progress') {
    throw new SessionValidationError(
      `Session is already ${session.status} and cannot be finished again.`,
    );
  }

  const completedAt = input.completedAt ? new Date(input.completedAt) : new Date();

  // Compute metrics from logged sets
  const summary = computeSessionMetrics(
    {
      startedAt: session.startedAt,
      completedAt,
      hitPrescribedTargets: false,
    },
    session.setLogs,
  );

  const updated = await updateSessionById(sessionId, userId, {
    status: 'completed',
    completedAt,
    perceivedRpe: input.perceivedRpe ?? session.perceivedRpe,
    jointSoreness: input.jointSoreness ?? session.jointSoreness,
    notes: input.notes ?? session.notes,
    hitPrescribedTargets: summary.hitPrescribedTargets,
  });

  if (!updated) {
    throw new SessionResourceNotFoundError('Failed to complete workout session');
  }

  const finalDetail = await findSessionByIdAndUserId(sessionId, userId);
  if (!finalDetail) {
    throw new SessionResourceNotFoundError('Failed to retrieve finalized workout session');
  }

  return {
    session: finalDetail,
    summary,
  };
}

/**
 * Completes an in-progress workout session in one tap by automatically generating
 * completed set logs for all prescribed exercises and sets in the scheduled routine.
 *
 * Requirements & Safety:
 * 1. Transactional isolation ensures no partial set creation on error.
 * 2. Row-level exclusive lock on the session prevents duplicate concurrent set creations.
 * 3. Idempotent set generation checks for existing set logs in the session before inserting,
 *    preventing duplicate sets if retried or if some sets were already logged.
 * 4. Missing target weights safely record null target weight and 0 kg actual weight (bodyweight/unweighted).
 *    Never invents fictitious weights. Prescribed target values are cleanly separated from actual results.
 * 5. Session is finalized with hitPrescribedTargets: true, status: 'completed', and duration/volume metrics computed.
 */
export async function hitPrescribedTargetsSession(
  sessionId: string,
  userId: string,
  input: HitPrescribedSessionInput = {},
): Promise<{
  session: PopulatedSessionDetail;
  summary: SessionMetricsSummary;
  createdSetsCount: number;
}> {
  const completedAt = input.completedAt ? new Date(input.completedAt) : new Date();

  const { createdSetsCount } = await db.transaction(async (tx) => {
    // 1. Fetch and lock session row for exclusive transaction access
    const [session] = await tx
      .select()
      .from(workoutSessions)
      .where(
        and(
          eq(workoutSessions.id, sessionId),
          eq(workoutSessions.userId, userId),
          isNull(workoutSessions.deletedAt),
        ),
      )
      .for('update');

    if (!session) {
      throw new SessionResourceNotFoundError('Workout session not found');
    }

    // 2. Validate session is still active
    if (session.status !== 'in_progress') {
      throw new SessionValidationError(
        `Session is already ${session.status} and cannot be finished again.`,
      );
    }

    // 3. Validate routine attachment (freestyle sessions have no prescribed targets)
    if (!session.routineId) {
      throw new SessionValidationError(
        'Cannot hit prescribed targets for a freestyle workout session without an assigned routine.',
      );
    }

    // 4. Fetch the scheduled routine
    const [routine] = await tx
      .select()
      .from(workoutRoutines)
      .where(
        and(
          eq(workoutRoutines.id, session.routineId),
          isNull(workoutRoutines.deletedAt),
        ),
      )
      .limit(1);

    if (!routine) {
      throw new SessionResourceNotFoundError('Scheduled workout routine not found');
    }

    // 5. Fetch prescribed exercises in planned sequence
    const prescribed = await tx
      .select()
      .from(routineExercises)
      .where(eq(routineExercises.routineId, routine.id))
      .orderBy(asc(routineExercises.orderIndex), asc(routineExercises.createdAt));

    if (prescribed.length === 0) {
      throw new SessionValidationError('Scheduled routine has no prescribed exercises.');
    }

    // 6. Check existing set logs for this session to avoid duplicate logs on retry
    const existingSets = await tx
      .select()
      .from(workoutSetLogs)
      .where(eq(workoutSetLogs.sessionId, session.id));

    // 7. Auto-populate missing prescribed sets
    const setsToInsert: Array<typeof workoutSetLogs.$inferInsert> = [];

    for (const rx of prescribed) {
      const prescribedSets = rx.prescribedSets > 0 ? rx.prescribedSets : 3;
      const targetReps = rx.repRangeMax ?? rx.repRangeMin ?? 10;
      const targetWeightKg =
        rx.targetWeightKg !== null && rx.targetWeightKg !== undefined
          ? Number(rx.targetWeightKg)
          : null;
      // Handle missing target weights safely: never invent actual weights.
      // 0 kg represents unweighted / bodyweight, matching non-null database column constraint.
      const actualWeightKg = targetWeightKg !== null ? targetWeightKg : 0;
      const setRpe = rx.targetRpe ?? input.perceivedRpe ?? null;

      for (let setNum = 1; setNum <= prescribedSets; setNum++) {
        const alreadyExists = existingSets.some(
          (s) =>
            (s.routineExerciseId === rx.id || s.exerciseId === rx.exerciseId) &&
            s.setNumber === setNum,
        );

        if (!alreadyExists) {
          setsToInsert.push({
            sessionId: session.id,
            exerciseId: rx.exerciseId,
            routineExerciseId: rx.id,
            setNumber: setNum,
            actualWeightKg,
            actualReps: targetReps,
            targetWeightKg,
            targetReps,
            rpe: setRpe,
            targetHit: true,
            isWarmup: false,
          });
        }
      }
    }

    if (setsToInsert.length > 0) {
      await tx.insert(workoutSetLogs).values(setsToInsert);
    }

    // 8. Update session header to completed
    await tx
      .update(workoutSessions)
      .set({
        status: 'completed',
        completedAt,
        perceivedRpe: input.perceivedRpe ?? session.perceivedRpe ?? routine.targetRpe ?? null,
        jointSoreness: input.jointSoreness ?? session.jointSoreness ?? null,
        notes: input.notes ?? session.notes ?? null,
        hitPrescribedTargets: true,
        updatedAt: new Date(),
      })
      .where(eq(workoutSessions.id, session.id));

    return { createdSetsCount: setsToInsert.length };
  });

  // 9. Retrieve finalized populated session detail and compute duration/volume summary
  const finalDetail = await findSessionByIdAndUserId(sessionId, userId);
  if (!finalDetail) {
    throw new SessionResourceNotFoundError('Failed to retrieve finalized workout session');
  }

  const summary = computeSessionMetrics(finalDetail, finalDetail.setLogs);

  return {
    session: finalDetail,
    summary,
    createdSetsCount,
  };
}

/**
 * Cancels / abandons an in-progress workout session safely.
 */
export async function cancelWorkoutSession(
  sessionId: string,
  userId: string,
  input: CancelSessionInput,
): Promise<PopulatedSessionDetail> {
  const session = await findSessionByIdAndUserId(sessionId, userId);
  if (!session) {
    throw new SessionResourceNotFoundError('Workout session not found');
  }

  if (session.status !== 'in_progress') {
    throw new SessionValidationError(
      `Cannot cancel a session that is already ${session.status}.`,
    );
  }

  const updated = await updateSessionById(sessionId, userId, {
    status: 'abandoned',
    completedAt: new Date(),
    notes: input.notes ?? session.notes,
  });

  if (!updated) {
    throw new SessionResourceNotFoundError('Failed to cancel workout session');
  }

  const fullSession = await findSessionByIdAndUserId(sessionId, userId);
  if (!fullSession) {
    throw new SessionResourceNotFoundError('Failed to retrieve cancelled session');
  }

  return fullSession;
}

/**
 * Lists user's session history with status filtering and pagination.
 */
export async function listUserSessions(
  userId: string,
  query: ListSessionsQuery,
): Promise<{
  sessions: Array<
    WorkoutSessionRow & { durationMinutes: number | null; totalSets?: number }
  >;
  meta: { total: number; limit: number; offset: number; hasMore: boolean };
}> {
  const { sessions, total } = await listSessionsByUserId(userId, {
    status: query.status,
    limit: query.limit,
    offset: query.offset,
  });

  const enriched = sessions.map((s) => {
    let durationMinutes: number | null = null;
    if (s.completedAt) {
      const durSec = Math.round(
        (new Date(s.completedAt).getTime() - new Date(s.startedAt).getTime()) / 1000,
      );
      durationMinutes = Math.max(0, Math.round(durSec / 60));
    }
    return {
      ...s,
      durationMinutes,
    };
  });

  return {
    sessions: enriched,
    meta: {
      total,
      limit: query.limit,
      offset: query.offset,
      hasMore: query.offset + query.limit < total,
    },
  };
}

/**
 * Retrieves a single session by ID with its full set logs and calculated summary.
 */
export async function getUserSessionById(
  sessionId: string,
  userId: string,
): Promise<PopulatedSessionDetail & { summary: SessionMetricsSummary }> {
  const session = await findSessionByIdAndUserId(sessionId, userId);
  if (!session) {
    throw new SessionResourceNotFoundError('Workout session not found');
  }

  const summary = computeSessionMetrics(session, session.setLogs);
  return {
    ...session,
    summary,
  };
}
