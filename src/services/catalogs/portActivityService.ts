import { apiFetch } from "@/services/apiClient";

export type PortActivityKind = "all" | "crud";

export type PortActivityItem = {
  kind: "crud";
  audit_id?: number | null;
  action: string;
  occurred_at: string;
  actor_display: string | null;
  summary: string;
  port_id: number | null;
  port_code: string;
  port_name: string;
  changes: Record<string, unknown>;
  entity: Record<string, unknown> | null;
};

export type PortActivityResponse = {
  count: number;
  page: number;
  page_size: number;
  results: PortActivityItem[];
};

const BASE = "api/catalogs/ports/";

export async function fetchPortActivity(params: {
  page?: number;
  page_size?: number;
  kind?: PortActivityKind;
  date_from?: string;
  date_to?: string;
  actor?: string;
  port_id?: number;
}): Promise<PortActivityResponse> {
  const sp = new URLSearchParams();
  if (params.page) sp.set("page", String(params.page));
  if (params.page_size) sp.set("page_size", String(params.page_size));
  if (params.kind && params.kind !== "all") sp.set("kind", params.kind);
  if (params.date_from) sp.set("date_from", params.date_from);
  if (params.date_to) sp.set("date_to", params.date_to);
  if (params.actor?.trim()) sp.set("actor", params.actor.trim());
  if (params.port_id) sp.set("port_id", String(params.port_id));
  const qs = sp.toString();
  return apiFetch<PortActivityResponse>(
    `${BASE}activity/${qs ? `?${qs}` : ""}`,
  );
}

export type PortActivityActor = { id: number; label: string };

export async function fetchPortActivityActors(): Promise<{
  results: PortActivityActor[];
  has_system: boolean;
}> {
  return apiFetch<{ results: PortActivityActor[]; has_system: boolean }>(
    `${BASE}activity-actors/`,
  );
}
