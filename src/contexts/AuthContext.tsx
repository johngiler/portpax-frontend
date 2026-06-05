"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  clearStoredTokens,
  fetchCurrentUser,
  getStoredAccessToken,
  login as apiLogin,
  setStoredTokens,
} from "@/services/authService";
import type { UserMe } from "@/types/auth";

type AuthState = {
  user: UserMe | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
};

type AuthContextValue = AuthState & {
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const AUTH_LOADING = "auth_loading";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserMe | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async (accessToken: string) => {
    try {
      const me = await fetchCurrentUser();
      setUser(me);
      setToken(accessToken);
    } catch {
      clearStoredTokens();
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const stored = getStoredAccessToken();
    if (!stored) {
      setLoading(false);
      return;
    }
    loadUser(stored);
  }, [loadUser]);

  const login = useCallback(
    async (username: string, password: string) => {
      const { access, refresh } = await apiLogin(username, password);
      setStoredTokens(access, refresh);
      await loadUser(access);
    },
    [loadUser]
  );

  const logout = useCallback(() => {
    clearStoredTokens();
    setUser(null);
    setToken(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: !!token && !!user,
      login,
      logout,
    }),
    [user, token, loading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function useAuthOptional(): AuthContextValue | null {
  return useContext(AuthContext);
}
