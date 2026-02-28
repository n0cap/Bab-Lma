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

  // Refs to avoid stale closures in interceptors
  const accessTokenRef = useRef<string | null>(null);
  const refreshPromiseRef = useRef<Promise<string | null> | null>(null);

  // Keep ref in sync with state
  useEffect(() => {
    accessTokenRef.current = state.accessToken;
  }, [state.accessToken]);

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

  // Mutex-guarded refresh — single in-flight promise
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

  // Register interceptors ONCE on mount — read token from ref to avoid stale closures
  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use((config) => {
      const token = accessTokenRef.current;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
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
            accessTokenRef.current = newToken;
            setState((prev) => ({ ...prev, accessToken: newToken }));
            original.headers.Authorization = `Bearer ${newToken}`;
            return api(original);
          }
          // Refresh failed — sign out
          accessTokenRef.current = null;
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
  }, [refreshWithMutex]);

  // Bootstrap: try refresh on mount
  useEffect(() => {
    (async () => {
      const token = await refreshWithMutex();
      if (token) {
        accessTokenRef.current = token;
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
      accessTokenRef.current = tokens.accessToken;
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
    // Send refresh token to server so it can revoke the correct family
    const storedRefresh = await getStoredRefreshToken();
    try {
      await api.post('/auth/logout', {
        ...(storedRefresh ? { refreshToken: storedRefresh } : {}),
      });
    } catch {
      // Best-effort server logout
    }
    accessTokenRef.current = null;
    await clearRefreshToken();
    setState({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
