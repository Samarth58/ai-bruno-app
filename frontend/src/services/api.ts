import { Platform } from 'react-native';
import { AUTH_KEYS, StorageService } from './storage';
import type {
  ApiResponse,
  AuthTokens,
  CoachBriefing,
  CoachWeeklyReview,
  CreateConstraintInput,
  CreateGymProfileInput,
  Exercise,
  FinishSessionInput,
  GenerateProgramInput,
  GymProfile,
  LogSetInput,
  MascotState,
  MobileProgress,
  SwapAlternativeExercise,
  UpdateConstraintInput,
  UpdateGymProfileInput,
  User,
  UserConstraint,
  WorkoutProgram,
  WorkoutRoutine,
  WorkoutSession,
  WorkoutSetLog,
} from '../types/api';

/**
 * Resolves the backend base URL.
 * Defaults to:
 * - Android emulator host alias: http://10.0.2.2:3000
 * - Web / iOS / Local machine: http://localhost:3000
 */
export function getApiBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/+$/, '');
  }
  return Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
}

export class ApiError extends Error {
  public code: string;
  public status: number;
  public details?: unknown[];

  constructor(code: string, message: string, status = 400, details?: unknown[]) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

// Single-flight refresh token mutex
let refreshTokenPromise: Promise<string | null> | null = null;
let onUnauthorizedCallback: (() => void) | null = null;

export function setOnUnauthorizedCallback(cb: () => void) {
  onUnauthorizedCallback = cb;
}

async function refreshAuthTokens(): Promise<string | null> {
  if (refreshTokenPromise) {
    return refreshTokenPromise;
  }

  refreshTokenPromise = (async () => {
    try {
      const refreshToken = await StorageService.getItem(AUTH_KEYS.REFRESH_TOKEN);
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/api/v1/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      const body: ApiResponse<AuthTokens> = await res.json();
      const newAccessToken =
        body.data?.accessToken || (body.data as unknown as { token?: string })?.token;
      if (!res.ok || !body.success || !newAccessToken) {
        throw new Error(body.error?.message || 'Token refresh failed');
      }

      await StorageService.setItem(AUTH_KEYS.ACCESS_TOKEN, newAccessToken);
      if (body.data.refreshToken) {
        await StorageService.setItem(AUTH_KEYS.REFRESH_TOKEN, body.data.refreshToken);
      }
      return newAccessToken;
    } catch {
      await StorageService.removeItem(AUTH_KEYS.ACCESS_TOKEN);
      await StorageService.removeItem(AUTH_KEYS.REFRESH_TOKEN);
      await StorageService.removeItem(AUTH_KEYS.USER_DATA);
      if (onUnauthorizedCallback) {
        onUnauthorizedCallback();
      }
      return null;
    } finally {
      refreshTokenPromise = null;
    }
  })();

  return refreshTokenPromise;
}

/**
 * Universal JSON HTTP request dispatcher with automatic Bearer token injection,
 * single-use token rotation handling, and standard error unmasking.
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  requiresAuth = true,
): Promise<{ data: T; meta?: Record<string, unknown> }> {
  const baseUrl = getApiBaseUrl();
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${normalizedEndpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (requiresAuth) {
    let token = await StorageService.getItem(AUTH_KEYS.ACCESS_TOKEN);
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Network request failed';
    throw new ApiError(
      'NETWORK_ERROR',
      `Cannot connect to Bruno backend at ${baseUrl}. Please check your connection or EXPO_PUBLIC_API_URL. (${errorMsg})`,
      0,
    );
  }

  // Handle 401 Unauthorized via session rotation
  if (response.status === 401 && requiresAuth) {
    const newAccessToken = await refreshAuthTokens();
    if (newAccessToken) {
      headers.Authorization = `Bearer ${newAccessToken}`;
      try {
        response = await fetch(url, {
          ...options,
          headers,
        });
      } catch {
        throw new ApiError('NETWORK_ERROR', 'Network error during retried request', 0);
      }
    } else {
      throw new ApiError('UNAUTHORIZED', 'Session expired. Please log in again.', 401);
    }
  }

  let body: ApiResponse<T>;
  try {
    body = await response.json();
  } catch {
    throw new ApiError(
      'PARSE_ERROR',
      `Server returned an invalid JSON response (HTTP ${response.status})`,
      response.status,
    );
  }

  if (!response.ok || !body.success) {
    const errCode = body?.error?.code || `HTTP_${response.status}`;
    const errMsg = body?.error?.message || response.statusText || 'Request failed';
    throw new ApiError(errCode, errMsg, response.status, body?.error?.details);
  }

  return { data: body.data, meta: body.meta };
}

// ---------------------------------------------------------------------------
// Typed API Services
// ---------------------------------------------------------------------------

export const api = {
  // System Health
  async health(): Promise<{ status: string; uptime: number }> {
    const res = await apiRequest<{ status: string; uptime: number }>('/health', { method: 'GET' }, false);
    return res.data;
  },

  // Authentication
  auth: {
    async register(email: string, password: string, name?: string): Promise<AuthTokens> {
      const res = await apiRequest<AuthTokens>(
        '/api/v1/register',
        {
          method: 'POST',
          body: JSON.stringify({ email, password, name }),
        },
        false,
      );
      const accessToken =
        res.data.accessToken || (res.data as unknown as { token?: string }).token;
      if (!accessToken) {
        throw new ApiError('AUTH_ERROR', 'No access token received from authentication endpoint');
      }
      await StorageService.setItem(AUTH_KEYS.ACCESS_TOKEN, accessToken);
      await StorageService.setItem(AUTH_KEYS.REFRESH_TOKEN, res.data.refreshToken);
      await StorageService.setItem(AUTH_KEYS.USER_DATA, JSON.stringify(res.data.user));
      return { ...res.data, accessToken, token: accessToken };
    },

    async login(email: string, password: string): Promise<AuthTokens> {
      const res = await apiRequest<AuthTokens>(
        '/api/v1/login',
        {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        },
        false,
      );
      const accessToken =
        res.data.accessToken || (res.data as unknown as { token?: string }).token;
      if (!accessToken) {
        throw new ApiError('AUTH_ERROR', 'No access token received from login endpoint');
      }
      await StorageService.setItem(AUTH_KEYS.ACCESS_TOKEN, accessToken);
      await StorageService.setItem(AUTH_KEYS.REFRESH_TOKEN, res.data.refreshToken);
      await StorageService.setItem(AUTH_KEYS.USER_DATA, JSON.stringify(res.data.user));
      return { ...res.data, accessToken, token: accessToken };
    },

    async logout(): Promise<void> {
      const refreshToken = await StorageService.getItem(AUTH_KEYS.REFRESH_TOKEN);
      try {
        if (refreshToken) {
          await apiRequest('/api/v1/logout', {
            method: 'POST',
            body: JSON.stringify({ refreshToken }),
          });
        }
      } catch {
        // Safe to ignore on client logout
      } finally {
        await StorageService.removeItem(AUTH_KEYS.ACCESS_TOKEN);
        await StorageService.removeItem(AUTH_KEYS.REFRESH_TOKEN);
        await StorageService.removeItem(AUTH_KEYS.USER_DATA);
      }
    },

    async forgotPassword(email: string): Promise<{ message: string }> {
      const res = await apiRequest<{ message: string }>(
        '/api/v1/auth/forgot-password',
        {
          method: 'POST',
          body: JSON.stringify({ email }),
        },
        false,
      );
      return res.data;
    },

    async verifyResetOtp(email: string, otp: string): Promise<{ resetToken: string }> {
      const res = await apiRequest<{ resetToken: string }>(
        '/api/v1/auth/verify-reset-otp',
        {
          method: 'POST',
          body: JSON.stringify({ email, otp }),
        },
        false,
      );
      return res.data;
    },

    async resendResetOtp(email: string): Promise<{ message: string }> {
      const res = await apiRequest<{ message: string }>(
        '/api/v1/auth/resend-reset-otp',
        {
          method: 'POST',
          body: JSON.stringify({ email }),
        },
        false,
      );
      return res.data;
    },

    async resetPassword(resetToken: string, newPassword: string, confirmPassword: string): Promise<{ message: string }> {
      const res = await apiRequest<{ message: string }>(
        '/api/v1/auth/reset-password',
        {
          method: 'POST',
          body: JSON.stringify({ resetToken, newPassword, confirmPassword }),
        },
        false,
      );
      return res.data;
    },
  },

  // Users
  users: {
    async getMe(): Promise<User> {
      const stored = await StorageService.getItem(AUTH_KEYS.USER_DATA);
      let userId: string | null = null;
      if (stored) {
        try {
          userId = JSON.parse(stored).id;
        } catch {
          // ignore parse error
        }
      }
      if (!userId) {
        throw new ApiError('UNAUTHORIZED', 'No authenticated user session found', 401);
      }
      const res = await apiRequest<User>(`/api/v1/users/${userId}`, { method: 'GET' });
      await StorageService.setItem(AUTH_KEYS.USER_DATA, JSON.stringify(res.data));
      return res.data;
    },
    async updateMe(input: { name?: string; email?: string }): Promise<User> {
      const stored = await StorageService.getItem(AUTH_KEYS.USER_DATA);
      let userId: string | null = null;
      if (stored) {
        try {
          userId = JSON.parse(stored).id;
        } catch {
          // ignore parse error
        }
      }
      if (!userId) {
        throw new ApiError('UNAUTHORIZED', 'No authenticated user session found', 401);
      }
      const res = await apiRequest<{ user: User }>(`/api/v1/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(input),
      });
      const updatedUser = res.data.user || (res.data as unknown as User);
      await StorageService.setItem(AUTH_KEYS.USER_DATA, JSON.stringify(updatedUser));
      return updatedUser;
    },
  },

  // Gym Profiles
  gymProfiles: {
    async list(): Promise<GymProfile[]> {
      const res = await apiRequest<GymProfile[]>('/api/v1/gym-profiles', { method: 'GET' });
      return res.data;
    },
    async getById(id: string): Promise<GymProfile> {
      const res = await apiRequest<GymProfile>(`/api/v1/gym-profiles/${id}`, { method: 'GET' });
      return res.data;
    },
    async create(input: CreateGymProfileInput): Promise<GymProfile> {
      const res = await apiRequest<GymProfile>('/api/v1/gym-profiles', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      return res.data;
    },
    async update(id: string, input: UpdateGymProfileInput): Promise<GymProfile> {
      const res = await apiRequest<GymProfile>(`/api/v1/gym-profiles/${id}`, {
        method: 'PUT',
        body: JSON.stringify(input),
      });
      return res.data;
    },
    async delete(id: string): Promise<boolean> {
      const res = await apiRequest<{ deleted: boolean }>(`/api/v1/gym-profiles/${id}`, {
        method: 'DELETE',
      });
      return res.data?.deleted ?? true;
    },
  },

  // Physical Constraints
  constraints: {
    async list(isActive = true): Promise<UserConstraint[]> {
      const res = await apiRequest<UserConstraint[]>(
        `/api/v1/constraints?isActive=${isActive}`,
        { method: 'GET' },
      );
      return res.data;
    },
    async create(input: CreateConstraintInput): Promise<UserConstraint> {
      const res = await apiRequest<UserConstraint>('/api/v1/constraints', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      return res.data;
    },
    async update(id: string, input: UpdateConstraintInput): Promise<UserConstraint> {
      const res = await apiRequest<UserConstraint>(`/api/v1/constraints/${id}`, {
        method: 'PUT',
        body: JSON.stringify(input),
      });
      return res.data;
    },
    async delete(id: string): Promise<boolean> {
      const res = await apiRequest<{ deleted: boolean }>(`/api/v1/constraints/${id}`, {
        method: 'DELETE',
      });
      return res.data?.deleted ?? true;
    },
  },

  // Exercise Catalog
  exercises: {
    async list(params?: {
      search?: string;
      primaryMuscleGroup?: string;
      movementPattern?: string;
      gymProfileId?: string;
    }): Promise<Exercise[]> {
      const query = new URLSearchParams();
      if (params?.search) query.append('search', params.search);
      if (params?.primaryMuscleGroup) query.append('primaryMuscleGroup', params.primaryMuscleGroup);
      if (params?.movementPattern) query.append('movementPattern', params.movementPattern);
      if (params?.gymProfileId) query.append('gymProfileId', params.gymProfileId);

      const qs = query.toString();
      const res = await apiRequest<Exercise[]>(
        `/api/v1/exercises${qs ? `?${qs}` : ''}`,
        { method: 'GET' },
      );
      return res.data;
    },
    async getById(id: string): Promise<Exercise> {
      const res = await apiRequest<Exercise>(`/api/v1/exercises/${id}`, { method: 'GET' });
      return res.data;
    },
  },

  // Workout Programs
  programs: {
    async list(isActive?: boolean): Promise<WorkoutProgram[]> {
      const qs = typeof isActive === 'boolean' ? `?isActive=${isActive}` : '';
      const res = await apiRequest<WorkoutProgram[]>(`/api/v1/programs${qs}`, { method: 'GET' });
      return res.data;
    },
    async getById(id: string): Promise<WorkoutProgram> {
      const res = await apiRequest<WorkoutProgram>(`/api/v1/programs/${id}`, { method: 'GET' });
      return res.data;
    },
    async generate(input: GenerateProgramInput): Promise<WorkoutProgram> {
      const res = await apiRequest<WorkoutProgram>('/api/v1/programs/generate', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      return res.data;
    },
    async activate(id: string): Promise<WorkoutProgram> {
      const res = await apiRequest<WorkoutProgram>(`/api/v1/programs/${id}/activate`, {
        method: 'PATCH',
      });
      return res.data;
    },
    async getRoutine(routineId: string): Promise<WorkoutRoutine> {
      const res = await apiRequest<WorkoutRoutine>(`/api/v1/programs/routines/${routineId}`, {
        method: 'GET',
      });
      return res.data;
    },
    async getAlternatives(
      routineId: string,
      routineExerciseId: string,
    ): Promise<SwapAlternativeExercise[]> {
      const res = await apiRequest<SwapAlternativeExercise[]>(
        `/api/v1/routines/${routineId}/exercises/${routineExerciseId}/alternatives`,
        { method: 'GET' },
      );
      return res.data;
    },
    async swapExercise(
      routineId: string,
      routineExerciseId: string,
      replacementExerciseId: string,
      reason?: string,
    ): Promise<WorkoutRoutine> {
      const res = await apiRequest<WorkoutRoutine>(
        `/api/v1/routines/${routineId}/exercises/${routineExerciseId}/swap`,
        {
          method: 'POST',
          body: JSON.stringify({ replacementExerciseId, reason }),
        },
      );
      return res.data;
    },
  },

  // Workout Sessions & Telemetry
  sessions: {
    async getActive(): Promise<WorkoutSession | null> {
      try {
        const res = await apiRequest<WorkoutSession | null>('/api/v1/sessions/active', {
          method: 'GET',
        });
        return res.data;
      } catch (err: unknown) {
        if (err instanceof ApiError && err.status === 404) {
          return null;
        }
        throw err;
      }
    },
    async getById(id: string): Promise<WorkoutSession> {
      const res = await apiRequest<WorkoutSession>(`/api/v1/sessions/${id}`, { method: 'GET' });
      return res.data;
    },
    async start(routineId?: string | null, notes?: string): Promise<WorkoutSession> {
      const res = await apiRequest<WorkoutSession>('/api/v1/sessions/start', {
        method: 'POST',
        body: JSON.stringify({ routineId: routineId ?? null, notes }),
      });
      return res.data;
    },
    async logSet(sessionId: string, input: LogSetInput): Promise<WorkoutSetLog> {
      const res = await apiRequest<WorkoutSetLog>(`/api/v1/sessions/${sessionId}/sets`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
      return res.data;
    },
    async updateSet(
      sessionId: string,
      setId: string,
      input: Partial<LogSetInput>,
    ): Promise<WorkoutSetLog> {
      const res = await apiRequest<WorkoutSetLog>(
        `/api/v1/sessions/${sessionId}/sets/${setId}`,
        {
          method: 'PUT',
          body: JSON.stringify(input),
        },
      );
      return res.data;
    },
    async deleteSet(sessionId: string, setId: string): Promise<boolean> {
      const res = await apiRequest<{ deleted: boolean }>(
        `/api/v1/sessions/${sessionId}/sets/${setId}`,
        { method: 'DELETE' },
      );
      return res.data?.deleted ?? true;
    },
    async finish(sessionId: string, input: FinishSessionInput): Promise<WorkoutSession> {
      const res = await apiRequest<WorkoutSession>(
        `/api/v1/sessions/${sessionId}/finish`,
        {
          method: 'POST',
          body: JSON.stringify(input),
        },
      );
      return res.data;
    },
    async hitPrescribed(
      sessionId: string,
      input: { perceivedRpe?: number; jointSoreness?: number; notes?: string },
    ): Promise<WorkoutSession> {
      const res = await apiRequest<WorkoutSession>(
        `/api/v1/sessions/${sessionId}/hit-prescribed`,
        {
          method: 'POST',
          body: JSON.stringify(input),
        },
      );
      return res.data;
    },
    async cancel(sessionId: string, notes?: string): Promise<WorkoutSession> {
      const res = await apiRequest<WorkoutSession>(
        `/api/v1/sessions/${sessionId}/cancel`,
        {
          method: 'POST',
          body: JSON.stringify({ notes }),
        },
      );
      return res.data;
    },
  },

  // AI Coach Bruno
  coach: {
    async chat(message: string, context?: Record<string, unknown>): Promise<{ reply: string }> {
      const res = await apiRequest<{ reply: string }>('/api/v1/coach/chat', {
        method: 'POST',
        body: JSON.stringify({ message, context }),
      });
      return res.data;
    },
    async getBriefing(): Promise<CoachBriefing> {
      const res = await apiRequest<Record<string, any>>('/api/v1/coach/briefing', { method: 'GET' });
      const raw = res.data;
      return {
        todayRoutine: raw.todayWorkout
          ? {
              id: raw.todayWorkout.routineId,
              name: raw.todayWorkout.routineName,
              exerciseCount: raw.todayWorkout.prescribedExercisesCount,
              targetDurationMinutes: 45,
              targetRpe: raw.todayWorkout.targetRpe ?? 8,
            }
          : null,
        cnsReadinessPercent: raw.readinessScore ?? 85,
        coachingTip:
          raw.coachingTip ||
          'Upper Body Hypertrophy locked in. Auto-calculated your target sets and micro-loads.',
        activeStreakWeeks: raw.previousSession ? 1 : 0,
        completedSessionsThisWeek: 0,
        targetSessionsThisWeek: 4,
      };
    },
    async getWeeklyReview(): Promise<CoachWeeklyReview> {
      const res = await apiRequest<CoachWeeklyReview>('/api/v1/coach/weekly-review', {
        method: 'GET',
      });
      return res.data;
    },
    async getMascotState(): Promise<MascotState> {
      const res = await apiRequest<Record<string, any>>('/api/v1/coach/mascot-state', {
        method: 'GET',
      });
      const raw = res.data;
      return {
        state: raw.visualState ?? 'studying_journal',
        message: raw.headline
          ? `${raw.headline} — ${raw.subtext}`
          : 'Bruno AI Gym Buddy is tracking your adherence and progressive overload.',
        context: {
          adherenceRate: raw.context?.weeklyWorkoutsTarget
            ? Math.round(
                (raw.context.weeklyWorkoutsCompleted / raw.context.weeklyWorkoutsTarget) * 100,
              )
            : 100,
          daysSinceLastWorkout: raw.context?.daysSinceLastWorkout ?? 0,
        },
      };
    },
  },

  // Lifter Progress & Analytics
  analytics: {
    async getProgress(): Promise<MobileProgress> {
      const res = await apiRequest<Record<string, any>>('/api/v1/analytics/progress', {
        method: 'GET',
      });
      const raw = res.data;
      return {
        totalCompletedSessions: raw?.summary?.totalWorkouts ?? 0,
        currentWeekWorkoutCount: raw?.summary?.currentWeekWorkouts ?? 0,
        activeProgramName: null,
        totalVolumeKg: raw?.summary?.thisWeekVolumeKg ?? 0,
        totalReps: 0,
        streakWeeks: raw?.summary?.currentStreakWeeks ?? 0,
        cnsReadinessPercent: raw?.recovery?.readinessScore ?? 85,
        muscleDistribution: (raw?.muscleVolumeDistribution || []).map((m: any) => ({
          muscleGroup: m.muscleGroup,
          volumeKg: m.volumeKg,
          percentage: 0,
        })),
      };
    },
    async getOverview(): Promise<Record<string, unknown>> {
      const res = await apiRequest<Record<string, unknown>>('/api/v1/analytics/overview', {
        method: 'GET',
      });
      return res.data;
    },
    async getConsistency(weeks = 8): Promise<Record<string, unknown>> {
      const res = await apiRequest<Record<string, unknown>>(
        `/api/v1/analytics/consistency?weeks=${weeks}`,
        { method: 'GET' },
      );
      return res.data;
    },
  },
};
