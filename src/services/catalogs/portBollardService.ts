import { apiFetch } from "@/services/apiClient";
import type { PortBollard, PortBollardPayload } from "@/types/catalog";

const BASE = "api/catalogs/port-bollards/";

export async function createPortBollard(payload: PortBollardPayload): Promise<PortBollard> {
  return apiFetch<PortBollard>(BASE, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updatePortBollard(
  id: number,
  payload: PortBollardPayload,
): Promise<PortBollard> {
  return apiFetch<PortBollard>(`${BASE}${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deletePortBollard(id: number): Promise<void> {
  await apiFetch<void>(`${BASE}${id}/`, { method: "DELETE" });
}
