import { describe, expect, it, vi } from 'vitest';
import type { Exercise, GymProfile, UserConstraint } from '../src/db/schema.js';
import { curatedExercises } from '../src/db/seeds/exercises.js';
import {
  generateWorkoutProgramPlan,
  ProgramValidationError as GeneratorValidationError,
} from '../src/modules/programs/programs.generator.js';

// Setup mock user for route tests
const mockUser = {
  id: '11111111-1111-1111-1111-111111111111',
  email: 'lifter@example.com',
  name: 'Lifter One',
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
        onConflictDoUpdate: vi.fn().mockResolvedValue([]),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn().mockResolvedValue([{ id: 'mock-id' }]),
        })),
      })),
    })),
    transaction: vi.fn(async (cb: any) => cb({
      insert: vi.fn(() => ({
        values: vi.fn(() => ({
          returning: vi.fn().mockResolvedValue([{ id: 'mock-id' }]),
        })),
      })),
      update: vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn().mockResolvedValue([]),
        })),
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
vi.mock('../src/modules/programs/programs.service.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/modules/programs/programs.service.js')>();

  return {
    ...actual,
    generatePersonalizedProgram: vi.fn(async (userId: string, input: any) => ({
      id: '55555555-5555-5555-5555-555555555555',
      userId,
      name: input.name ?? 'Generated Program',
      splitType: input.splitType,
      trainingDaysPerWeek: input.trainingDaysPerWeek,
      durationWeeks: input.durationWeeks ?? 8,
      targetSessionDurationMinutes: input.targetSessionDurationMinutes ?? 45,
      isActive: true,
      gymProfileId: input.gymProfileId ?? '22222222-2222-2222-2222-222222222222',
      routines: [
        {
          id: '66666666-6666-6666-6666-666666666666',
          programId: '55555555-5555-5555-5555-555555555555',
          name: 'Day 1 - Push Focus',
          dayNumber: 1,
          targetRpe: 8,
          exercises: [
            {
              id: '77777777-7777-7777-7777-777777777777',
              routineId: '66666666-6666-6666-6666-666666666666',
              exerciseId: '44444444-4444-4444-4444-444444444444',
              orderIndex: 0,
              prescribedSets: 3,
              repRangeMin: 8,
              repRangeMax: 12,
              targetRpe: 8,
              restSeconds: 90,
              exercise: {
                name: 'Dumbbell Bench Press',
                primaryMuscleGroup: 'chest',
                movementPattern: 'horizontal_push',
                requiredEquipment: 'dumbbell',
              },
            },
          ],
        },
      ],
    })),
    createCustomProgram: vi.fn(async (userId: string, data: any) => ({
      id: '55555555-5555-5555-5555-555555555555',
      userId,
      ...data,
      isActive: data.isActive ?? false,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    })),
    listUserPrograms: vi.fn(async (userId: string, isActive?: boolean) => [
      {
        id: '55555555-5555-5555-5555-555555555555',
        userId,
        name: 'Hypertrophy Block',
        splitType: 'upper_lower',
        trainingDaysPerWeek: 4,
        durationWeeks: 8,
        targetSessionDurationMinutes: 50,
        isActive: isActive !== false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      },
    ]),
    getUserProgramById: vi.fn(async (id: string, userId: string) => {
      if (id === '55555555-5555-5555-5555-555555555555' && userId === mockUser.id) {
        return {
          id,
          userId,
          name: 'Hypertrophy Block',
          splitType: 'upper_lower',
          trainingDaysPerWeek: 4,
          durationWeeks: 8,
          targetSessionDurationMinutes: 50,
          isActive: true,
          routines: [],
        };
      }
      return null;
    }),
    updateUserProgram: vi.fn(async (id: string, userId: string, data: any) => {
      if (id === '55555555-5555-5555-5555-555555555555' && userId === mockUser.id) {
        return {
          id,
          userId,
          name: data.name ?? 'Updated Program',
          splitType: 'upper_lower',
          trainingDaysPerWeek: 4,
          durationWeeks: 8,
          targetSessionDurationMinutes: 50,
          isActive: true,
          ...data,
        };
      }
      return null;
    }),
    deleteUserProgram: vi.fn(async (id: string, userId: string) => {
      return id === '55555555-5555-5555-5555-555555555555' && userId === mockUser.id;
    }),
    activateUserProgram: vi.fn(async (id: string, userId: string) => {
      if (id === '55555555-5555-5555-5555-555555555555' && userId === mockUser.id) {
        return {
          id,
          userId,
          name: 'Hypertrophy Block',
          isActive: true,
        };
      }
      return null;
    }),
    addRoutineToProgram: vi.fn(async (programId: string, userId: string, data: any) => ({
      id: '66666666-6666-6666-6666-666666666666',
      programId,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    })),
    updateRoutine: vi.fn(async (programId: string, id: string, userId: string, data: any) => {
      if (id === '66666666-6666-6666-6666-666666666666' && userId === mockUser.id) {
        return {
          id,
          programId,
          name: data.name ?? 'Upper Day 1',
          dayNumber: data.dayNumber ?? 1,
          targetRpe: 8,
        };
      }
      return null;
    }),
    deleteRoutine: vi.fn(async (programId: string, id: string, userId: string) => {
      return id === '66666666-6666-6666-6666-666666666666' && userId === mockUser.id;
    }),
    addExerciseToRoutine: vi.fn(async (routineId: string, userId: string, data: any) => ({
      id: '77777777-7777-7777-7777-777777777777',
      routineId,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    })),
    updateRoutineExercise: vi.fn(async (routineId: string, id: string, userId: string, data: any) => {
      if (id === '77777777-7777-7777-7777-777777777777' && userId === mockUser.id) {
        return {
          id,
          routineId,
          exerciseId: '44444444-4444-4444-4444-444444444444',
          orderIndex: 0,
          prescribedSets: data.prescribedSets ?? 3,
          repRangeMin: data.repRangeMin ?? 8,
          repRangeMax: data.repRangeMax ?? 12,
          targetRpe: data.targetRpe ?? 8,
          restSeconds: data.restSeconds ?? 90,
        };
      }
      return null;
    }),
    deleteRoutineExercise: vi.fn(async (routineId: string, id: string, userId: string) => {
      return id === '77777777-7777-7777-7777-777777777777' && userId === mockUser.id;
    }),
    swapRoutineExercise: vi.fn(async (routineId: string, id: string, userId: string, data: any) => {
      if (id !== '77777777-7777-7777-7777-777777777777' || userId !== mockUser.id) {
        throw new actual.ProgramResourceNotFoundError('Routine exercise not found');
      }
      if (data.replacementExerciseId === 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') {
        throw new actual.ProgramValidationError('Replacement exercise requires barbell which is missing from gym profile');
      }
      if (data.replacementExerciseId === 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb') {
        throw new actual.ProgramValidationError('Replacement exercise is contraindicated for active constraint: lower_back');
      }
      return {
        id,
        routineId,
        exerciseId: data.replacementExerciseId,
        orderIndex: 0,
        prescribedSets: 3,
        repRangeMin: 8,
        repRangeMax: 12,
        targetRpe: 8,
        restSeconds: 90,
        exercise: {
          id: data.replacementExerciseId,
          name: 'Replacement Exercise',
          primaryMuscleGroup: 'chest',
          movementPattern: 'horizontal_push',
          requiredEquipment: 'dumbbell',
        },
      };
    }),

  };
});

import { buildApp } from '../src/app.js';
import { signAccessToken } from '../src/auth/jwt.js';

describe('Bruno AI Gym Buddy — Phase 3: Personalized Workout Program Generation & Management', () => {
  // -------------------------------------------------------------------------
  // Part A: Scientific Workout Program Generation Engine (Pure Generator Tests)
  // -------------------------------------------------------------------------
  describe('Workout Program Generator (Pure Engine)', () => {
    // Map curated 40 exercises to mock DB Exercise objects with UUIDs
    const dbExercises: Exercise[] = curatedExercises.map((seed, index) => ({
      id: `00000000-0000-0000-0000-${String(index + 1).padStart(12, '0')}`,
      name: seed.name,
      primaryMuscleGroup: seed.primaryMuscleGroup,
      secondaryMuscleGroups: seed.secondaryMuscleGroups,
      movementPattern: seed.movementPattern,
      requiredEquipment: seed.requiredEquipment,
      contraindicatedInjuries: seed.contraindicatedInjuries,
      instructions: seed.instructions ?? null,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const commercialGymProfile: GymProfile = {
      id: '22222222-2222-2222-2222-222222222222',
      userId: mockUser.id,
      name: 'Commercial Gym',
      environmentType: 'commercial',
      hasBarbell: true,
      hasDumbbells: true,
      hasMachines: true,
      hasCableStack: true,
      hasSmithMachine: true,
      hasSquatRack: true,
      hasBench: true,
      hasAdjustableBench: true,
      hasPullupBar: true,
      hasDipStation: true,
      hasResistanceBands: true,
      hasKettlebells: true,
      hasCardioEquipment: true,
      customEquipment: [],
      isDefault: true,
      notes: null,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const homeDumbbellProfile: GymProfile = {
      id: '33333333-3333-3333-3333-333333333333',
      userId: mockUser.id,
      name: 'Home Dumbbell Corner',
      environmentType: 'home',
      hasBarbell: false,
      hasDumbbells: true,
      hasMachines: false,
      hasCableStack: false,
      hasSmithMachine: false,
      hasSquatRack: false,
      hasBench: false,
      hasAdjustableBench: true,
      hasPullupBar: true,
      hasDipStation: false,
      hasResistanceBands: true,
      hasKettlebells: false,
      hasCardioEquipment: false,
      customEquipment: [],
      isDefault: false,
      notes: null,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('generates a 3-day Full Body hypertrophy program for a commercial gym', () => {
      const plan = generateWorkoutProgramPlan({
        input: {
          splitType: 'full_body',
          trainingDaysPerWeek: 3,
          goal: 'hypertrophy',
          experienceLevel: 'intermediate',
          targetSessionDurationMinutes: 45,
        },
        exercises: dbExercises,
        gymProfile: commercialGymProfile,
        activeConstraints: [],
      });

      expect(plan.splitType).toBe('full_body');
      expect(plan.trainingDaysPerWeek).toBe(3);
      expect(plan.routines.length).toBe(3);

      for (const routine of plan.routines) {
        expect(routine.exercises.length).toBeGreaterThanOrEqual(4);
        for (const ex of routine.exercises) {
          expect(ex.repRangeMin).toBe(8);
          expect(ex.repRangeMax).toBe(12);
          expect(ex.restSeconds).toBe(90);
          expect(ex.prescribedSets).toBeGreaterThanOrEqual(3);
        }
      }
    });

    it('adapts rep ranges and rest periods for strength goals', () => {
      const plan = generateWorkoutProgramPlan({
        input: {
          splitType: 'upper_lower',
          trainingDaysPerWeek: 4,
          goal: 'strength',
          experienceLevel: 'advanced',
          targetSessionDurationMinutes: 60,
        },
        exercises: dbExercises,
        gymProfile: commercialGymProfile,
        activeConstraints: [],
      });

      expect(plan.splitType).toBe('upper_lower');
      expect(plan.routines.length).toBe(4);

      const firstEx = plan.routines[0].exercises[0];
      expect(firstEx.repRangeMin).toBe(5);
      expect(firstEx.repRangeMax).toBe(8);
      expect(firstEx.restSeconds).toBe(150);
      expect(firstEx.targetRpe).toBe(8.5);
    });

    it('adapts rep ranges and rest periods for endurance goals', () => {
      const plan = generateWorkoutProgramPlan({
        input: {
          splitType: 'upper_lower',
          trainingDaysPerWeek: 4,
          goal: 'endurance',
          experienceLevel: 'beginner',
          targetSessionDurationMinutes: 30,
        },
        exercises: dbExercises,
        gymProfile: commercialGymProfile,
        activeConstraints: [],
      });

      const firstEx = plan.routines[0].exercises[0];
      expect(firstEx.repRangeMin).toBe(12);
      expect(firstEx.repRangeMax).toBe(15);
      expect(firstEx.restSeconds).toBe(60);
      expect(firstEx.targetRpe).toBe(7.5);
    });

    it('strictly respects equipment grounding: never assigns barbell or machine to dumbbell-only gym', () => {
      const plan = generateWorkoutProgramPlan({
        input: {
          splitType: 'upper_lower',
          trainingDaysPerWeek: 4,
          goal: 'hypertrophy',
          experienceLevel: 'beginner',
          targetSessionDurationMinutes: 45,
        },
        exercises: dbExercises,
        gymProfile: homeDumbbellProfile,
        activeConstraints: [],
      });

      for (const routine of plan.routines) {
        for (const ex of routine.exercises) {
          const matchedDb = dbExercises.find((d) => d.id === ex.exerciseId);
          expect(matchedDb).toBeDefined();
          expect(['barbell', 'machine', 'cable']).not.toContain(matchedDb?.requiredEquipment);
        }
      }
    });

    it('strictly respects physical constraints: excludes exercises contraindicated for lower_back pain', () => {
      const lowerBackConstraint: UserConstraint = {
        id: '44444444-4444-4444-4444-444444444444',
        userId: mockUser.id,
        jointArea: 'lower_back',
        restrictionType: 'pain',
        severity: 'moderate',
        aggravatingMovements: ['axial_loading'],
        notes: 'Avoid heavy spinal loading',
        isActive: true,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const plan = generateWorkoutProgramPlan({
        input: {
          splitType: 'full_body',
          trainingDaysPerWeek: 3,
          goal: 'hypertrophy',
          experienceLevel: 'intermediate',
          targetSessionDurationMinutes: 45,
        },
        exercises: dbExercises,
        gymProfile: commercialGymProfile,
        activeConstraints: [lowerBackConstraint],
      });

      for (const routine of plan.routines) {
        for (const ex of routine.exercises) {
          const matchedDb = dbExercises.find((d) => d.id === ex.exerciseId);
          expect(matchedDb?.contraindicatedInjuries).not.toContain('lower_back');
          expect(matchedDb?.name).not.toBe('Barbell Back Squat');
          expect(matchedDb?.name).not.toBe('Romanian Deadlift');
        }
      }
    });

    it('throws ProgramValidationError if available exercises are empty', () => {
      expect(() => {
        generateWorkoutProgramPlan({
          input: {
            splitType: 'full_body',
            trainingDaysPerWeek: 3,
            goal: 'hypertrophy',
          },
          exercises: [],
          gymProfile: commercialGymProfile,
          activeConstraints: [],
        });
      }).toThrowError(GeneratorValidationError);
    });
  });

  // -------------------------------------------------------------------------
  // Part B: Fastify Route Integration & Auth Guards
  // -------------------------------------------------------------------------
  describe('Fastify Program & Routine API Routes', () => {
    const app = buildApp();
    const testUserId = mockUser.id;
    const testToken = signAccessToken(testUserId);
    const otherUserToken = signAccessToken('99999999-9999-9999-9999-999999999999');

    // 1. Unauthenticated Guards (401 UNAUTHORIZED)
    describe('1. Unauthenticated Request Guards', () => {
      const endpoints = [
        { method: 'POST', url: '/api/v1/programs/generate', payload: { splitType: 'full_body' } },
        { method: 'POST', url: '/api/v1/programs', payload: { name: 'Program', splitType: 'full_body' } },
        { method: 'GET', url: '/api/v1/programs' },
        { method: 'GET', url: '/api/v1/programs/55555555-5555-5555-5555-555555555555' },
        { method: 'PUT', url: '/api/v1/programs/55555555-5555-5555-5555-555555555555', payload: { name: 'Updated' } },
        { method: 'DELETE', url: '/api/v1/programs/55555555-5555-5555-5555-555555555555' },
        { method: 'PATCH', url: '/api/v1/programs/55555555-5555-5555-5555-555555555555/activate' },
        { method: 'POST', url: '/api/v1/programs/55555555-5555-5555-5555-555555555555/routines', payload: { name: 'Leg Day', dayNumber: 1 } },
        { method: 'PUT', url: '/api/v1/programs/55555555-5555-5555-5555-555555555555/routines/66666666-6666-6666-6666-666666666666', payload: { name: 'Leg Day Updated' } },
        { method: 'DELETE', url: '/api/v1/programs/55555555-5555-5555-5555-555555555555/routines/66666666-6666-6666-6666-666666666666' },
        { method: 'POST', url: '/api/v1/routines/66666666-6666-6666-6666-666666666666/exercises', payload: { exerciseId: '44444444-4444-4444-4444-444444444444', prescribedSets: 3, repRangeMin: 8, repRangeMax: 12 } },
        { method: 'PUT', url: '/api/v1/routines/66666666-6666-6666-6666-666666666666/exercises/77777777-7777-7777-7777-777777777777', payload: { prescribedSets: 4 } },
        { method: 'DELETE', url: '/api/v1/routines/66666666-6666-6666-6666-666666666666/exercises/77777777-7777-7777-7777-777777777777' },
        { method: 'POST', url: '/api/v1/routines/66666666-6666-6666-6666-666666666666/exercises/77777777-7777-7777-7777-777777777777/swap', payload: { replacementExerciseId: '00000000-0000-0000-0000-000000000005' } },
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

    // 2. Program Generation Endpoint (POST /programs/generate)
    describe('2. POST /api/v1/programs/generate', () => {
      it('successfully generates and saves a personalized program', async () => {
        const res = await app.inject({
          method: 'POST',
          url: '/api/v1/programs/generate',
          headers: { authorization: `Bearer ${testToken}` },
          payload: {
            splitType: 'full_body',
            trainingDaysPerWeek: 3,
            goal: 'hypertrophy',
            targetSessionDurationMinutes: 45,
          },
        });

        expect(res.statusCode).toBe(201);
        const body = res.json();
        expect(body.success).toBe(true);
        expect(body.data).toHaveProperty('id');
        expect(body.data.splitType).toBe('full_body');
        expect(body.data.routines).toHaveLength(1);
      });

      it('rejects invalid generation payload (e.g. invalid days for split)', async () => {
        const res = await app.inject({
          method: 'POST',
          url: '/api/v1/programs/generate',
          headers: { authorization: `Bearer ${testToken}` },
          payload: {
            splitType: 'push_pull_legs',
            trainingDaysPerWeek: 2, // Push/Pull/Legs requires 3 or 6 days
            goal: 'hypertrophy',
          },
        });

        expect(res.statusCode).toBe(400);
        const body = res.json();
        expect(body.success).toBe(false);
        expect(body.error.code).toBe('VALIDATION_ERROR');
      });
    });

    // 3. Program CRUD
    describe('3. Program CRUD & Activation', () => {
      it('creates a manual program via POST /programs', async () => {
        const res = await app.inject({
          method: 'POST',
          url: '/api/v1/programs',
          headers: { authorization: `Bearer ${testToken}` },
          payload: {
            name: 'Manual Program',
            splitType: 'upper_lower',
            trainingDaysPerWeek: 4,
            durationWeeks: 8,
            targetSessionDurationMinutes: 50,
          },
        });

        expect(res.statusCode).toBe(201);
        const body = res.json();
        expect(body.success).toBe(true);
        expect(body.data.name).toBe('Manual Program');
      });

      it('lists user programs via GET /programs', async () => {
        const res = await app.inject({
          method: 'GET',
          url: '/api/v1/programs?isActive=true',
          headers: { authorization: `Bearer ${testToken}` },
        });

        expect(res.statusCode).toBe(200);
        const body = res.json();
        expect(body.success).toBe(true);
        expect(Array.isArray(body.data)).toBe(true);
      });

      it('retrieves single program by ID with nested routines', async () => {
        const res = await app.inject({
          method: 'GET',
          url: '/api/v1/programs/55555555-5555-5555-5555-555555555555',
          headers: { authorization: `Bearer ${testToken}` },
        });

        expect(res.statusCode).toBe(200);
        const body = res.json();
        expect(body.success).toBe(true);
        expect(body.data.id).toBe('55555555-5555-5555-5555-555555555555');
      });

      it('returns 404 when other user attempts to access program', async () => {
        const res = await app.inject({
          method: 'GET',
          url: '/api/v1/programs/55555555-5555-5555-5555-555555555555',
          headers: { authorization: `Bearer ${otherUserToken}` },
        });

        expect(res.statusCode).toBe(404);
        const body = res.json();
        expect(body.success).toBe(false);
        expect(body.error.code).toBe('RESOURCE_NOT_FOUND');
      });

      it('updates program metadata via PUT /programs/:id', async () => {
        const res = await app.inject({
          method: 'PUT',
          url: '/api/v1/programs/55555555-5555-5555-5555-555555555555',
          headers: { authorization: `Bearer ${testToken}` },
          payload: {
            name: 'Updated Block Name',
          },
        });

        expect(res.statusCode).toBe(200);
        const body = res.json();
        expect(body.success).toBe(true);
        expect(body.data.name).toBe('Updated Block Name');
      });

      it('activates a program via PATCH /programs/:id/activate', async () => {
        const res = await app.inject({
          method: 'PATCH',
          url: '/api/v1/programs/55555555-5555-5555-5555-555555555555/activate',
          headers: { authorization: `Bearer ${testToken}` },
        });

        expect(res.statusCode).toBe(200);
        const body = res.json();
        expect(body.success).toBe(true);
        expect(body.data.isActive).toBe(true);
      });

      it('soft-deletes a program via DELETE /programs/:id', async () => {
        const res = await app.inject({
          method: 'DELETE',
          url: '/api/v1/programs/55555555-5555-5555-5555-555555555555',
          headers: { authorization: `Bearer ${testToken}` },
        });

        expect(res.statusCode).toBe(200);
        const body = res.json();
        expect(body.success).toBe(true);
        expect(body.data.message).toContain('deleted');
      });
    });

    // 4. Routine & Exercise Management
    describe('4. Routines & Exercises Management', () => {
      it('adds routine to program via POST /programs/:programId/routines', async () => {
        const res = await app.inject({
          method: 'POST',
          url: '/api/v1/programs/55555555-5555-5555-5555-555555555555/routines',
          headers: { authorization: `Bearer ${testToken}` },
          payload: {
            name: 'Leg Day',
            dayNumber: 3,
            targetRpe: 8,
          },
        });

        expect(res.statusCode).toBe(201);
        const body = res.json();
        expect(body.success).toBe(true);
        expect(body.data.name).toBe('Leg Day');
      });

      it('adds exercise to routine via POST /routines/:routineId/exercises', async () => {
        const res = await app.inject({
          method: 'POST',
          url: '/api/v1/routines/66666666-6666-6666-6666-666666666666/exercises',
          headers: { authorization: `Bearer ${testToken}` },
          payload: {
            exerciseId: '44444444-4444-4444-4444-444444444444',
            orderIndex: 0,
            prescribedSets: 3,
            repRangeMin: 8,
            repRangeMax: 12,
            targetRpe: 8,
            restSeconds: 90,
          },
        });

        expect(res.statusCode).toBe(201);
        const body = res.json();
        expect(body.success).toBe(true);
        expect(body.data.prescribedSets).toBe(3);
      });

      it('updates routine exercise via PUT /routines/:routineId/exercises/:id', async () => {
        const res = await app.inject({
          method: 'PUT',
          url: '/api/v1/routines/66666666-6666-6666-6666-666666666666/exercises/77777777-7777-7777-7777-777777777777',
          headers: { authorization: `Bearer ${testToken}` },
          payload: {
            prescribedSets: 4,
            targetRpe: 9,
          },
        });

        expect(res.statusCode).toBe(200);
        const body = res.json();
        expect(body.success).toBe(true);
        expect(body.data.prescribedSets).toBe(4);
      });

      it('deletes routine exercise via DELETE /routines/:routineId/exercises/:id', async () => {
        const res = await app.inject({
          method: 'DELETE',
          url: '/api/v1/routines/66666666-6666-6666-6666-666666666666/exercises/77777777-7777-7777-7777-777777777777',
          headers: { authorization: `Bearer ${testToken}` },
        });

        expect(res.statusCode).toBe(200);
        const body = res.json();
        expect(body.success).toBe(true);
        expect(body.data.message).toContain('removed');
      });
    });

    // 5. Safe Exercise Swapping
    describe('5. Safe Exercise Swapping (POST /routines/:routineId/exercises/:id/swap)', () => {
      it('rejects swap if replacement exercise is incompatible with user equipment', async () => {
        const res = await app.inject({
          method: 'POST',
          url: '/api/v1/routines/66666666-6666-6666-6666-666666666666/exercises/77777777-7777-7777-7777-777777777777/swap',
          headers: { authorization: `Bearer ${testToken}` },
          payload: {
            replacementExerciseId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          },
        });

        expect(res.statusCode).toBe(400);
        const body = res.json();
        expect(body.success).toBe(false);
        expect(body.error.code).toBe('VALIDATION_ERROR');
        expect(body.error.message).toContain('gym profile');
      });


      it('rejects swap if replacement exercise violates active physical constraints', async () => {
        const res = await app.inject({
          method: 'POST',
          url: '/api/v1/routines/66666666-6666-6666-6666-666666666666/exercises/77777777-7777-7777-7777-777777777777/swap',
          headers: { authorization: `Bearer ${testToken}` },
          payload: {
            replacementExerciseId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
          },
        });

        expect(res.statusCode).toBe(400);
        const body = res.json();
        expect(body.success).toBe(false);
        expect(body.error.code).toBe('VALIDATION_ERROR');
        expect(body.error.message).toContain('constraint');
      });

      it('successfully swaps exercise when replacement is safe and available', async () => {
        const res = await app.inject({
          method: 'POST',
          url: '/api/v1/routines/66666666-6666-6666-6666-666666666666/exercises/77777777-7777-7777-7777-777777777777/swap',
          headers: { authorization: `Bearer ${testToken}` },
          payload: {
            replacementExerciseId: '00000000-0000-0000-0000-000000000005',
          },
        });

        expect(res.statusCode).toBe(200);
        const body = res.json();
        expect(body.success).toBe(true);
        expect(body.data.exerciseId).toBe('00000000-0000-0000-0000-000000000005');
      });
    });
  });
});

