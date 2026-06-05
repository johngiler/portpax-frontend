import { API_BASE } from "./apiBase";

export function apiUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${p}`;
}

export async function apiHealth(): Promise<{ status: string; service: string }> {
  const res = await fetch(apiUrl("api/health/"));
  if (!res.ok) throw new Error("API health check failed");
  return res.json();
}
