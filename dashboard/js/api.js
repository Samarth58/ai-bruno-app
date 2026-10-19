/**
 * Bruno AI Gym Buddy — API Client
 * Clean HTTP client handling authentication, token refresh, and standard response envelopes.
 */

const STORAGE_KEYS = {
  API_URL: 'bruno_api_url',
  ACCESS_TOKEN: 'bruno_access_token',
  REFRESH_TOKEN: 'bruno_refresh_token',
  USER_DATA: 'bruno_user_data',
};

export const API_CONFIG = {
  get baseUrl() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEYS.API_URL);
      if (stored) return stored;
      if (window.__ENV__ && window.__ENV__.VITE_API_URL) return window.__ENV__.VITE_API_URL;
      // In browser, default to current origin unless running on standalone dev server (5173)
      if (window.location && window.location.origin && window.location.origin !== 'null') {
        if (window.location.port === '5173') {
          return `${window.location.protocol}//${window.location.hostname}:3000`;
        }
        return window.location.origin;
      }
    }
    return 'http://localhost:3000';
  },
  set baseUrl(url) {
    if (url) {
      localStorage.setItem(STORAGE_KEYS.API_URL, url.replace(/\/+$/, ''));
    } else {
      localStorage.removeItem(STORAGE_KEYS.API_URL);
    }
  },
};

export const TokenStore = {
  getAccessToken: () => localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN),
  setAccessToken: (token) => localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token),
  getRefreshToken: () => localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
  setRefreshToken: (token) => localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token),
  getUser: () => {
    try {
      const u = localStorage.getItem(STORAGE_KEYS.USER_DATA);
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  },
  setUser: (user) => localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user)),
  clear: () => {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
  },
};

let isRefreshing = false;
let refreshSubscribers = [];

function subscribeTokenRefresh(cb) {
  refreshSubscribers.push(cb);
}

function onRefreshed(newAccessToken) {
  refreshSubscribers.forEach((cb) => cb(newAccessToken));
  refreshSubscribers = [];
}

/**
 * Standard fetch wrapper respecting Fastify response envelopes:
 * { success: boolean, data?: any, error?: { code, message, details }, meta?: any }
 */
export async function apiRequest(endpoint, options = {}) {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const apiPath = cleanEndpoint.startsWith('/api/v1') || cleanEndpoint === '/health'
    ? cleanEndpoint
    : `/api/v1${cleanEndpoint}`;
  const url = `${API_CONFIG.baseUrl}${apiPath}`;
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'x-request-id': 'admin-dash-' + Math.random().toString(36).substring(2, 9),
    ...(options.headers || {}),
  };

  const token = TokenStore.getAccessToken();
  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Check for 401 Unauthorized -> Attempt Token Refresh
    if (response.status === 401 && !endpoint.includes('/login') && !endpoint.includes('/refresh')) {
      const refreshToken = TokenStore.getRefreshToken();
      if (refreshToken) {
        if (!isRefreshing) {
          isRefreshing = true;
          try {
            const refreshRes = await fetch(`${API_CONFIG.baseUrl}/api/v1/refresh`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken }),
            });
            const refreshJson = await refreshRes.json();
            const newAccessToken = refreshJson.data?.token || refreshJson.data?.accessToken || refreshJson.data?.tokens?.accessToken;
            const newRefreshToken = refreshJson.data?.refreshToken || refreshJson.data?.tokens?.refreshToken;
            if (refreshJson.success && newAccessToken) {
              TokenStore.setAccessToken(newAccessToken);
              if (newRefreshToken) TokenStore.setRefreshToken(newRefreshToken);
              onRefreshed(newAccessToken);
              isRefreshing = false;
              // Retry original request
              headers.Authorization = `Bearer ${newAccessToken}`;
              const retryRes = await fetch(url, { ...options, headers });
              return await handleEnvelope(retryRes);
            }
          } catch {
            // Refresh failed
          }
          isRefreshing = false;
          TokenStore.clear();
          window.dispatchEvent(new CustomEvent('bruno:auth-expired'));
        } else {
          // Wait for current refresh
          return new Promise((resolve, reject) => {
            subscribeTokenRefresh(async (newToken) => {
              try {
                headers.Authorization = `Bearer ${newToken}`;
                const retryRes = await fetch(url, { ...options, headers });
                resolve(await handleEnvelope(retryRes));
              } catch (err) {
                reject(err);
              }
            });
          });
        }
      } else {
        TokenStore.clear();
        window.dispatchEvent(new CustomEvent('bruno:auth-expired'));
      }
    }

    return await handleEnvelope(response);
  } catch (networkError) {
    console.error('API Network Error:', networkError);
    throw {
      code: 'NETWORK_ERROR',
      message: networkError.message || 'Unable to communicate with the Bruno backend server.',
      details: [],
    };
  }
}

async function handleEnvelope(response) {
  let json;
  try {
    json = await response.json();
  } catch {
    throw {
      code: 'INVALID_JSON',
      message: `Server returned HTTP ${response.status} with non-JSON body.`,
      status: response.status,
    };
  }

  if (response.ok && json.success) {
    return {
      data: json.data,
      meta: json.meta,
      status: response.status,
    };
  }

  // Handle standard error envelope
  const errorObj = json.error || {
    code: 'UNKNOWN_ERROR',
    message: json.message || `Request failed with HTTP status ${response.status}`,
    details: [],
  };
  errorObj.status = response.status;
  throw errorObj;
}

/* ===========================================================================
 * Bruno Endpoints Service API
 * =========================================================================== */

export const api = {
  // System Health
  getHealth: () => apiRequest('/health'),

  // Auth Endpoints
  login: async (email, password) => {
    const res = await apiRequest('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    const accessToken = res.data?.token || res.data?.accessToken || res.data?.tokens?.accessToken;
    const refreshToken = res.data?.refreshToken || res.data?.tokens?.refreshToken;
    if (accessToken) {
      TokenStore.setAccessToken(accessToken);
    }
    if (refreshToken) {
      TokenStore.setRefreshToken(refreshToken);
    }
    if (res.data?.user) {
      TokenStore.setUser(res.data.user);
    }
    return res.data;
  },

  registerUser: async (email, password, name) => {
    return await apiRequest('/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
  },

  logout: async () => {
    try {
      await apiRequest('/logout', { method: 'POST' });
    } catch {
      // Ignore network failures on logout
    } finally {
      TokenStore.clear();
    }
  },

  // Admin Endpoints
  getAdminUsers: () => apiRequest('/admin/users'),
  getAdminUserById: (id) => apiRequest(`/admin/users/${id}`),
  updateUserRole: (id, role) =>
    apiRequest(`/admin/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    }),
  revokeUserSessions: (id) =>
    apiRequest(`/admin/users/${id}/revoke-sessions`, {
      method: 'POST',
    }),
  deleteUser: (id) =>
    apiRequest(`/admin/users/${id}`, {
      method: 'DELETE',
    }),

  // Exercise Catalogue Endpoints
  getExercises: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/exercises${query ? `?${query}` : ''}`);
  },
  getExerciseById: (id) => apiRequest(`/exercises/${id}`),

  // Workout Programs Endpoints
  getPrograms: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/programs${query ? `?${query}` : ''}`);
  },
  getProgramById: (id) => apiRequest(`/programs/${id}`),
  createProgram: (data) =>
    apiRequest('/programs', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  generateProgram: (data) =>
    apiRequest('/programs/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  activateProgram: (id) =>
    apiRequest(`/programs/${id}/activate`, {
      method: 'PATCH',
    }),
  deleteProgram: (id) =>
    apiRequest(`/programs/${id}`, {
      method: 'DELETE',
    }),

  // Workout Sessions Endpoints
  getActiveSession: () => apiRequest('/sessions/active'),
  getSessions: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/sessions${query ? `?${query}` : ''}`);
  },
  getSessionById: (id) => apiRequest(`/sessions/${id}`),
  startSession: (data = {}) =>
    apiRequest('/sessions/start', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  finishSession: (id, data = {}) =>
    apiRequest(`/sessions/${id}/finish`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Analytics Endpoints
  getAnalyticsOverview: () => apiRequest('/analytics/overview'),
  getVolumeByMuscle: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/analytics/volume-by-muscle${query ? `?${query}` : ''}`);
  },
  getTrainingConsistency: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/analytics/consistency${query ? `?${query}` : ''}`);
  },
  getProgressSummary: () => apiRequest('/analytics/progress'),
  getEstimated1rm: (exerciseId, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/analytics/estimated-1rm/${exerciseId}${query ? `?${query}` : ''}`);
  },
};
