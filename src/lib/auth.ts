/**
 * Cliente de autenticación JWT (Djoser + Simple JWT).
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function apiPath(path: string) {
  return `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}

export type LoginResponse = {
  access: string;
  refresh: string;
};

export type UserMe = {
  id: number;
  username: string;
  email: string;
};

const AUTH_ACCESS_KEY = "portpax_access";
const AUTH_REFRESH_KEY = "portpax_refresh";

export function getStoredAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_ACCESS_KEY);
}

export function getStoredRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_REFRESH_KEY);
}

export function setStoredTokens(access: string, refresh: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_ACCESS_KEY, access);
  localStorage.setItem(AUTH_REFRESH_KEY, refresh);
}

export function clearStoredTokens(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_ACCESS_KEY);
  localStorage.removeItem(AUTH_REFRESH_KEY);
}

export function getAuthHeaders(): HeadersInit {
  const access = getStoredAccessToken();
  return access ? { Authorization: `Bearer ${access}` } : {};
}

/**
 * Login: POST /api/auth/jwt/create/
 */
export async function login(username: string, password: string): Promise<LoginResponse> {
  const res = await fetch(apiPath("api/auth/jwt/create/"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const msg = data.detail ?? data.non_field_errors?.[0] ?? "Credenciales incorrectas";
    throw new Error(typeof msg === "string" ? msg : "Credenciales incorrectas");
  }
  return res.json();
}

/**
 * Refresh access token.
 */
export async function refreshAccessToken(): Promise<string> {
  const refresh = getStoredRefreshToken();
  if (!refresh) throw new Error("No refresh token");
  const res = await fetch(apiPath("api/auth/jwt/refresh/"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });
  if (!res.ok) {
    clearStoredTokens();
    throw new Error("Session expired");
  }
  const data = await res.json();
  const access = data.access as string;
  if (access) localStorage.setItem(AUTH_ACCESS_KEY, access);
  return access;
}

/**
 * Obtiene el usuario actual (GET /api/auth/users/me/).
 */
export async function fetchCurrentUser(): Promise<UserMe> {
  const access = getStoredAccessToken();
  if (!access) throw new Error("Not authenticated");
  const res = await fetch(apiPath("api/auth/users/me/"), {
    headers: { Authorization: `Bearer ${access}` },
  });
  if (res.status === 401) {
    try {
      const newAccess = await refreshAccessToken();
      const retry = await fetch(apiPath("api/auth/users/me/"), {
        headers: { Authorization: `Bearer ${newAccess}` },
      });
      if (!retry.ok) throw new Error("Session expired");
      return retry.json();
    } catch {
      throw new Error("Session expired");
    }
  }
  if (!res.ok) throw new Error("Failed to load user");
  return res.json();
}
