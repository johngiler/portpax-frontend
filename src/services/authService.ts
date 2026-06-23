import type { LoginResponse, UserMe } from "@/types/auth";
import { API_BASE } from "./apiBase";

function apiPath(path: string) {
  return `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}

const AUTH_ACCESS_KEY = "portpax_access";
const AUTH_REFRESH_KEY = "portpax_refresh";

/** Refresh access token this many ms before JWT exp. */
const ACCESS_TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;

let refreshInFlight: Promise<string> | null = null;
let sessionExpiredHandler: (() => void) | null = null;
let sessionExpiredNotified = false;

export function setSessionExpiredHandler(handler: (() => void) | null): void {
  sessionExpiredHandler = handler;
}

export function resetSessionExpiredState(): void {
  sessionExpiredNotified = false;
}

export function notifySessionExpired(): void {
  if (sessionExpiredNotified) return;
  sessionExpiredNotified = true;
  clearStoredTokens();
  sessionExpiredHandler?.();
}

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
  resetSessionExpiredState();
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

function getAccessTokenExpiryMs(access: string): number | null {
  try {
    const payload = access.split(".")[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(atob(normalized)) as { exp?: number };
    return typeof decoded.exp === "number" ? decoded.exp * 1000 : null;
  } catch {
    return null;
  }
}

function accessTokenNeedsRefresh(access: string): boolean {
  const expMs = getAccessTokenExpiryMs(access);
  if (!expMs) return false;
  return Date.now() >= expMs - ACCESS_TOKEN_REFRESH_BUFFER_MS;
}

import { translateApiMessage } from "@/lib/apiFormErrors";

export async function login(username: string, password: string): Promise<LoginResponse> {
  const res = await fetch(apiPath("api/auth/jwt/create/"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({})) as {
      detail?: string;
      non_field_errors?: string | string[];
    };
    const raw =
      data.detail ??
      (Array.isArray(data.non_field_errors)
        ? data.non_field_errors[0]
        : data.non_field_errors) ??
      "Credenciales incorrectas";
    const msg = typeof raw === "string" ? raw : "Credenciales incorrectas";
    throw new Error(translateApiMessage(msg));
  }
  return res.json();
}

export async function refreshAccessToken(): Promise<string> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const refresh = getStoredRefreshToken();
    if (!refresh) {
      notifySessionExpired();
      throw new Error("No refresh token");
    }

    const res = await fetch(apiPath("api/auth/jwt/refresh/"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });

    if (!res.ok) {
      notifySessionExpired();
      throw new Error("Session expired");
    }

    const data = (await res.json()) as { access?: string; refresh?: string };
    const access = data.access;
    if (!access) {
      notifySessionExpired();
      throw new Error("Session expired");
    }

    localStorage.setItem(AUTH_ACCESS_KEY, access);
    if (data.refresh) localStorage.setItem(AUTH_REFRESH_KEY, data.refresh);
    return access;
  })();

  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

/** Proactively refresh when access token is near expiry (idle tabs, background timers). */
export async function ensureFreshAccessToken(): Promise<string | null> {
  const access = getStoredAccessToken();
  if (!access) return null;
  if (!accessTokenNeedsRefresh(access)) return access;
  return refreshAccessToken();
}

export async function fetchCurrentUser(): Promise<UserMe> {
  const access = await ensureFreshAccessToken();
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
      if (!retry.ok) {
        notifySessionExpired();
        throw new Error("Session expired");
      }
      return retry.json();
    } catch {
      notifySessionExpired();
      throw new Error("Session expired");
    }
  }

  if (!res.ok) throw new Error("Failed to load user");
  return res.json();
}
