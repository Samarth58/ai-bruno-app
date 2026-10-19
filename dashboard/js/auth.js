/**
 * Bruno AI Gym Buddy — Authentication Manager
 * Handles admin identity, session management, and authentication guards.
 */

import { api, TokenStore } from './api.js';

export const auth = {
  isAuthenticated: () => {
    return Boolean(TokenStore.getAccessToken());
  },

  getCurrentUser: () => {
    return TokenStore.getUser();
  },

  isAdmin: () => {
    const user = TokenStore.getUser();
    return user?.role === 'admin';
  },

  login: async (email, password) => {
    const data = await api.login(email, password);
    if (data.user?.role !== 'admin') {
      // User is authenticated but does not possess admin privileges
      throw {
        code: 'FORBIDDEN',
        message: 'Access denied: Admin role required for Bruno Admin Dashboard.',
      };
    }
    window.dispatchEvent(new CustomEvent('bruno:auth-success', { detail: data.user }));
    return data;
  },

  logout: async () => {
    await api.logout();
    window.dispatchEvent(new CustomEvent('bruno:auth-logout'));
  },

  /**
   * Ensures an admin session is active.
   * If not logged in, opens the login modal.
   */
  requireAdmin: (onAuthSuccess) => {
    if (auth.isAuthenticated() && auth.isAdmin()) {
      if (onAuthSuccess) onAuthSuccess(auth.getCurrentUser());
      return true;
    }
    window.dispatchEvent(new CustomEvent('bruno:open-login'));
    return false;
  },
};
