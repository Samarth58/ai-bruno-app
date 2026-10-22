import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, setOnUnauthorizedCallback } from '../services/api';
import { AUTH_KEYS, StorageService } from '../services/storage';
import type { User } from '../types/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
        }
      } finally {
        setIsLoading(false);
      }
    }

    // Connect automatic logout callback on invalid session
    setOnUnauthorizedCallback(() => {
      setUser(null);
    });

    initSession();
  }, []);

  const login = async (email: string, password: string) => {
    const tokens = await api.auth.login(email, password);
    setUser(tokens.user);
  };

  const register = async (email: string, password: string, name?: string) => {
    const tokens = await api.auth.register(email, password, name);
    setUser(tokens.user);
  };

  const logout = async () => {
    await api.auth.logout();
    setUser(null);
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
        login,
        register,
        logout,
        refreshUser,
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
