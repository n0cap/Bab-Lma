import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { User } from '@babloo/shared';
import { api } from '../services/api';
import {
  getStoredRefreshToken,
  storeRefreshToken,
  clearRefreshToken,
} from '../services/secureStore';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  signIn: (tokens: { accessToken: string; refreshToken: string }) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    accessToken: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const refreshPromiseRef = useRef<Promise<string | null> | null>(null);

  const fetchUser = useCallback(async (token: string): Promise<User | null> => {
    try {
      const res = await api.get('/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.data;
    } catch {
      return null;
    }
  }, []);

  const doRefresh = useCallback(async (): Promise<string | null> => {
    const stored = await getStoredRefreshToken();
    if (!stored) return null;

    try {
      const res = await api.post('/auth/refresh', { refreshToken: stored });
      const { accessToken, refreshToken } = res.data.data;
      await storeRefreshToken(refreshToken);
      return accessToken;
    } catch {
      await clearRefreshToken();
      return null;
    }
  }, []);

  const refreshWithMutex = useCallback(async (): Promise<string | null> => {
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }
    const promise = doRefresh();
    refreshPromiseRef.current = promise;
    try {
      return await promise;
    } finally {
      refreshPromiseRef.current = null;
    }
  }, [doRefresh]);

  // Axios interceptor: attach token + handle 401
  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use((config) => {
      if (state.accessToken) {
        config.headers.Authorization = `Bearer ${state.accessToken}`;
      }
      return config;
    });

    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const original = error.config;
        if (
          error.response?.status === 401 &&
          !original._retry &&
          !original.url?.includes('/auth/')
        ) {
          original._retry = true;
          const newToken = await refreshWithMutex();
          if (newToken) {
            setState((prev) => ({ ...prev, accessToken: newToken }));
            original.headers.Authorization = `Bearer ${newToken}`;
            return api(original);
          }
          setState({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
          await clearRefreshToken();
        }
        return Promise.reject(error);
      },
    );

    return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
    };
  }, [state.accessToken, refreshWithMutex]);

  // Bootstrap: try refresh on mount
  useEffect(() => {
    (async () => {
      const token = await refreshWithMutex();
      if (token) {
        const user = await fetchUser(token);
        if (user) {
          setState({ user, accessToken: token, isAuthenticated: true, isLoading: false });
          return;
        }
      }
      setState({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const signIn = useCallback(
    async (tokens: { accessToken: string; refreshToken: string }) => {
      await storeRefreshToken(tokens.refreshToken);
      const user = await fetchUser(tokens.accessToken);
      setState({
        user,
        accessToken: tokens.accessToken,
        isAuthenticated: true,
        isLoading: false,
      });
    },
    [fetchUser],
  );

  const signOut = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Best-effort server logout
    }
    await clearRefreshToken();
    setState({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
