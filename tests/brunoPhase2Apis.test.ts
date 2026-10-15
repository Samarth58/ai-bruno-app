import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock DB connection before importing app
const mockUser = {
  id: '11111111-1111-1111-1111-111111111111',
  email: 'test@example.com',
  name: 'Test Lifter',
  role: 'user',
  deletedAt: null,
};

const mockProfiles: any[] = [];
const mockConstraints: any[] = [];

vi.mock('../src/db/connection.js', () => {
  return {
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
    },
    pool: {
      query: vi.fn().mockResolvedValue({ rows: [] }),
      connect: vi.fn().mockResolvedValue({
        query: vi.fn().mockResolvedValue({ rows: [] }),
        release: vi.fn(),
      }),
      end: vi.fn().mockResolvedValue(undefined),
    },
  };
});

// Mock service layers for predictable isolated unit testing of routes & ownership
vi.mock('../src/modules/gymProfiles/gymProfiles.service.js', () => ({
  createGymProfile: vi.fn(async (userId: string, data: any) => ({
    id: '22222222-2222-2222-2222-222222222222',
    userId,
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deletedAt: null,
  })),
  listGymProfiles: vi.fn(async (userId: string) => [
    {
      id: '22222222-2222-2222-2222-222222222222',
      userId,
      name: 'Commercial Gym',
      environmentType: 'commercial',
      hasBarbell: true,
      hasSquatRack: true,
      hasBench: true,
      hasCableStack: true,
      hasSmithMachine: true,
      hasPullupBar: true,
      hasAdjustableBench: true,
      hasDumbbells: true,
      isDefault: true,
    },
  ]),
  getGymProfileById: vi.fn(async (id: string, userId: string) => {
    if (id === '22222222-2222-2222-2222-222222222222' && userId === mockUser.id) {
      return {
        id,
        userId,
        name: 'Commercial Gym',
        environmentType: 'commercial',
        isDefault: true,
      };
    }
    // Cross-user or not found returns null
    return null;
  }),
  updateGymProfile: vi.fn(async (id: string, userId: string, data: any) => {
    if (id === '22222222-2222-2222-2222-222222222222' && userId === mockUser.id) {
      return {
        id,
        userId,
        name: data.name ?? 'Commercial Gym',
        ...data,
      };
    }
    return null;
  }),
  deleteGymProfile: vi.fn(async (id: string, userId: string) => {
    return id === '22222222-2222-2222-2222-222222222222' && userId === mockUser.id;
  }),
}));

vi.mock('../src/modules/constraints/constraints.service.js', () => ({
  createConstraint: vi.fn(async (userId: string, data: any) => ({
    id: '33333333-3333-3333-3333-333333333333',
    userId,
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deletedAt: null,
  })),
  listConstraints: vi.fn(async (userId: string, isActive?: boolean) => [
    {
      id: '33333333-3333-3333-3333-333333333333',
      userId,
      jointArea: 'lower_back',
      restrictionType: 'pain',
      isActive: isActive !== false,
    },
  ]),
  getConstraintById: vi.fn(async (id: string, userId: string) => {
    if (id === '33333333-3333-3333-3333-333333333333' && userId === mockUser.id) {
      return {
        id,
        userId,
        jointArea: 'lower_back',
        restrictionType: 'pain',
        isActive: true,
      };
    }
    return null;
  }),
  updateConstraint: vi.fn(async (id: string, userId: string, data: any) => {
    if (id === '33333333-3333-3333-3333-333333333333' && userId === mockUser.id) {
      return {
        id,
        userId,
        jointArea: data.jointArea ?? 'lower_back',
        ...data,
      };
    }
    return null;
  }),
  deleteConstraint: vi.fn(async (id: string, userId: string) => {
    return id === '33333333-3333-3333-3333-333333333333' && userId === mockUser.id;
  }),
}));

vi.mock('../src/modules/exercises/exercises.service.js', () => ({
  listFilteredExercises: vi.fn(async (userId: string, query: any) => ({
    exercises: [
      {
        id: '44444444-4444-4444-4444-444444444444',
        name: 'Belt Squat',
        primaryMuscleGroup: 'quads',
        movementPattern: 'squat',
        requiredEquipment: 'machine',
        contraindicatedInjuries: ['knee_pain'],
      },
    ],
    meta: {
      totalAvailable: 40,
      totalMatched: 1,
      excludedByEquipment: 10,
      excludedByContraindications: 5,
      equipmentProfileApplied: 'Commercial Gym',
      activeConstraintsApplied: ['lower_back'],
      disclaimer: 'DISCLAIMER: Algorithmic heuristic only.',
    },
  })),
  getExerciseDetails: vi.fn(async (id: string) => {
    if (id === '44444444-4444-4444-4444-444444444444') {
      return {
        id,
        name: 'Belt Squat',
        primaryMuscleGroup: 'quads',
        movementPattern: 'squat',
        requiredEquipment: 'machine',
        contraindicatedInjuries: ['knee_pain'],
      };
    }
    return null;
  }),
}));

import { buildApp } from '../src/app.js';
import { signAccessToken } from '../src/auth/jwt.js';

describe('Bruno AI Gym Buddy — Phase 2: APIs & Validation Suite', () => {
  const app = buildApp();
  const testUserId = mockUser.id;
  const testToken = signAccessToken(testUserId);
  const otherUserToken = signAccessToken('99999999-9999-9999-9999-999999999999');

  // -------------------------------------------------------------------------
  // 1. Unauthenticated Request Guards (401 UNAUTHORIZED)
  // -------------------------------------------------------------------------
  describe('Unauthenticated Request Guards', () => {
    const endpoints = [
      { method: 'GET', url: '/api/v1/gym-profiles' },
      { method: 'POST', url: '/api/v1/gym-profiles' },
      { method: 'GET', url: '/api/v1/gym-profiles/22222222-2222-2222-2222-222222222222' },
      { method: 'PUT', url: '/api/v1/gym-profiles/22222222-2222-2222-2222-222222222222' },
      { method: 'DELETE', url: '/api/v1/gym-profiles/22222222-2222-2222-2222-222222222222' },
      { method: 'GET', url: '/api/v1/constraints' },
      { method: 'POST', url: '/api/v1/constraints' },
      { method: 'GET', url: '/api/v1/constraints/33333333-3333-3333-3333-333333333333' },
      { method: 'PUT', url: '/api/v1/constraints/33333333-3333-3333-3333-333333333333' },
      { method: 'DELETE', url: '/api/v1/constraints/33333333-3333-3333-3333-333333333333' },
      { method: 'GET', url: '/api/v1/exercises' },
      { method: 'GET', url: '/api/v1/exercises/44444444-4444-4444-4444-444444444444' },
    ];

    for (const ep of endpoints) {
      it(`rejects unauthenticated ${ep.method} ${ep.url} with 401 UNAUTHORIZED`, async () => {
        const res = await app.inject({
          method: ep.method as any,
          url: ep.url,
        });

        expect(res.statusCode).toBe(401);
        const body = res.json();
        expect(body.success).toBe(false);
        expect(body.error.code).toBe('UNAUTHORIZED');
      });
    }
  });

  // -------------------------------------------------------------------------
  // 2. Input & Schema Validation (400 VALIDATION_ERROR)
  // -------------------------------------------------------------------------
  describe('Input Validation & Zod Envelopes', () => {
    it('rejects POST /gym-profiles with empty name', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/gym-profiles',
        headers: { authorization: `Bearer ${testToken}` },
        payload: {
          name: '',
          environmentType: 'commercial',
        },
      });

      expect(res.statusCode).toBe(400);
      const body = res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
      expect(body.error.details.length).toBeGreaterThan(0);
    });

    it('rejects POST /gym-profiles with invalid environmentType', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/gym-profiles',
        headers: { authorization: `Bearer ${testToken}` },
        payload: {
          name: 'My Gym',
          environmentType: 'invalid_environment',
        },
      });

      expect(res.statusCode).toBe(400);
      const body = res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects GET /gym-profiles/:id with malformed UUID', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/gym-profiles/not-a-valid-uuid',
        headers: { authorization: `Bearer ${testToken}` },
      });

      expect(res.statusCode).toBe(400);
      const body = res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects PUT /gym-profiles/:id with empty payload', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: '/api/v1/gym-profiles/22222222-2222-2222-2222-222222222222',
        headers: { authorization: `Bearer ${testToken}` },
        payload: {},
      });

      expect(res.statusCode).toBe(400);
      const body = res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects POST /constraints with missing jointArea', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/constraints',
        headers: { authorization: `Bearer ${testToken}` },
        payload: {
          restrictionType: 'pain',
        },
      });

      expect(res.statusCode).toBe(400);
      const body = res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects GET /constraints/:id with invalid UUID', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/constraints/123-bad-id',
        headers: { authorization: `Bearer ${testToken}` },
      });

      expect(res.statusCode).toBe(400);
      const body = res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects PUT /constraints/:id with empty payload', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: '/api/v1/constraints/33333333-3333-3333-3333-333333333333',
        headers: { authorization: `Bearer ${testToken}` },
        payload: {},
      });

      expect(res.statusCode).toBe(400);
      const body = res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects GET /exercises with invalid gymProfileId UUID query', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/exercises?gymProfileId=invalid-uuid',
        headers: { authorization: `Bearer ${testToken}` },
      });

      expect(res.statusCode).toBe(400);
      const body = res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // -------------------------------------------------------------------------
  // 3. Authenticated CRUD & User Ownership Enforcement
  // -------------------------------------------------------------------------
  describe('Authenticated CRUD & Ownership Enforcement', () => {
    it('creates a new gym profile successfully (201 Created)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/gym-profiles',
        headers: { authorization: `Bearer ${testToken}` },
        payload: {
          name: 'Home Garage Gym',
          environmentType: 'home',
          hasBarbell: true,
          hasSquatRack: true,
          hasBench: true,
          hasDumbbells: true,
          isDefault: true,
        },
      });

      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('id');
      expect(body.data.name).toBe('Home Garage Gym');
    });

    it('lists user gym profiles (200 OK)', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/gym-profiles',
        headers: { authorization: `Bearer ${testToken}` },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('retrieves own gym profile by ID (200 OK)', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/gym-profiles/22222222-2222-2222-2222-222222222222',
        headers: { authorization: `Bearer ${testToken}` },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data.id).toBe('22222222-2222-2222-2222-222222222222');
    });

    it('enforces ownership: returns 404 when querying another user gym profile', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/gym-profiles/00000000-0000-0000-0000-000000000000',
        headers: { authorization: `Bearer ${testToken}` },
      });

      expect(res.statusCode).toBe(404);
      const body = res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('RESOURCE_NOT_FOUND');
    });

    it('updates own gym profile successfully (200 OK)', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: '/api/v1/gym-profiles/22222222-2222-2222-2222-222222222222',
        headers: { authorization: `Bearer ${testToken}` },
        payload: {
          name: 'Renovated Gym',
          hasCableStack: true,
        },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data.name).toBe('Renovated Gym');
    });

    it('deletes own gym profile (200 OK)', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: '/api/v1/gym-profiles/22222222-2222-2222-2222-222222222222',
        headers: { authorization: `Bearer ${testToken}` },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data.message).toBe('Gym profile deleted successfully');
    });

    it('creates a physical constraint successfully (201 Created)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/constraints',
        headers: { authorization: `Bearer ${testToken}` },
        payload: {
          jointArea: 'lower_back',
          restrictionType: 'pain',
          notes: 'Sensitive to heavy axial loading',
          isActive: true,
        },
      });

      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data.jointArea).toBe('lower_back');
    });

    it('lists user physical constraints (200 OK)', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/constraints',
        headers: { authorization: `Bearer ${testToken}` },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('enforces ownership: returns 404 when querying another user constraint', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/constraints/00000000-0000-0000-0000-000000000000',
        headers: { authorization: `Bearer ${testToken}` },
      });

      expect(res.statusCode).toBe(404);
      const body = res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('RESOURCE_NOT_FOUND');
    });

    it('deletes own physical constraint (200 OK)', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: '/api/v1/constraints/33333333-3333-3333-3333-333333333333',
        headers: { authorization: `Bearer ${testToken}` },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data.message).toBe('Constraint deleted successfully');
    });
  });

  // -------------------------------------------------------------------------
  // 4. Exercise Catalog & Filtering Endpoint
  // -------------------------------------------------------------------------
  describe('Exercise Catalog & Filtering (/api/v1/exercises)', () => {
    it('returns filtered exercises with metadata and medical disclaimer', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/exercises?useActiveConstraints=true',
        headers: { authorization: `Bearer ${testToken}` },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.meta).toHaveProperty('disclaimer');
      expect(body.meta.disclaimer).toContain('DISCLAIMER');
      expect(body.meta).toHaveProperty('activeConstraintsApplied');
    });

    it('returns single exercise details by ID', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/exercises/44444444-4444-4444-4444-444444444444',
        headers: { authorization: `Bearer ${testToken}` },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data.name).toBe('Belt Squat');
    });

    it('returns 404 for unknown exercise ID', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/exercises/00000000-0000-0000-0000-000000000000',
        headers: { authorization: `Bearer ${testToken}` },
      });

      expect(res.statusCode).toBe(404);
      const body = res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('RESOURCE_NOT_FOUND');
    });
  });
});
