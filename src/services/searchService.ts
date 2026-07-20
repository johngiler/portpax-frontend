import { apiFetch } from "@/services/apiClient";
import type { GlobalSearchResult } from "@/types/search";

export async function globalSearch(q: string): Promise<GlobalSearchResult> {
  const trimmed = q.trim();
  if (trimmed.length < 2) {
    return { shipping_lines: [], ports: [], ships: [], scales: [] };
  }
  const params = new URLSearchParams({ q: trimmed });
  return apiFetch<GlobalSearchResult>(`/api/search/?${params.toString()}`);
}
