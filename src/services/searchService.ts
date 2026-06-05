import type { GlobalSearchResult } from "@/types/search";

/** Stub until catalog/booking search endpoints exist. */
export async function globalSearch(q: string): Promise<GlobalSearchResult> {
  if (q.trim().length < 2) {
    return { shipping_lines: [], ports: [], ships: [], scales: [] };
  }
  return { shipping_lines: [], ports: [], ships: [], scales: [] };
}
