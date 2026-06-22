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
  ensureFreshAccessToken,
  fetchCurrentUser,
  getStoredAccessToken,
  login as apiLogin,
  resetSessionExpiredState,
  setSessionExpiredHandler,
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

const TOKEN_KEEPALIVE_MS = 4 * 60 * 1000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserMe | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    try {
      const me = await fetchCurrentUser();
      setUser(me);
      setToken(getStoredAccessToken());
    } catch {
      clearStoredTokens();
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setSessionExpiredHandler(() => {
      setUser(null);
      setToken(null);
      window.location.assign("/login?session=expired");
    });
    return () => setSessionExpiredHandler(null);
  }, []);

  useEffect(() => {
    const stored = getStoredAccessToken();
    if (!stored) {
      setLoading(false);
      return;
    }
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (!token) return;

    async function keepSessionAlive() {
      try {
        const access = await ensureFreshAccessToken();
        if (access) setToken(access);
      } catch {
        // notifySessionExpired handles redirect
      }
    }

    function onVisible() {
      if (document.visibilityState === "visible") void keepSessionAlive();
    }

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", keepSessionAlive);
    const interval = window.setInterval(keepSessionAlive, TOKEN_KEEPALIVE_MS);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", keepSessionAlive);
      window.clearInterval(interval);
    };
  }, [token]);

  const login = useCallback(
    async (username: string, password: string) => {
      const { access, refresh } = await apiLogin(username, password);
      setStoredTokens(access, refresh);
      resetSessionExpiredState();
      await loadUser();
    },
    [loadUser],
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
    [user, token, loading, login, logout],
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
