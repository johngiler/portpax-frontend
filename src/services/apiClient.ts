import {
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

async function authorizedFetch(
  path: string,
  init: RequestInit = {},
  retry = true,
): Promise<Response> {
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
      return fetch(apiUrl(path), { ...init, headers });
    } catch {
      notifySessionExpired();
      throw new ApiError("Tu sesión expiró. Inicia sesión de nuevo.", 401);
    }
  }

  return res;
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  retry = true,
): Promise<T> {
  const res = await authorizedFetch(path, init, retry);

  if (!res.ok) throw await parseError(res);
  if (res.status === 204) return undefined as T;
  return res.json();
}

function filenameFromContentDisposition(header: string | null): string | null {
  if (!header) return null;
  const utfMatch = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (utfMatch?.[1]) {
    try {
      return decodeURIComponent(utfMatch[1].trim());
    } catch {
      return utfMatch[1].trim();
    }
  }
  const plainMatch = /filename="?([^";]+)"?/i.exec(header);
  return plainMatch?.[1]?.trim() ?? null;
}

/** Authenticated binary download (CSV, XLSX, etc.). */
export async function apiDownload(
  path: string,
  init: RequestInit = {},
  retry = true,
): Promise<{ blob: Blob; filename: string | null }> {
  const res = await authorizedFetch(path, init, retry);
  if (!res.ok) throw await parseError(res);
  const blob = await res.blob();
  const filename = filenameFromContentDisposition(res.headers.get("Content-Disposition"));
  return { blob, filename };
}

export function triggerBrowserDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export async function apiHealth(): Promise<{ status: string; service: string }> {
  const res = await fetch(apiUrl("api/health/"));
  if (!res.ok) throw new Error("API health check failed");
  return res.json();
}
