import { apiFetch } from "@/services/apiClient";
import type { PortFender, PortFenderPayload } from "@/types/catalog";

const BASE = "api/catalogs/port-fenders/";

export async function fetchPortFenders(portId: number): Promise<PortFender[]> {
  const data = await apiFetch<{ results: PortFender[] }>(
    `${BASE}?port=${portId}&page_size=100`,
  );
  return data.results.filter((item) => item.is_active);
}

export async function createPortFender(payload: PortFenderPayload): Promise<PortFender> {
  return apiFetch<PortFender>(BASE, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updatePortFender(
  id: number,
  payload: PortFenderPayload,
): Promise<PortFender> {
  return apiFetch<PortFender>(`${BASE}${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deletePortFender(id: number): Promise<void> {
  await apiFetch<void>(`${BASE}${id}/`, { method: "DELETE" });
}
