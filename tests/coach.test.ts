import { beforeEach, describe, expect, it, vi } from 'vitest';
import { aiService } from '../src/ai/ai.service.js';
import {
  AiError,
  AiInvalidCredentialsError,
  AiModelNotFoundError,
  AiOverloadedError,
  AiProviderUnavailableError,
  AiQuotaExhaustedError,
  AiRateLimitError,
  AiTimeoutError,
} from '../src/ai/ai.types.js';
import { AnthropicProvider } from '../src/ai/providers/anthropic.provider.js';
import {
  classifyGeminiError,
  GeminiAiProvider,
} from '../src/ai/providers/gemini.provider.js';
import { MockAiProvider } from '../src/ai/providers/mock.provider.js';
import { OpenAiProvider } from '../src/ai/providers/openai.provider.js';
import { signAccessToken } from '../src/auth/jwt.js';
import { curatedExercises } from '../src/db/seeds/exercises.js';
import {
  detectAcuteMedicalRedFlags,
  findWorkoutSessionById,
  processCoachChat,
} from '../src/modules/coach/coach.service.js';

// Setup Mock User for AuthGuard
const testUserId = '11111111-1111-1111-1111-111111111111';
const otherUserId = '99999999-9999-9999-9999-999999999999';

const mockUser = {
  id: testUserId,
  email: 'lifter@example.com',
  name: 'Bruno Lifter',
  role: 'user',
  deletedAt: null,
};

// Mock Profiles and Constraints
const mockGymProfile = {
  id: '22222222-2222-2222-2222-222222222222',
  userId: testUserId,
  name: 'Home Dumbbell Corner',
  environmentType: 'home',
  hasBarbell: false,
  hasSquatRack: false,
  hasBench: true,
  hasCableStack: false,
  hasSmithMachine: false,
  hasPullupBar: false,
  hasAdjustableBench: true,
  hasDumbbells: true,
  maxDumbbellWeightKg: 24,
  isDefault: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

const otherUserGymProfile = {
  id: '77777777-7777-7777-7777-777777777777',
  userId: otherUserId,
  name: "Other User's Gym",
  environmentType: 'commercial',
  isDefault: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

const mockConstraints = [
  {
    id: '33333333-3333-3333-3333-333333333333',
    userId: testUserId,
    jointArea: 'lower_back',
    restrictionType: 'pain',
    notes: 'Mild disc sensitivity under spinal axial loading',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  },
];

const mockSession = {
  id: '55555555-5555-5555-5555-555555555555',
  userId: testUserId,
  routineId: null,
  startedAt: new Date(),
  completedAt: null,
  perceivedRpe: 7.5,
  jointSoreness: 2,
  hitPrescribedTargets: true,
  status: 'in_progress',
  notes: 'Feeling good, slight fatigue in delts',
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

const mockExercisesList = curatedExercises.map((e, idx) => ({
  id: `00000000-0000-0000-0000-${String(idx).padStart(12, '0')}`,
  name: e.name,
  primaryMuscleGroup: e.primaryMuscleGroup,
  secondaryMuscleGroups: e.secondaryMuscleGroups,
  movementPattern: e.movementPattern,
  requiredEquipment: e.requiredEquipment,
  contraindicatedInjuries: e.contraindicatedInjuries,
  instructions: e.instructions ?? null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
}));

// Mock Database Connection
vi.mock('../src/db/connection.js', () => {
  return {
    db: {
      select: vi.fn(() => ({
        from: vi.fn((table: any) => ({
          where: vi.fn((condition: any) => ({
            limit: vi.fn().mockImplementation(() => {
              return Promise.resolve([mockUser]);
            }),
            orderBy: vi.fn().mockImplementation(() => {
              return Promise.resolve([mockGymProfile]);
            }),
          })),
          orderBy: vi.fn().mockResolvedValue([]),
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

// Mock repositories for repositories called in coach.service
vi.mock('../src/modules/gymProfiles/gymProfiles.repository.js', () => ({
  findDefaultGymProfile: vi.fn(async (userId: string) => {
    return userId === testUserId ? mockGymProfile : null;
  }),
  findGymProfileById: vi.fn(async (id: string, userId: string) => {
    if (id === mockGymProfile.id && userId === testUserId) return mockGymProfile;
    if (id === otherUserGymProfile.id && userId === otherUserId) return otherUserGymProfile;
    return null;
  }),
  findGymProfilesByUserId: vi.fn(async (userId: string) => {
    return userId === testUserId ? [mockGymProfile] : [];
  }),
}));

vi.mock('../src/modules/constraints/constraints.repository.js', () => ({
  findConstraintsByUserId: vi.fn(async (userId: string, isActive?: boolean) => {
    if (userId === testUserId) {
      return typeof isActive === 'boolean'
        ? mockConstraints.filter((c) => c.isActive === isActive)
        : mockConstraints;
    }
    return [];
  }),
}));

vi.mock('../src/modules/exercises/exercises.repository.js', () => ({
  findAllActiveExercises: vi.fn(async () => mockExercisesList),
  findExerciseById: vi.fn(async (id: string) => {
    return mockExercisesList.find((e) => e.id === id) ?? null;
  }),
}));

import { buildApp } from '../src/app.js';

describe('Bruno AI Gym Buddy — AI Integration & Coach Suite', () => {
  const app = buildApp();
  const validToken = signAccessToken(testUserId);
  const otherUserToken = signAccessToken(otherUserId);

  beforeEach(() => {
    // Reset AI service to default mock provider for predictable testing
    aiService.setProvider(new MockAiProvider());
  });

  // =========================================================================
  // 1. Provider Layer & Adapter Tests
  // =========================================================================
  describe('Provider Layer & Adapters', () => {
    it('MockAiProvider generates personalized fitness answers and suggested exercises', async () => {
      const mock = new MockAiProvider();
      const res = await mock.generateChatResponse({
        systemPrompt: 'You are Bruno',
        userMessage: 'What can I do for push day with dumbbells?',
      });

      expect(res.reply).toContain('Push day');
      expect(res.suggestedExercises).toBeDefined();
      expect(res.suggestedExercises?.length).toBeGreaterThan(0);
      expect(res.providerName).toBe('mock');
    });

    it('MockAiProvider simulates provider timeouts', async () => {
      const mock = new MockAiProvider({ forcedError: 'timeout' });
      await expect(
        mock.generateChatResponse({ systemPrompt: '', userMessage: 'test' }),
      ).rejects.toThrow(AiTimeoutError);
    });

    it('MockAiProvider simulates provider rate limits', async () => {
      const mock = new MockAiProvider({ forcedError: 'rate_limit' });
      await expect(
        mock.generateChatResponse({ systemPrompt: '', userMessage: 'test' }),
      ).rejects.toThrow(AiRateLimitError);
    });

    it('GeminiAiProvider rejects initialization without an API key', () => {
      expect(() => new GeminiAiProvider({ apiKey: '' })).toThrow('Gemini API key is required');
    });

    it('OpenAiProvider rejects initialization without an API key', () => {
      expect(() => new OpenAiProvider({ apiKey: '' })).toThrow('OpenAI API key is required');
    });

    it('AnthropicProvider rejects initialization without an API key', () => {
      expect(() => new AnthropicProvider({ apiKey: '' })).toThrow('Anthropic API key is required');
    });

    it('GeminiAiProvider maps successful responses and passes x-goog-api-key in headers', async () => {
      const originalFetch = globalThis.fetch;
      let capturedUrl = '';
      let capturedHeaders: Record<string, string> = {};
      globalThis.fetch = vi.fn().mockImplementation((url: string, init: any) => {
        capturedUrl = url;
        capturedHeaders = (init?.headers as Record<string, string>) || {};
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            candidates: [
              {
                content: {
                  parts: [{ text: "Let's hit a solid push workout! Focus on strict form." }],
                },
              },
            ],
            usageMetadata: {
              promptTokenCount: 15,
              candidatesTokenCount: 12,
              totalTokenCount: 27,
            },
          }),
        });
      });

      try {
        const gemini = new GeminiAiProvider({ apiKey: 'mock-gemini-key' });
        const res = await gemini.generateChatResponse({
          systemPrompt: 'System',
          userMessage: 'Hello',
        });

        expect(res.reply).toBe("Let's hit a solid push workout! Focus on strict form.");
        expect(res.rawUsage?.totalTokens).toBe(27);
        expect(capturedHeaders['x-goog-api-key']).toBe('mock-gemini-key');
        expect(capturedUrl).not.toContain('mock-gemini-key');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('AiService resolves Gemini provider with GEMINI_API_KEY', () => {
      const prevEnv = process.env.NODE_ENV;
      const prevGemini = process.env.GEMINI_API_KEY;
      const prevProvider = process.env.AI_PROVIDER;
      try {
        process.env.NODE_ENV = 'production';
        process.env.AI_PROVIDER = 'gemini';
        process.env.GEMINI_API_KEY = 'test-gemini-key';
        delete process.env.AI_API_KEY;

        const customService = new (aiService.constructor as any)();
        const provider = customService.getProvider();
        expect(provider.name).toBe('gemini');
      } finally {
        process.env.NODE_ENV = prevEnv;
        if (prevGemini) process.env.GEMINI_API_KEY = prevGemini;
        else delete process.env.GEMINI_API_KEY;
        if (prevProvider) process.env.AI_PROVIDER = prevProvider;
        else delete process.env.AI_PROVIDER;
      }
    });

    it('OpenAiProvider maps 429 rate limit errors to AiRateLimitError', async () => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({ error: { message: 'Rate limit exceeded' } }),
      } as any);

      try {
        const openai = new OpenAiProvider({ apiKey: 'mock-openai-key' });
        await expect(
          openai.generateChatResponse({ systemPrompt: '', userMessage: 'hi' }),
        ).rejects.toThrow(AiRateLimitError);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('AiService cleanly handles unconfigured provider in non-test mode', () => {
      const customService = new (aiService.constructor as any)();
      customService.setForceUnconfigured(true);
      expect(() => customService.getProvider()).toThrow(AiProviderUnavailableError);
    });

    it('classifyGeminiError maps various upstream error formats to sanitized categories', () => {
      // 503 Model Overloaded
      const overload = classifyGeminiError(
        503,
        JSON.stringify({
          error: {
            code: 503,
            message:
              'This model is currently experiencing high demand. Spikes in demand are usually temporary.',
            status: 'UNAVAILABLE',
          },
        }),
      );
      expect(overload.category).toBe('MODEL_OVERLOADED');
      expect(overload.isRetryable).toBe(true);
      expect(overload.clientMessage).toContain('high demand');

      // 429 Quota Exhausted
      const quota = classifyGeminiError(
        429,
        JSON.stringify({
          error: {
            code: 429,
            message: 'Resource has been exhausted (e.g. check quota).',
            status: 'RESOURCE_EXHAUSTED',
            details: [{ reason: 'QUOTA_EXCEEDED' }],
          },
        }),
      );
      expect(quota.category).toBe('QUOTA_EXHAUSTED');
      expect(quota.isRetryable).toBe(false);
      expect(quota.clientMessage).toContain('quota');

      // 429 Transient Rate Limit
      const rateLimit = classifyGeminiError(
        429,
        JSON.stringify({
          error: {
            code: 429,
            message: 'Rate limit exceeded for requests per minute.',
          },
        }),
      );
      expect(rateLimit.category).toBe('RATE_LIMIT_EXCEEDED');
      expect(rateLimit.isRetryable).toBe(true);
      expect(rateLimit.clientMessage).toContain('rate limit');

      // 400 Invalid API Key
      const invalidKey = classifyGeminiError(
        400,
        JSON.stringify({
          error: {
            code: 400,
            message: 'API key not valid. Please pass a valid API key.',
            status: 'INVALID_ARGUMENT',
            details: [{ reason: 'API_KEY_INVALID' }],
          },
        }),
      );
      expect(invalidKey.category).toBe('INVALID_CREDENTIALS');
      expect(invalidKey.isRetryable).toBe(false);
      expect(invalidKey.clientMessage).not.toContain('API key not valid');

      // 404 Model Not Found
      const notFound = classifyGeminiError(
        404,
        JSON.stringify({
          error: {
            code: 404,
            message: 'models/gemini-unknown is not found',
            status: 'NOT_FOUND',
          },
        }),
      );
      expect(notFound.category).toBe('MODEL_NOT_FOUND');
      expect(notFound.isRetryable).toBe(false);
    });

    it('GeminiAiProvider retries transient 503 model overload and succeeds on subsequent attempt', async () => {
      const originalFetch = globalThis.fetch;
      let callCount = 0;

      globalThis.fetch = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            ok: false,
            status: 503,
            text: async () =>
              JSON.stringify({
                error: {
                  code: 503,
                  message:
                    'This model is currently experiencing high demand. Spikes in demand are usually temporary.',
                  status: 'UNAVAILABLE',
                },
              }),
            headers: new Headers(),
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            candidates: [
              {
                content: {
                  parts: [{ text: 'Push session planned: 3 sets of DB bench press!' }],
                },
              },
            ],
          }),
        });
      });

      try {
        const gemini = new GeminiAiProvider({
          apiKey: 'mock-key',
          modelName: 'gemini-3.8-flash',
          retryOptions: { maxRetries: 2, initialDelayMs: 5, maxDelayMs: 10 },
        });

        const res = await gemini.generateChatResponse({
          systemPrompt: 'System',
          userMessage: 'What should I do for chest?',
        });

        expect(callCount).toBe(2);
        expect(res.reply).toBe('Push session planned: 3 sets of DB bench press!');
        expect(res.modelName).toBe('gemini-3.8-flash');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('GeminiAiProvider exhausts bounded retries on persistent 503 model overload and throws AiOverloadedError', async () => {
      const originalFetch = globalThis.fetch;
      let callCount = 0;

      globalThis.fetch = vi.fn().mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          ok: false,
          status: 503,
          text: async () =>
            JSON.stringify({
              error: {
                code: 503,
                message:
                  'This model is currently experiencing high demand. Spikes in demand are usually temporary.',
                status: 'UNAVAILABLE',
              },
            }),
          headers: new Headers(),
        });
      });

      try {
        const gemini = new GeminiAiProvider({
          apiKey: 'mock-key',
          retryOptions: { maxRetries: 2, initialDelayMs: 5, maxDelayMs: 10 },
          fallbackModels: [],
        });

        await expect(
          gemini.generateChatResponse({ systemPrompt: 'System', userMessage: 'test' }),
        ).rejects.toThrow(AiOverloadedError);

        expect(callCount).toBe(3); // Initial attempt + 2 retries
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('GeminiAiProvider seamlessly falls back to fallbackModels when primary is overloaded', async () => {
      const originalFetch = globalThis.fetch;
      const calledModels: string[] = [];

      globalThis.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes('gemini-3.8-flash')) {
          calledModels.push('gemini-3.8-flash');
          return Promise.resolve({
            ok: false,
            status: 503,
            text: async () =>
              JSON.stringify({
                error: {
                  code: 503,
                  message: 'This model is currently experiencing high demand.',
                  status: 'UNAVAILABLE',
                },
              }),
            headers: new Headers(),
          });
        }

        if (url.includes('gemini-3.5-flash-lite')) {
          calledModels.push('gemini-3.5-flash-lite');
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({
              candidates: [
                {
                  content: {
                    parts: [{ text: 'Here is a beginner dumbbell workout: 3 sets of floor press!' }],
                  },
                },
              ],
            }),
          });
        }

        return Promise.reject(new Error('Unexpected model'));
      });

      try {
        const gemini = new GeminiAiProvider({
          apiKey: 'mock-key',
          modelName: 'gemini-3.8-flash',
          retryOptions: { maxRetries: 0 }, // Fail fast on 3.8-flash to trigger fallback
          fallbackModels: ['gemini-3.5-flash-lite'],
        });

        const res = await gemini.generateChatResponse({
          systemPrompt: 'System',
          userMessage: 'Help me train',
        });

        expect(calledModels).toContain('gemini-3.8-flash');
        expect(calledModels).toContain('gemini-3.5-flash-lite');
        expect(res.reply).toContain('beginner dumbbell workout');
        expect(res.modelName).toBe('gemini-3.5-flash-lite');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('GeminiAiProvider immediately fails without retries on invalid credentials (400/401/403 API_KEY_INVALID)', async () => {
      const originalFetch = globalThis.fetch;
      let callCount = 0;

      globalThis.fetch = vi.fn().mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          ok: false,
          status: 400,
          text: async () =>
            JSON.stringify({
              error: {
                code: 400,
                message: 'API key not valid. Please pass a valid API key.',
                status: 'INVALID_ARGUMENT',
                details: [{ reason: 'API_KEY_INVALID' }],
              },
            }),
          headers: new Headers(),
        });
      });

      try {
        const gemini = new GeminiAiProvider({
          apiKey: 'invalid-key',
          retryOptions: { maxRetries: 2, initialDelayMs: 5, maxDelayMs: 10 },
        });

        await expect(
          gemini.generateChatResponse({ systemPrompt: '', userMessage: 'test' }),
        ).rejects.toThrow(AiInvalidCredentialsError);

        expect(callCount).toBe(1); // Must fail fast without retrying bad credentials
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('GeminiAiProvider immediately fails without retries on quota exhaustion', async () => {
      const originalFetch = globalThis.fetch;
      let callCount = 0;

      globalThis.fetch = vi.fn().mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          ok: false,
          status: 429,
          text: async () =>
            JSON.stringify({
              error: {
                code: 429,
                message: 'Quota exceeded for quota metric: GenerateContentRequestsPerDay',
                status: 'RESOURCE_EXHAUSTED',
                details: [{ reason: 'QUOTA_EXCEEDED' }],
              },
            }),
          headers: new Headers(),
        });
      });

      try {
        const gemini = new GeminiAiProvider({
          apiKey: 'mock-key',
          retryOptions: { maxRetries: 2, initialDelayMs: 5, maxDelayMs: 10 },
        });

        await expect(
          gemini.generateChatResponse({ systemPrompt: '', userMessage: 'test' }),
        ).rejects.toThrow(AiQuotaExhaustedError);

        expect(callCount).toBe(1); // Must not retry exhausted daily quota
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('GeminiAiProvider immediately fails without retries on 404 model not found', async () => {
      const originalFetch = globalThis.fetch;
      let callCount = 0;

      globalThis.fetch = vi.fn().mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          ok: false,
          status: 404,
          text: async () =>
            JSON.stringify({
              error: {
                code: 404,
                message: 'models/unknown-model is not found',
                status: 'NOT_FOUND',
              },
            }),
          headers: new Headers(),
        });
      });

      try {
        const gemini = new GeminiAiProvider({
          apiKey: 'mock-key',
          modelName: 'unknown-model',
          retryOptions: { maxRetries: 2, initialDelayMs: 5, maxDelayMs: 10 },
        });

        await expect(
          gemini.generateChatResponse({ systemPrompt: '', userMessage: 'test' }),
        ).rejects.toThrow(AiModelNotFoundError);

        expect(callCount).toBe(1);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });

  // =========================================================================
  // 2. Deterministic Fitness Safety & Grounding
  // =========================================================================
  describe('Fitness Safety & Deterministic Grounding', () => {
    it('detects acute injury red flags for sharp pain and loud pops', () => {
      expect(detectAcuteMedicalRedFlags('I felt a sharp pain in my shoulder')).toContain(
        'Medical Safety Advisory',
      );
      expect(detectAcuteMedicalRedFlags('I heard a pop in my knee during squats')).toContain(
        'Medical Safety Advisory',
      );
      expect(detectAcuteMedicalRedFlags('I think I tore my rotator cuff')).toContain(
        'Medical Safety Advisory',
      );
      expect(detectAcuteMedicalRedFlags('I have chest pain and dizziness')).toContain(
        'Medical Safety Advisory',
      );
    });

    it('allows benign training questions without medical alerts', () => {
      expect(detectAcuteMedicalRedFlags('How many sets of dumbbell curls should I do?')).toBeNull();
      expect(detectAcuteMedicalRedFlags('Can you suggest a push-pull-legs routine?')).toBeNull();
    });

    it('detects and warns if AI suggests an exercise contraindicated by user lower back pain', async () => {
      // Mock AI suggests Barbell Back Squat to user with lower back sensitivity
      const mock = new MockAiProvider({
        customReply: 'I suggest trying Barbell Back Squat and Dumbbell Bench Press today!',
        customSuggestedExercises: ['Barbell Back Squat', 'Dumbbell Bench Press'],
      });
      aiService.setProvider(mock);

      const res = await processCoachChat(testUserId, 'What should I do?');

      expect(res.data.userContext.activeConstraints).toContain('lower_back');
      // Barbell Back Squat must be flagged as NOT compatible
      const squat = res.data.suggestedExercises.find((e) => e.name === 'Barbell Back Squat');
      expect(squat).toBeDefined();
      expect(squat?.isCompatible).toBe(false);
      expect(squat?.reason).toContain('Contraindicated');

      // Safety warning must be added to the response
      expect(res.data.safetyAlert).toContain('Barbell Back Squat');
      expect(res.data.reply).toContain('contraindicated with your active joint sensitivity');
    });

    it('marks equipment-compatible exercises as compatible', async () => {
      const mock = new MockAiProvider({
        customReply: 'Try Chest-Supported Dumbbell Row for a safe back stimulus.',
        customSuggestedExercises: ['Chest-Supported Dumbbell Row'],
      });
      aiService.setProvider(mock);

      const res = await processCoachChat(testUserId, 'Give me a safe row');
      const row = res.data.suggestedExercises.find(
        (e) => e.name === 'Chest-Supported Dumbbell Row',
      );
      expect(row).toBeDefined();
      expect(row?.isCompatible).toBe(true);
      expect(res.data.safetyAlert).toBeNull();
    });
  });

  // =========================================================================
  // 3. HTTP Endpoint Integration: POST /api/v1/coach/chat
  // =========================================================================
  describe('HTTP Route: POST /api/v1/coach/chat', () => {
    it('rejects unauthenticated requests with 401 UNAUTHORIZED', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/coach/chat',
        payload: {
          message: 'What should I train today?',
        },
      });

      expect(res.statusCode).toBe(401);
      const json = res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('UNAUTHORIZED');
    });

    it('rejects invalid authentication tokens with 401 UNAUTHORIZED', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/coach/chat',
        headers: {
          authorization: 'Bearer invalid.jwt.token',
        },
        payload: {
          message: 'What should I train today?',
        },
      });

      expect(res.statusCode).toBe(401);
      const json = res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('UNAUTHORIZED');
    });

    it('rejects missing message with 400 VALIDATION_ERROR', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/coach/chat',
        headers: { authorization: `Bearer ${validToken}` },
        payload: {},
      });

      expect(res.statusCode).toBe(400);
      const json = res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects empty and whitespace-only message with 400 VALIDATION_ERROR', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/coach/chat',
        headers: { authorization: `Bearer ${validToken}` },
        payload: { message: '    ' },
      });

      expect(res.statusCode).toBe(400);
      const json = res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects excessively long message (>1000 chars) with 400 VALIDATION_ERROR', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/coach/chat',
        headers: { authorization: `Bearer ${validToken}` },
        payload: { message: 'A'.repeat(1001) },
      });

      expect(res.statusCode).toBe(400);
      const json = res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects malformed context UUIDs with 400 VALIDATION_ERROR', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/coach/chat',
        headers: { authorization: `Bearer ${validToken}` },
        payload: {
          message: 'Can I do curls?',
          context: { gymProfileId: 'not-a-valid-uuid' },
        },
      });

      expect(res.statusCode).toBe(400);
      const json = res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('VALIDATION_ERROR');
    });

    it('succeeds for authenticated user with valid payload and returns standard envelope', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/coach/chat',
        headers: { authorization: `Bearer ${validToken}` },
        payload: {
          message: 'What should I train today with my dumbbells?',
          context: { sessionId: null },
        },
      });

      expect(res.statusCode).toBe(200);
      const json = res.json();
      expect(json.success).toBe(true);
      expect(json.data.reply).toBeDefined();
      expect(typeof json.data.reply).toBe('string');
      expect(json.data.userContext).toBeDefined();
      expect(json.data.userContext.gymProfileName).toBe('Home Dumbbell Corner');
      expect(json.data.userContext.activeConstraints).toContain('lower_back');
      expect(json.meta.provider).toBe('mock');
      expect(json.meta.disclaimer).toContain('DISCLAIMER');
    });

    it('attaches medical safety advisory when acute injury symptoms are reported', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/coach/chat',
        headers: { authorization: `Bearer ${validToken}` },
        payload: {
          message: 'I felt a sharp pain in my knee when doing squats, should I continue?',
        },
      });

      expect(res.statusCode).toBe(200);
      const json = res.json();
      expect(json.success).toBe(true);
      expect(json.data.safetyAlert).toContain('Medical Safety Advisory');
      expect(json.data.reply).toContain('stop exercising immediately');
    });

    it('enforces IDOR protection when user requests another user gymProfileId', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/coach/chat',
        headers: { authorization: `Bearer ${validToken}` },
        payload: {
          message: 'Help me with my workout',
          context: { gymProfileId: otherUserGymProfile.id },
        },
      });

      expect(res.statusCode).toBe(404);
      const json = res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('RESOURCE_NOT_FOUND');
      expect(json.error.message).toContain('Gym profile not found');
    });

    it('handles provider timeout gracefully and returns 503 SERVICE_UNAVAILABLE', async () => {
      aiService.setProvider(new MockAiProvider({ forcedError: 'timeout' }));

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/coach/chat',
        headers: { authorization: `Bearer ${validToken}` },
        payload: {
          message: 'What should I train?',
        },
      });

      expect(res.statusCode).toBe(503);
      const json = res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('SERVICE_UNAVAILABLE');
      expect(json.error.message.toLowerCase()).toContain('timeout');
    });

    it('handles provider rate limit gracefully and returns 429 RATE_LIMIT_EXCEEDED', async () => {
      aiService.setProvider(new MockAiProvider({ forcedError: 'rate_limit' }));

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/coach/chat',
        headers: { authorization: `Bearer ${validToken}` },
        payload: {
          message: 'What should I train?',
        },
      });

      expect(res.statusCode).toBe(429);
      const json = res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(json.error.message).toContain('rate limit');
    });

    it('handles generic provider error and returns 503 SERVICE_UNAVAILABLE', async () => {
      aiService.setProvider(new MockAiProvider({ forcedError: 'generic' }));

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/coach/chat',
        headers: { authorization: `Bearer ${validToken}` },
        payload: {
          message: 'What should I train?',
        },
      });

      expect(res.statusCode).toBe(503);
      const json = res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('SERVICE_UNAVAILABLE');
    });

    it('safely handles missing provider configuration with 503 SERVICE_UNAVAILABLE', async () => {
      try {
        aiService.setForceUnconfigured(true);

        const res = await app.inject({
          method: 'POST',
          url: '/api/v1/coach/chat',
          headers: { authorization: `Bearer ${validToken}` },
          payload: {
            message: 'What should I train?',
          },
        });

        expect(res.statusCode).toBe(503);
        const json = res.json();
        expect(json.success).toBe(false);
        expect(json.error.code).toBe('SERVICE_UNAVAILABLE');
        expect(json.error.message).toContain('No AI provider is configured');
      } finally {
        aiService.setForceUnconfigured(false);
        aiService.setProvider(new MockAiProvider());
      }
    });

    it('handles model overload (503) gracefully with sanitized client message', async () => {
      const overloadProvider = new MockAiProvider();
      vi.spyOn(overloadProvider, 'generateChatResponse').mockRejectedValue(
        new AiOverloadedError(
          'The AI model is currently experiencing high demand. Please try again in a few moments.',
          { provider: 'gemini', model: 'gemini-3.8-flash', upstreamStatus: 503 },
        ),
      );
      aiService.setProvider(overloadProvider);

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/coach/chat',
        headers: { authorization: `Bearer ${validToken}` },
        payload: {
          message: 'What should I train today?',
        },
      });

      expect(res.statusCode).toBe(503);
      const json = res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('SERVICE_UNAVAILABLE');
      expect(json.error.message).toContain('high demand');
    });

    it('handles quota exhaustion (429) gracefully with sanitized client message', async () => {
      const quotaProvider = new MockAiProvider();
      vi.spyOn(quotaProvider, 'generateChatResponse').mockRejectedValue(
        new AiQuotaExhaustedError(
          'AI Coach daily quota has been reached. Please try again later.',
          { provider: 'gemini', model: 'gemini-3.8-flash', upstreamStatus: 429 },
        ),
      );
      aiService.setProvider(quotaProvider);

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/coach/chat',
        headers: { authorization: `Bearer ${validToken}` },
        payload: {
          message: 'What should I train today?',
        },
      });

      expect(res.statusCode).toBe(429);
      const json = res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(json.error.message).toContain('quota');
    });

    it('handles invalid credentials (503) gracefully without leaking API keys', async () => {
      const credsProvider = new MockAiProvider();
      vi.spyOn(credsProvider, 'generateChatResponse').mockRejectedValue(
        new AiInvalidCredentialsError(
          'AI Coach is temporarily unavailable due to a configuration issue. Please contact support.',
          { provider: 'gemini', model: 'gemini-3.8-flash', upstreamStatus: 400 },
        ),
      );
      aiService.setProvider(credsProvider);

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/coach/chat',
        headers: { authorization: `Bearer ${validToken}` },
        payload: {
          message: 'What should I train today?',
        },
      });

      expect(res.statusCode).toBe(503);
      const json = res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('SERVICE_UNAVAILABLE');
      expect(json.error.message).not.toContain('key');
      expect(json.error.message).not.toContain('googleapis.com');
    });

    it('documents POST /api/v1/coach/chat in OpenAPI Swagger under AI Coach tag', async () => {
      await app.ready();
      const openapi = app.swagger() as any;
      const endpoint = openapi.paths?.['/api/v1/coach/chat']?.post;

      expect(endpoint).toBeDefined();
      expect(endpoint.tags).toContain('AI Coach');
      expect(endpoint.summary).toContain('Bruno AI Coach');
      expect(endpoint.security).toEqual([{ bearerAuth: [] }]);
    });
  });
});
