import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, setOnUnauthorizedCallback } from '../services/api';
import { AUTH_KEYS, StorageService } from '../services/storage';
import type { User } from '../types/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isOnboardingCompleted: boolean | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  checkOnboardingStatus: () => Promise<boolean>;
  markOnboardingCompleted: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState<boolean | null>(null);

  const checkOnboardingStatus = async (): Promise<boolean> => {
    try {
      const activePrograms = await api.programs.list(true);
      const isComplete = Array.isArray(activePrograms) && activePrograms.length > 0;
      setIsOnboardingCompleted(isComplete);
      if (isComplete) {
        await StorageService.setItem(AUTH_KEYS.ONBOARDING_COMPLETED, 'true');
      } else {
        await StorageService.removeItem(AUTH_KEYS.ONBOARDING_COMPLETED);
      }
      return isComplete;
    } catch {
      // Safe fallback on network interruption: check persistent local flag
      const cached = await StorageService.getItem(AUTH_KEYS.ONBOARDING_COMPLETED);
      const isComplete = cached === 'true';
      setIsOnboardingCompleted(isComplete);
      return isComplete;
    }
  };

  const markOnboardingCompleted = async () => {
    setIsOnboardingCompleted(true);
    await StorageService.setItem(AUTH_KEYS.ONBOARDING_COMPLETED, 'true');
  };

  // Restore session from secure storage on startup
  useEffect(() => {
    async function initSession() {
      try {
        const token = await StorageService.getItem(AUTH_KEYS.ACCESS_TOKEN);
        const storedUser = await StorageService.getItem(AUTH_KEYS.USER_DATA);

        if (token && storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch {
            // ignore JSON parse error
          }

          // Validate or refresh with backend in background
          try {
            const freshUser = await api.users.getMe();
            setUser(freshUser);
          } catch {
            // Keep stored user if offline or network glitch
          }

          await checkOnboardingStatus();
        }
      } finally {
        setIsLoading(false);
      }
    }

    // Connect automatic logout callback on invalid session
    setOnUnauthorizedCallback(() => {
      setUser(null);
      setIsOnboardingCompleted(null);
    });

    initSession();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    const tokens = await api.auth.login(email, password);
    setUser(tokens.user);
    return await checkOnboardingStatus();
  };

  const register = async (email: string, password: string, name?: string): Promise<boolean> => {
    const tokens = await api.auth.register(email, password, name);
    setUser(tokens.user);
    setIsOnboardingCompleted(false);
    await StorageService.removeItem(AUTH_KEYS.ONBOARDING_COMPLETED);
    return false;
  };

  const logout = async () => {
    await api.auth.logout();
    setUser(null);
    setIsOnboardingCompleted(null);
    await StorageService.removeItem(AUTH_KEYS.ONBOARDING_COMPLETED);
  };

  const refreshUser = async () => {
    try {
      const freshUser = await api.users.getMe();
      setUser(freshUser);
    } catch {
      // safe ignore
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isOnboardingCompleted,
        login,
        register,
        logout,
        refreshUser,
        checkOnboardingStatus,
        markOnboardingCompleted,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
