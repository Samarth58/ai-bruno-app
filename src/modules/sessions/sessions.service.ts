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
