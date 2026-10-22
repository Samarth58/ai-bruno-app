import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const memoryStore: Record<string, string> = {};

/**
 * Platform-safe token & preference storage.
 * Uses hardware keystore / keychain via expo-secure-store on mobile,
 * with graceful fallback for web/testing.
 */
export const StorageService = {
  async getItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage.getItem(key);
        }
        return memoryStore[key] ?? null;
      }
      return await SecureStore.getItemAsync(key);
    } catch {
      return memoryStore[key] ?? null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, value);
        }
        memoryStore[key] = value;
        return;
      }
      await SecureStore.setItemAsync(key, value);
    } catch {
      memoryStore[key] = value;
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(key);
        }
        delete memoryStore[key];
        return;
      }
      await SecureStore.deleteItemAsync(key);
    } catch {
      delete memoryStore[key];
    }
  },
};

export const AUTH_KEYS = {
  ACCESS_TOKEN: 'bruno_access_token',
  REFRESH_TOKEN: 'bruno_refresh_token',
  USER_DATA: 'bruno_user_data',
};
