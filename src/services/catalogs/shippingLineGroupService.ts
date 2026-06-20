import { apiFetch } from "@/services/apiClient";
import type { ShippingLineGroup, ShippingLineGroupPayload } from "@/types/cruise";

const BASE = "api/catalogs/shipping-line-groups/";

export async function fetchShippingLineGroups(): Promise<ShippingLineGroup[]> {
  return apiFetch<ShippingLineGroup[]>(BASE);
}

export async function createShippingLineGroup(
  payload: ShippingLineGroupPayload,
): Promise<ShippingLineGroup> {
  return apiFetch<ShippingLineGroup>(BASE, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateShippingLineGroup(
  id: number,
  payload: ShippingLineGroupPayload,
): Promise<ShippingLineGroup> {
  return apiFetch<ShippingLineGroup>(`${BASE}${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteShippingLineGroup(id: number): Promise<void> {
  await apiFetch<void>(`${BASE}${id}/`, { method: "DELETE" });
}
