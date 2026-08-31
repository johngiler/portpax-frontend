import { apiFetch } from "@/services/apiClient";

export type ShippingLineActivityKind = "all" | "crud";

export type ShippingLineActivityItem = {
  kind: "crud";
  audit_id?: number | null;
  action: string;
  occurred_at: string;
  actor_display: string | null;
  summary: string;
  shipping_line_id: number | null;
  shipping_line_code: string;
  shipping_line_name: string;
  group_name: string | null;
  changes: Record<string, unknown>;
  entity: Record<string, unknown> | null;
};

export type ShippingLineActivityResponse = {
  count: number;
  page: number;
  page_size: number;
  results: ShippingLineActivityItem[];
};

const BASE = "api/catalogs/shipping-lines/";

export async function fetchShippingLineActivity(params: {
  page?: number;
  page_size?: number;
  kind?: ShippingLineActivityKind;
  date_from?: string;
  date_to?: string;
  actor?: string;
  shipping_line_id?: number;
}): Promise<ShippingLineActivityResponse> {
  const sp = new URLSearchParams();
  if (params.page) sp.set("page", String(params.page));
  if (params.page_size) sp.set("page_size", String(params.page_size));
  if (params.kind && params.kind !== "all") sp.set("kind", params.kind);
  if (params.date_from) sp.set("date_from", params.date_from);
  if (params.date_to) sp.set("date_to", params.date_to);
  if (params.actor?.trim()) sp.set("actor", params.actor.trim());
  if (params.shipping_line_id) {
    sp.set("shipping_line_id", String(params.shipping_line_id));
  }
  const qs = sp.toString();
  return apiFetch<ShippingLineActivityResponse>(
    `${BASE}activity/${qs ? `?${qs}` : ""}`,
  );
}

export type ShippingLineActivityActor = { id: number; label: string };

export async function fetchShippingLineActivityActors(): Promise<{
  results: ShippingLineActivityActor[];
  has_system: boolean;
}> {
  return apiFetch<{
    results: ShippingLineActivityActor[];
    has_system: boolean;
  }>(`${BASE}activity-actors/`);
}
