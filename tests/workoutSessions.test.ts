import { describe, expect, it, vi } from 'vitest';
import { computeSessionMetrics } from '../src/modules/sessions/sessions.service.js';
import type { PopulatedSetLog } from '../src/modules/sessions/sessions.repository.js';

// Setup mock user for route tests
const mockUser = {
  id: '11111111-1111-1111-1111-111111111111',
  email: 'session-lifter@example.com',
  name: 'Session Lifter',
  role: 'user',
  deletedAt: null,
};

// Mock Drizzle DB and pg pool connection
vi.mock('../src/db/connection.js', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn().mockResolvedValue([mockUser]),
          orderBy: vi.fn().mockResolvedValue([]),
        })),
        orderBy: vi.fn().mockResolvedValue([]),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn().mockResolvedValue([{ id: 'mock-id' }]),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn().mockResolvedValue([{ id: 'mock-id' }]),
        })),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(() => ({
        returning: vi.fn().mockResolvedValue([{ id: 'mock-id' }]),
      })),
    })),
  },
  pool: {
    query: vi.fn().mockResolvedValue({ rows: [] }),
    connect: vi.fn().mockResolvedValue({
      query: vi.fn().mockResolvedValue({ rows: [] }),
      release: vi.fn(),
    }),
    end: vi.fn().mockResolvedValue(undefined),
  },
}));

// Mock service layer for Fastify route testing
vi.mock('../src/modules/sessions/sessions.service.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/modules/sessions/sessions.service.js')>();

  return {
    ...actual,
    startWorkoutSession: vi.fn(async (userId: string, input: any) => {
      if (input.notes === 'conflict-trigger') {
        throw new actual.SessionConflictError(
          'An active workout session is already in progress. Please finish or cancel it before starting a new session.',
        );
      }
      if (input.routineId === '88888888-8888-8888-8888-888888888888') {
        throw new actual.SessionResourceNotFoundError(
          'Scheduled workout routine not found or not owned by user',
        );
      }
      return {
        id: '99999999-9999-9999-9999-999999999999',
        userId,
        routineId: input.routineId ?? null,
        startedAt: new Date(),
        completedAt: null,
        perceivedRpe: null,
        jointSoreness: null,
        hitPrescribedTargets: false,
        status: 'in_progress',
        notes: input.notes ?? null,
        routine: input.routineId
          ? {
              id: input.routineId,
              name: 'Push Day',
              dayNumber: 1,
            }
          : null,
        setLogs: [],
      };
    }),
    getActiveWorkoutSession: vi.fn(async (userId: string) => {
      if (userId === 'no-active-user-id') {
        return null;
      }
      return {
        id: '99999999-9999-9999-9999-999999999999',
        userId,
        routineId: '66666666-6666-6666-6666-666666666666',
        startedAt: new Date(Date.now() - 1800000), // 30 mins ago
        completedAt: null,
        status: 'in_progress',
        notes: null,
        routine: {
          id: '66666666-6666-6666-6666-666666666666',
          name: 'Push Day A',
          dayNumber: 1,
        },
        setLogs: [
          {
            id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
            sessionId: '99999999-9999-9999-9999-999999999999',
            exerciseId: '44444444-4444-4444-4444-444444444444',
            setNumber: 1,
            actualWeightKg: 80,
            actualReps: 10,
            rpe: 8,
            isWarmup: false,
            targetHit: true,
            exercise: {
              id: '44444444-4444-4444-4444-444444444444',
              name: 'Dumbbell Bench Press',
              primaryMuscleGroup: 'chest',
              movementPattern: 'horizontal_push',
              requiredEquipment: 'dumbbell',
            },
          },
        ],
        summary: {
          durationSeconds: 1800,
          durationMinutes: 30,
          totalVolumeKg: 800,
          totalSets: 1,
          workingSets: 1,
          hitPrescribedTargets: true,
        },
      };
    }),
    logExerciseSet: vi.fn(async (sessionId: string, userId: string, input: any) => {
      if (sessionId !== '99999999-9999-9999-9999-999999999999' || userId !== mockUser.id) {
        throw new actual.SessionResourceNotFoundError('Workout session not found');
      }
      if (input.exerciseId === '33333333-3333-3333-3333-333333333333') {
        throw new actual.SessionResourceNotFoundError('Exercise not found in catalogue');
      }
      if (input.setNumber === 999) {
        throw new actual.SessionValidationError(
          'Cannot log sets for a session with status "completed".',
        );
      }
      return {
        id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        sessionId,
        exerciseId: input.exerciseId,
        routineExerciseId: input.routineExerciseId ?? null,
        setNumber: input.setNumber,
        actualWeightKg: input.actualWeightKg,
        actualReps: input.actualReps,
        rpe: input.rpe ?? null,
        isWarmup: input.isWarmup ?? false,
        targetWeightKg: input.targetWeightKg ?? null,
        targetReps: input.targetReps ?? null,
        targetHit: input.targetHit ?? (input.targetReps ? input.actualReps >= input.targetReps : false),
        createdAt: new Date(),
        exercise: {
          id: input.exerciseId,
          name: 'Barbell Back Squat',
          primaryMuscleGroup: 'quads',
          movementPattern: 'squat',
          requiredEquipment: 'barbell',
        },
      };
    }),
    updateExerciseSet: vi.fn(async (sessionId: string, setId: string, userId: string, input: any) => {
      if (sessionId !== '99999999-9999-9999-9999-999999999999' || userId !== mockUser.id) {
        throw new actual.SessionResourceNotFoundError('Workout session not found');
      }
      if (setId !== 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') {
        throw new actual.SessionResourceNotFoundError('Set log not found in this workout session');
      }
      return {
        id: setId,
        sessionId,
        exerciseId: '44444444-4444-4444-4444-444444444444',
        setNumber: input.setNumber ?? 1,
        actualWeightKg: input.actualWeightKg ?? 85,
        actualReps: input.actualReps ?? 8,
        rpe: input.rpe ?? 9,
        isWarmup: input.isWarmup ?? false,
        targetHit: true,
        exercise: {
          id: '44444444-4444-4444-4444-444444444444',
          name: 'Dumbbell Bench Press',
          primaryMuscleGroup: 'chest',
          movementPattern: 'horizontal_push',
          requiredEquipment: 'dumbbell',
        },
      };
    }),
    deleteExerciseSet: vi.fn(async (sessionId: string, setId: string, userId: string) => {
      if (sessionId !== '99999999-9999-9999-9999-999999999999' || userId !== mockUser.id) {
        throw new actual.SessionResourceNotFoundError('Workout session not found');
      }
      if (setId === '00000000-0000-0000-0000-000000000000') {
        return false;
      }
      return true;
    }),
    finishWorkoutSession: vi.fn(async (sessionId: string, userId: string, input: any) => {
      if (sessionId !== '99999999-9999-9999-9999-999999999999' || userId !== mockUser.id) {
        throw new actual.SessionResourceNotFoundError('Workout session not found');
      }
      if (input.notes === 'already-completed') {
        throw new actual.SessionValidationError('Session is already completed and cannot be finished again.');
      }
      return {
        session: {
          id: sessionId,
          userId,
          status: 'completed',
          completedAt: new Date(),
          perceivedRpe: input.perceivedRpe ?? 8,
          jointSoreness: input.jointSoreness ?? 1,
          notes: input.notes ?? 'Great session',
          hitPrescribedTargets: true,
        },
        summary: {
          durationSeconds: 2700,
          durationMinutes: 45,
          totalVolumeKg: 2400,
          totalSets: 3,
          workingSets: 3,
          hitPrescribedTargets: true,
        },
      };
    }),
    hitPrescribedTargetsSession: vi.fn(async (sessionId: string, userId: string, input: any) => {
      if (sessionId !== '99999999-9999-9999-9999-999999999999' || userId !== mockUser.id) {
        throw new actual.SessionResourceNotFoundError('Workout session not found');
      }
      if (input.notes === 'already-completed') {
        throw new actual.SessionValidationError('Session is already completed and cannot be finished again.');
      }
      if (input.notes === 'freestyle-session') {
        throw new actual.SessionValidationError(
          'Cannot hit prescribed targets for a freestyle workout session without an assigned routine.',
        );
      }
      if (input.notes === 'no-exercises-routine') {
        throw new actual.SessionValidationError('Scheduled routine has no prescribed exercises.');
      }
      const isRetry = input.notes === 'retry-hit-prescribed';
      const createdSetsCount = isRetry ? 0 : 3;

      return {
        session: {
          id: sessionId,
          userId,
          routineId: '66666666-6666-6666-6666-666666666666',
          status: 'completed',
          completedAt: new Date(),
          perceivedRpe: input.perceivedRpe ?? 8,
          jointSoreness: input.jointSoreness ?? 1,
          notes: input.notes ?? 'All prescribed targets completed',
          hitPrescribedTargets: true,
          routine: {
            id: '66666666-6666-6666-6666-666666666666',
            name: 'Push Day A',
            dayNumber: 1,
          },
          setLogs: [
            {
              id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
              sessionId,
              exerciseId: '44444444-4444-4444-4444-444444444444',
              routineExerciseId: '77777777-7777-7777-7777-777777777777',
              setNumber: 1,
              targetWeightKg: 80,
              targetReps: 10,
              actualWeightKg: 80,
              actualReps: 10,
              rpe: 8,
              isWarmup: false,
              targetHit: true,
              exercise: {
                id: '44444444-4444-4444-4444-444444444444',
                name: 'Dumbbell Bench Press',
                primaryMuscleGroup: 'chest',
                movementPattern: 'horizontal_push',
                requiredEquipment: 'dumbbell',
              },
            },
            {
              id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
              sessionId,
              exerciseId: '44444444-4444-4444-4444-444444444444',
              routineExerciseId: '77777777-7777-7777-7777-777777777777',
              setNumber: 2,
              targetWeightKg: 80,
              targetReps: 10,
              actualWeightKg: 80,
              actualReps: 10,
              rpe: 8,
              isWarmup: false,
              targetHit: true,
              exercise: {
                id: '44444444-4444-4444-4444-444444444444',
                name: 'Dumbbell Bench Press',
                primaryMuscleGroup: 'chest',
                movementPattern: 'horizontal_push',
                requiredEquipment: 'dumbbell',
              },
            },
            {
              id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
              sessionId,
              exerciseId: '44444444-4444-4444-4444-444444444444',
              routineExerciseId: '77777777-7777-7777-7777-777777777777',
              setNumber: 3,
              targetWeightKg: 80,
              targetReps: 10,
              actualWeightKg: 80,
              actualReps: 10,
              rpe: 8,
              isWarmup: false,
              targetHit: true,
              exercise: {
                id: '44444444-4444-4444-4444-444444444444',
                name: 'Dumbbell Bench Press',
                primaryMuscleGroup: 'chest',
                movementPattern: 'horizontal_push',
                requiredEquipment: 'dumbbell',
              },
            },
          ],
        },
        summary: {
          durationSeconds: 2700,
          durationMinutes: 45,
          totalVolumeKg: 2400,
          totalSets: 3,
          workingSets: 3,
          hitPrescribedTargets: true,
        },
        createdSetsCount,
      };
    }),
    cancelWorkoutSession: vi.fn(async (sessionId: string, userId: string, input: any) => {
      if (sessionId !== '99999999-9999-9999-9999-999999999999' || userId !== mockUser.id) {
        throw new actual.SessionResourceNotFoundError('Workout session not found');
      }
      if (input.notes === 'already-cancelled') {
        throw new actual.SessionValidationError('Cannot cancel a session that is already abandoned.');
      }
      return {
        id: sessionId,
        userId,
        status: 'abandoned',
        completedAt: new Date(),
        notes: input.notes ?? 'Workout cut short',
      };
    }),
    listUserSessions: vi.fn(async (userId: string, query: any) => ({
      sessions: [
        {
          id: '99999999-9999-9999-9999-999999999999',
          userId,
          routineId: '66666666-6666-6666-6666-666666666666',
          startedAt: new Date(Date.now() - 3600000),
          completedAt: new Date(),
          status: 'completed',
          durationMinutes: 60,
        },
      ],
      meta: {
        total: 1,
        limit: query.limit ?? 20,
        offset: query.offset ?? 0,
        hasMore: false,
      },
    })),
    getUserSessionById: vi.fn(async (sessionId: string, userId: string) => {
      if (sessionId !== '99999999-9999-9999-9999-999999999999' || userId !== mockUser.id) {
        throw new actual.SessionResourceNotFoundError('Workout session not found');
      }
      return {
        id: sessionId,
        userId,
        routineId: '66666666-6666-6666-6666-666666666666',
        startedAt: new Date(Date.now() - 3600000),
        completedAt: new Date(),
        status: 'completed',
        perceivedRpe: 8,
        jointSoreness: 1,
        notes: 'Solid chest day',
        routine: {
          id: '66666666-6666-6666-6666-666666666666',
          name: 'Upper Body A',
          dayNumber: 1,
        },
        setLogs: [
          {
            id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
            sessionId,
            exerciseId: '44444444-4444-4444-4444-444444444444',
            setNumber: 1,
            actualWeightKg: 80,
            actualReps: 10,
            rpe: 8,
            isWarmup: false,
            targetHit: true,
            exercise: {
              id: '44444444-4444-4444-4444-444444444444',
              name: 'Dumbbell Bench Press',
              primaryMuscleGroup: 'chest',
              movementPattern: 'horizontal_push',
              requiredEquipment: 'dumbbell',
            },
          },
        ],
        summary: {
          durationSeconds: 3600,
          durationMinutes: 60,
          totalVolumeKg: 800,
          totalSets: 1,
          workingSets: 1,
          hitPrescribedTargets: true,
        },
      };
    }),
  };
});

import { buildApp } from '../src/app.js';
import { signAccessToken } from '../src/auth/jwt.js';

describe('Bruno AI Gym Buddy — Phase 4: Workout Sessions & Set Logging Suite', () => {
  // -------------------------------------------------------------------------
  // Part A: Pure Math / Metrics Engine Tests
  // -------------------------------------------------------------------------
  describe('Session Metrics Computation Engine', () => {
    it('computes duration, volume, and targets correctly for completed sessions', () => {
      const startTime = new Date('2026-10-19T10:00:00Z');
      const endTime = new Date('2026-10-19T10:45:00Z'); // 45 minutes = 2700s

      const mockSets: PopulatedSetLog[] = [
        {
          id: '1',
          sessionId: 's1',
          exerciseId: 'e1',
          routineExerciseId: null,
          setNumber: 1,
          targetWeightKg: 40,
          targetReps: 10,
          actualWeightKg: 40,
          actualReps: 10,
          rpe: 6,
          isWarmup: true, // Warmup: should NOT add to volume
          targetHit: true,
          createdAt: startTime,
          exercise: {
            id: 'e1',
            name: 'Bench Press',
            primaryMuscleGroup: 'chest',
            movementPattern: 'horizontal_push',
            requiredEquipment: 'barbell',
          },
        },
        {
          id: '2',
          sessionId: 's1',
          exerciseId: 'e1',
          routineExerciseId: null,
          setNumber: 2,
          targetWeightKg: 80,
          targetReps: 10,
          actualWeightKg: 80,
          actualReps: 10,
          rpe: 8,
          isWarmup: false, // Working set: 800 kg
          targetHit: true,
          createdAt: new Date('2026-10-19T10:10:00Z'),
          exercise: {
            id: 'e1',
            name: 'Bench Press',
            primaryMuscleGroup: 'chest',
            movementPattern: 'horizontal_push',
            requiredEquipment: 'barbell',
          },
        },
        {
          id: '3',
          sessionId: 's1',
          exerciseId: 'e1',
          routineExerciseId: null,
          setNumber: 3,
          targetWeightKg: 80,
          targetReps: 10,
          actualWeightKg: 80,
          actualReps: 8,
          rpe: 9.5,
          isWarmup: false, // Working set: 640 kg
          targetHit: false,
          createdAt: new Date('2026-10-19T10:20:00Z'),
          exercise: {
            id: 'e1',
            name: 'Bench Press',
            primaryMuscleGroup: 'chest',
            movementPattern: 'horizontal_push',
            requiredEquipment: 'barbell',
          },
        },
      ];

      const metrics = computeSessionMetrics(
        { startedAt: startTime, completedAt: endTime, hitPrescribedTargets: false },
        mockSets,
      );

      expect(metrics.durationSeconds).toBe(2700);
      expect(metrics.durationMinutes).toBe(45);
      expect(metrics.totalSets).toBe(3);
      expect(metrics.workingSets).toBe(2);
      expect(metrics.totalVolumeKg).toBe(1440); // 800 + 640
      expect(metrics.hitPrescribedTargets).toBe(false); // set 3 missed target
    });
  });

  // -------------------------------------------------------------------------
  // Part B: Fastify Route Integration & Auth Guards
  // -------------------------------------------------------------------------
  describe('Fastify Workout Sessions & Set Logging Endpoints', () => {
    const app = buildApp();
    const testUserId = mockUser.id;
    const testToken = signAccessToken(testUserId);
    const otherUserToken = signAccessToken('77777777-7777-7777-7777-777777777777');
    const sessionId = '99999999-9999-9999-9999-999999999999';
    const setId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

    // 1. Unauthenticated Request Guards (401 UNAUTHORIZED)
    describe('1. Unauthenticated Request Guards', () => {
      const endpoints = [
        { method: 'POST', url: '/api/v1/sessions/start', payload: {} },
        { method: 'GET', url: '/api/v1/sessions/active' },
        {
          method: 'POST',
          url: `/api/v1/sessions/${sessionId}/sets`,
          payload: {
            exerciseId: '44444444-4444-4444-4444-444444444444',
            setNumber: 1,
            actualWeightKg: 50,
            actualReps: 10,
          },
        },
        {
          method: 'PUT',
          url: `/api/v1/sessions/${sessionId}/sets/${setId}`,
          payload: { actualReps: 12 },
        },
        { method: 'DELETE', url: `/api/v1/sessions/${sessionId}/sets/${setId}` },
        { method: 'POST', url: `/api/v1/sessions/${sessionId}/finish`, payload: {} },
        { method: 'POST', url: `/api/v1/sessions/${sessionId}/hit-prescribed`, payload: {} },
        { method: 'POST', url: `/api/v1/sessions/${sessionId}/cancel`, payload: {} },
        { method: 'GET', url: '/api/v1/sessions' },
        { method: 'GET', url: `/api/v1/sessions/${sessionId}` },
      ];

      for (const ep of endpoints) {
        it(`rejects unauthenticated ${ep.method} ${ep.url} with 401 UNAUTHORIZED`, async () => {
          const res = await app.inject({
            method: ep.method as any,
            url: ep.url,
            payload: (ep as any).payload,
          });

          expect(res.statusCode).toBe(401);
          const body = res.json();
          expect(body.success).toBe(false);
          expect(body.error.code).toBe('UNAUTHORIZED');
        });
      }
    });

    // 2. Starting & Querying Active Sessions
    describe('2. POST /api/v1/sessions/start & GET /api/v1/sessions/active', () => {
      it('starts a new workout session successfully', async () => {
        const res = await app.inject({
          method: 'POST',
          url: '/api/v1/sessions/start',
          headers: { authorization: `Bearer ${testToken}` },
          payload: {
            routineId: '66666666-6666-6666-6666-666666666666',
            notes: 'Heavy bench focus',
          },
        });

        expect(res.statusCode).toBe(201);
        const body = res.json();
        expect(body.success).toBe(true);
        expect(body.data.id).toBe(sessionId);
        expect(body.data.status).toBe('in_progress');
      });

      it('prevents starting a second concurrent active session with 409 CONFLICT', async () => {
        const res = await app.inject({
          method: 'POST',
          url: '/api/v1/sessions/start',
          headers: { authorization: `Bearer ${testToken}` },
          payload: {
            notes: 'conflict-trigger',
          },
        });

        expect(res.statusCode).toBe(409);
        const body = res.json();
        expect(body.success).toBe(false);
        expect(body.error.code).toBe('CONFLICT');
        expect(body.error.message).toContain('already in progress');
      });

      it('returns 404 if routine does not exist or belongs to another user', async () => {
        const res = await app.inject({
          method: 'POST',
          url: '/api/v1/sessions/start',
          headers: { authorization: `Bearer ${testToken}` },
          payload: {
            routineId: '88888888-8888-8888-8888-888888888888',
          },
        });

        expect(res.statusCode).toBe(404);
        const body = res.json();
        expect(body.success).toBe(false);
        expect(body.error.code).toBe('RESOURCE_NOT_FOUND');
      });

      it('retrieves active workout session with summary metrics', async () => {
        const res = await app.inject({
          method: 'GET',
          url: '/api/v1/sessions/active',
          headers: { authorization: `Bearer ${testToken}` },
        });

        expect(res.statusCode).toBe(200);
        const body = res.json();
        expect(body.success).toBe(true);
        expect(body.data.id).toBe(sessionId);
        expect(body.data.summary).toBeDefined();
        expect(body.data.summary.totalVolumeKg).toBe(800);
      });
    });

    // 3. Set Logging & Manipulation
    describe('3. Set Logging & Editing (POST, PUT, DELETE)', () => {
      it('logs a new working set successfully via POST /sessions/:sessionId/sets', async () => {
        const res = await app.inject({
          method: 'POST',
          url: `/api/v1/sessions/${sessionId}/sets`,
          headers: { authorization: `Bearer ${testToken}` },
          payload: {
            exerciseId: '44444444-4444-4444-4444-444444444444',
            setNumber: 1,
            actualWeightKg: 100,
            actualReps: 5,
            rpe: 8.5,
            targetWeightKg: 100,
            targetReps: 5,
            isWarmup: false,
          },
        });

        expect(res.statusCode).toBe(201);
        const body = res.json();
        expect(body.success).toBe(true);
        expect(body.data.actualWeightKg).toBe(100);
        expect(body.data.actualReps).toBe(5);
        expect(body.data.targetHit).toBe(true);
      });

      it('rejects logging set with invalid exercise ID', async () => {
        const res = await app.inject({
          method: 'POST',
          url: `/api/v1/sessions/${sessionId}/sets`,
          headers: { authorization: `Bearer ${testToken}` },
          payload: {
            exerciseId: '33333333-3333-3333-3333-333333333333',
            setNumber: 1,
            actualWeightKg: 100,
            actualReps: 5,
          },
        });

        expect(res.statusCode).toBe(404);
        const body = res.json();
        expect(body.success).toBe(false);
        expect(body.error.code).toBe('RESOURCE_NOT_FOUND');
      });

      it('rejects logging set with negative weight or negative reps', async () => {
        const res = await app.inject({
          method: 'POST',
          url: `/api/v1/sessions/${sessionId}/sets`,
          headers: { authorization: `Bearer ${testToken}` },
          payload: {
            exerciseId: '44444444-4444-4444-4444-444444444444',
            setNumber: 1,
            actualWeightKg: -10,
            actualReps: -5,
          },
        });

        expect(res.statusCode).toBe(400);
        const body = res.json();
        expect(body.success).toBe(false);
        expect(body.error.code).toBe('VALIDATION_ERROR');
      });

      it('updates a recorded set via PUT /sessions/:sessionId/sets/:setId', async () => {
        const res = await app.inject({
          method: 'PUT',
          url: `/api/v1/sessions/${sessionId}/sets/${setId}`,
          headers: { authorization: `Bearer ${testToken}` },
          payload: {
            actualWeightKg: 85,
            actualReps: 8,
            rpe: 9,
          },
        });

        expect(res.statusCode).toBe(200);
        const body = res.json();
        expect(body.success).toBe(true);
        expect(body.data.actualWeightKg).toBe(85);
        expect(body.data.actualReps).toBe(8);
      });

      it('deletes an incorrectly recorded set via DELETE /sessions/:sessionId/sets/:setId', async () => {
        const res = await app.inject({
          method: 'DELETE',
          url: `/api/v1/sessions/${sessionId}/sets/${setId}`,
          headers: { authorization: `Bearer ${testToken}` },
        });

        expect(res.statusCode).toBe(200);
        const body = res.json();
        expect(body.success).toBe(true);
        expect(body.data.message).toContain('deleted');
      });
    });

    // 4. Finishing & Cancelling Sessions
    describe('4. Session Completion & Cancellation', () => {
      it('finishes an in-progress session and records summary metrics', async () => {
        const res = await app.inject({
          method: 'POST',
          url: `/api/v1/sessions/${sessionId}/finish`,
          headers: { authorization: `Bearer ${testToken}` },
          payload: {
            perceivedRpe: 8,
            jointSoreness: 1,
            notes: 'Felt great throughout.',
          },
        });

        expect(res.statusCode).toBe(200);
        const body = res.json();
        expect(body.success).toBe(true);
        expect(body.data.session.status).toBe('completed');
        expect(body.data.summary.durationMinutes).toBe(45);
        expect(body.data.summary.totalVolumeKg).toBe(2400);
      });

      it('rejects finishing an already completed session with 400 VALIDATION_ERROR', async () => {
        const res = await app.inject({
          method: 'POST',
          url: `/api/v1/sessions/${sessionId}/finish`,
          headers: { authorization: `Bearer ${testToken}` },
          payload: {
            notes: 'already-completed',
          },
        });

        expect(res.statusCode).toBe(400);
        const body = res.json();
        expect(body.success).toBe(false);
        expect(body.error.code).toBe('VALIDATION_ERROR');
      });

      it('cancels an in-progress session safely via POST /sessions/:sessionId/cancel', async () => {
        const res = await app.inject({
          method: 'POST',
          url: `/api/v1/sessions/${sessionId}/cancel`,
          headers: { authorization: `Bearer ${testToken}` },
          payload: {
            notes: 'Left early for appointment',
          },
        });

        expect(res.statusCode).toBe(200);
        const body = res.json();
        expect(body.success).toBe(true);
        expect(body.data.session.status).toBe('abandoned');
      });
    });

    // 4b. One-Tap Hit Prescribed Targets Workout Logging
    describe('4b. One-Tap Hit Prescribed Targets Logging (POST /sessions/:sessionId/hit-prescribed)', () => {
      it('successfully auto-logs prescribed sets and completes session in one tap', async () => {
        const res = await app.inject({
          method: 'POST',
          url: `/api/v1/sessions/${sessionId}/hit-prescribed`,
          headers: { authorization: `Bearer ${testToken}` },
          payload: {
            perceivedRpe: 8,
            jointSoreness: 1,
            notes: 'Hit all prescribed reps with textbook form',
          },
        });

        expect(res.statusCode).toBe(200);
        const body = res.json();
        expect(body.success).toBe(true);
        expect(body.data.session.status).toBe('completed');
        expect(body.data.session.hitPrescribedTargets).toBe(true);
        expect(body.data.summary.hitPrescribedTargets).toBe(true);
        expect(body.data.createdSetsCount).toBe(3);
        expect(body.data.session.setLogs).toHaveLength(3);
        expect(body.data.session.setLogs[0].targetHit).toBe(true);
      });

      it('safely handles idempotency on retry without creating duplicate set logs', async () => {
        const res = await app.inject({
          method: 'POST',
          url: `/api/v1/sessions/${sessionId}/hit-prescribed`,
          headers: { authorization: `Bearer ${testToken}` },
          payload: {
            notes: 'retry-hit-prescribed',
          },
        });

        expect(res.statusCode).toBe(200);
        const body = res.json();
        expect(body.success).toBe(true);
        expect(body.data.createdSetsCount).toBe(0);
        expect(body.data.session.hitPrescribedTargets).toBe(true);
      });

      it('rejects hitting prescribed targets for freestyle sessions without a routine', async () => {
        const res = await app.inject({
          method: 'POST',
          url: `/api/v1/sessions/${sessionId}/hit-prescribed`,
          headers: { authorization: `Bearer ${testToken}` },
          payload: {
            notes: 'freestyle-session',
          },
        });

        expect(res.statusCode).toBe(400);
        const body = res.json();
        expect(body.success).toBe(false);
        expect(body.error.code).toBe('VALIDATION_ERROR');
        expect(body.error.message).toContain('freestyle');
      });

      it('rejects hitting prescribed targets on an already finished session', async () => {
        const res = await app.inject({
          method: 'POST',
          url: `/api/v1/sessions/${sessionId}/hit-prescribed`,
          headers: { authorization: `Bearer ${testToken}` },
          payload: {
            notes: 'already-completed',
          },
        });

        expect(res.statusCode).toBe(400);
        const body = res.json();
        expect(body.success).toBe(false);
        expect(body.error.code).toBe('VALIDATION_ERROR');
      });

      it('rejects hitting prescribed targets for unowned session with 404 RESOURCE_NOT_FOUND', async () => {
        const res = await app.inject({
          method: 'POST',
          url: `/api/v1/sessions/${sessionId}/hit-prescribed`,
          headers: { authorization: `Bearer ${otherUserToken}` },
          payload: {},
        });

        expect(res.statusCode).toBe(404);
        const body = res.json();
        expect(body.success).toBe(false);
        expect(body.error.code).toBe('RESOURCE_NOT_FOUND');
      });

      it('rejects invalid session UUID format with 400 VALIDATION_ERROR', async () => {
        const res = await app.inject({
          method: 'POST',
          url: '/api/v1/sessions/not-a-uuid/hit-prescribed',
          headers: { authorization: `Bearer ${testToken}` },
          payload: {},
        });

        expect(res.statusCode).toBe(400);
        const body = res.json();
        expect(body.success).toBe(false);
        expect(body.error.code).toBe('VALIDATION_ERROR');
      });

      it('rejects invalid RPE score (>10) with 400 VALIDATION_ERROR', async () => {
        const res = await app.inject({
          method: 'POST',
          url: `/api/v1/sessions/${sessionId}/hit-prescribed`,
          headers: { authorization: `Bearer ${testToken}` },
          payload: {
            perceivedRpe: 15,
          },
        });

        expect(res.statusCode).toBe(400);
        const body = res.json();
        expect(body.success).toBe(false);
        expect(body.error.code).toBe('VALIDATION_ERROR');
      });
    });

    // 5. Querying History & Single Session Breakdown
    describe('5. GET /sessions & GET /sessions/:sessionId', () => {
      it('lists user session history with pagination', async () => {
        const res = await app.inject({
          method: 'GET',
          url: '/api/v1/sessions?limit=10&offset=0',
          headers: { authorization: `Bearer ${testToken}` },
        });

        expect(res.statusCode).toBe(200);
        const body = res.json();
        expect(body.success).toBe(true);
        expect(Array.isArray(body.data)).toBe(true);
        expect(body.meta.total).toBe(1);
      });

      it('retrieves detailed session breakdown by ID', async () => {
        const res = await app.inject({
          method: 'GET',
          url: `/api/v1/sessions/${sessionId}`,
          headers: { authorization: `Bearer ${testToken}` },
        });

        expect(res.statusCode).toBe(200);
        const body = res.json();
        expect(body.success).toBe(true);
        expect(body.data.id).toBe(sessionId);
        expect(body.data.setLogs).toHaveLength(1);
        expect(body.data.summary).toBeDefined();
      });

      it('returns 404 when querying session belonging to another user', async () => {
        const res = await app.inject({
          method: 'GET',
          url: `/api/v1/sessions/${sessionId}`,
          headers: { authorization: `Bearer ${otherUserToken}` },
        });

        expect(res.statusCode).toBe(404);
        const body = res.json();
        expect(body.success).toBe(false);
        expect(body.error.code).toBe('RESOURCE_NOT_FOUND');
      });
    });
  });
});
