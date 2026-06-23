import {
  clearStoredTokens,
  getAuthHeaders,
  notifySessionExpired,
  refreshAccessToken,
} from "./authService";
import { API_BASE } from "./apiBase";

export function apiUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${p}`;
}

export type ApiListResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function normalizeErrorMessages(value: unknown): string[] {
  if (value == null) return [];
  if (Array.isArray(value)) return value.flatMap(normalizeErrorMessages);
  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>).flatMap(normalizeErrorMessages);
  }
  const text = String(value).trim();
  return text ? [text] : [];
}

function extractFieldErrors(data: Record<string, unknown>): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(data)) {
    if (key === "detail") continue;
    const messages = normalizeErrorMessages(value);
    if (messages.length) fieldErrors[key] = messages;
  }
  return fieldErrors;
}

async function parseError(res: Response): Promise<ApiError> {
  const data = await res.json().catch(() => ({}));

  if (typeof data === "string" && data.trim()) {
    return new ApiError(data.trim(), res.status);
  }

  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return new ApiError(`Error en la solicitud (${res.status}).`, res.status);
  }

  const payload = data as Record<string, unknown>;
  const fieldErrors = extractFieldErrors(payload);
  const detail = typeof payload.detail === "string" ? payload.detail.trim() : "";
  const nonField = fieldErrors.non_field_errors?.[0];
  const firstField = Object.entries(fieldErrors).find(([key]) => key !== "non_field_errors")?.[1]?.[0];
  const message =
    detail ||
    nonField ||
    firstField ||
    Object.values(fieldErrors).flat()[0] ||
    `Error en la solicitud (${res.status}).`;

  return new ApiError(message, res.status, Object.keys(fieldErrors).length ? fieldErrors : undefined);
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  retry = true,
): Promise<T> {
  const headers = new Headers(init.headers);
  const auth = getAuthHeaders() as Record<string, string>;
  if (auth.Authorization) headers.set("Authorization", auth.Authorization);
  if (init.body && !headers.has("Content-Type") && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(apiUrl(path), { ...init, headers });

  if (res.status === 401 && retry) {
    try {
      const access = await refreshAccessToken();
      headers.set("Authorization", `Bearer ${access}`);
      const retryRes = await fetch(apiUrl(path), { ...init, headers });
      if (!retryRes.ok) throw await parseError(retryRes);
      if (retryRes.status === 204) return undefined as T;
      return retryRes.json();
    } catch {
      notifySessionExpired();
      throw new ApiError("Tu sesión expiró. Inicia sesión de nuevo.", 401);
    }
  }

  if (!res.ok) throw await parseError(res);
  if (res.status === 204) return undefined as T;
  return res.json();
}

export async function apiHealth(): Promise<{ status: string; service: string }> {
  const res = await fetch(apiUrl("api/health/"));
  if (!res.ok) throw new Error("API health check failed");
  return res.json();
}
