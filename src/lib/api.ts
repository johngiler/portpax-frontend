/**
 * Cliente API para conectar con el backend PortPax.
 * Base URL desde variable de entorno (local: http://localhost:8000).
 */
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export function apiUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${p}`;
}

export async function apiHealth(): Promise<{ status: string; service: string }> {
  const res = await fetch(apiUrl("api/health/"));
  if (!res.ok) throw new Error("API health check failed");
  return res.json();
}
