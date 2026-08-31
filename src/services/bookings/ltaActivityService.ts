import { apiFetch } from "@/services/apiClient";

export type LtaActivityKind = "all" | "crud" | "link" | "generate";

export type LtaActivityItem = {
  kind: "crud" | "link" | "generate";
  audit_id?: number | null;
  action: string;
  occurred_at: string;
  actor_display: string | null;
  summary: string;
  agreement_id: number | null;
  agreement_code: string;
  agreement_name: string;
  port_code: string | null;
  port_name: string | null;
  shipping_line_code: string | null;
  shipping_line_name: string | null;
  changes: Record<string, unknown>;
  entity: Record<string, unknown> | null;
};

export type LtaActivityResponse = {
  count: number;
  page: number;
  page_size: number;
  results: LtaActivityItem[];
};

const BASE = "api/bookings/long-term-agreements/";

export async function fetchLtaActivity(params: {
  page?: number;
  page_size?: number;
  kind?: LtaActivityKind;
  date_from?: string;
  date_to?: string;
  actor?: string;
  agreement_id?: number;
}): Promise<LtaActivityResponse> {
  const sp = new URLSearchParams();
  if (params.page) sp.set("page", String(params.page));
  if (params.page_size) sp.set("page_size", String(params.page_size));
  if (params.kind && params.kind !== "all") sp.set("kind", params.kind);
  if (params.date_from) sp.set("date_from", params.date_from);
  if (params.date_to) sp.set("date_to", params.date_to);
  if (params.actor?.trim()) sp.set("actor", params.actor.trim());
  if (params.agreement_id) sp.set("agreement_id", String(params.agreement_id));
  const qs = sp.toString();
  return apiFetch<LtaActivityResponse>(
    `${BASE}activity/${qs ? `?${qs}` : ""}`,
  );
}

export type LtaActivityActor = { id: number; label: string };

export async function fetchLtaActivityActors(): Promise<{
  results: LtaActivityActor[];
  has_system: boolean;
}> {
  return apiFetch<{ results: LtaActivityActor[]; has_system: boolean }>(
    `${BASE}activity-actors/`,
  );
}
