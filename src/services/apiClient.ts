import { clearStoredTokens, getAuthHeaders, refreshAccessToken } from "./authService";
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

async function parseError(res: Response): Promise<ApiError> {
  const data = await res.json().catch(() => ({}));
  const fieldErrors =
    typeof data === "object" && data !== null && !Array.isArray(data)
      ? (data as Record<string, string[]>)
      : undefined;
  const detail = (data as { detail?: string }).detail;
  const message =
    typeof detail === "string"
      ? detail
      : fieldErrors
        ? Object.values(fieldErrors).flat().join(" ")
        : `Request failed (${res.status})`;
  return new ApiError(message, res.status, fieldErrors);
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  retry = true,
): Promise<T> {
  const headers = new Headers(init.headers);
  const auth = getAuthHeaders() as Record<string, string>;
  if (auth.Authorization) headers.set("Authorization", auth.Authorization);
  if (init.body && !headers.has("Content-Type")) {
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
      clearStoredTokens();
      throw new ApiError("Session expired", 401);
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
