import { create } from 'zustand';
import { api } from '../api/client';
import type { User, Provider, AuthResponse, TokenRefreshResponse } from '@gharkhana/types';
import type { LoginInput, RegisterInput, OtpVerifyInput } from '@gharkhana/validation';

interface AuthState {
  user: User | null;
  provider: Provider | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  setTokens: (accessToken: string, refreshToken: string) => void;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  verifyOtp: (input: OtpVerifyInput) => Promise<void>;
  refreshTokenAction: () => Promise<string | null>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => {
  // Set up token expiration handler for API client
  api.setOnTokenExpired(async () => {
    return get().refreshTokenAction();
  });

  return {
    user: null,
    provider: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,

    setTokens: (accessToken: string, refreshToken: string) => {
      api.setAccessToken(accessToken);
      set({ accessToken, refreshToken, isAuthenticated: true });
    },

    clearError: () => set({ error: null }),

    login: async (input: LoginInput) => {
      set({ isLoading: true, error: null });
      try {
        const data = await api.post<AuthResponse>('/auth/login', input);
        api.setAccessToken(data.accessToken);
        set({
          user: data.user,
          provider: data.provider || null,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch (err: unknown) {
        const message = (err as { message?: string })?.message || 'Login failed';
        set({ isLoading: false, error: message });
        throw err;
      }
    },

    register: async (input: RegisterInput) => {
      set({ isLoading: true, error: null });
      try {
        const data = await api.post<AuthResponse>('/auth/register', input);
        api.setAccessToken(data.accessToken);
        set({
          user: data.user,
          provider: data.provider || null,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch (err: unknown) {
        const message = (err as { message?: string })?.message || 'Registration failed';
        set({ isLoading: false, error: message });
        throw err;
      }
    },

    verifyOtp: async (input: OtpVerifyInput) => {
      set({ isLoading: true, error: null });
      try {
        const data = await api.post<AuthResponse>('/auth/otp/verify', input);
        api.setAccessToken(data.accessToken);
        set({
          user: data.user,
          provider: data.provider || null,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch (err: unknown) {
        const message = (err as { message?: string })?.message || 'OTP verification failed';
        set({ isLoading: false, error: message });
        throw err;
      }
    },

    refreshTokenAction: async () => {
      const { refreshToken } = get();
      if (!refreshToken) {
        get().logout();
        return null;
      }

      try {
        const data = await api.post<TokenRefreshResponse>('/auth/refresh', { refreshToken });
        api.setAccessToken(data.accessToken);
        set({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          isAuthenticated: true,
        });
        return data.accessToken;
      } catch {
        get().logout();
        return null;
      }
    },

    logout: async () => {
      const { refreshToken } = get();
      try {
        if (refreshToken) {
          await api.post('/auth/logout', { refreshToken });
        }
      } catch {
        // Ignore logout error
      } finally {
        api.setAccessToken(null);
        set({
          user: null,
          provider: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          error: null,
        });
      }
    },
  };
});
