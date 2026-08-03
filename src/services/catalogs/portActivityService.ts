import { apiFetch } from "@/services/apiClient";

export type PortActivityKind = "all" | "crud";

export type PortActivityItem = {
  kind: "crud";
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
}): Promise<PortActivityResponse> {
  const sp = new URLSearchParams();
  if (params.page) sp.set("page", String(params.page));
  if (params.page_size) sp.set("page_size", String(params.page_size));
  if (params.kind && params.kind !== "all") sp.set("kind", params.kind);
  if (params.date_from) sp.set("date_from", params.date_from);
  if (params.date_to) sp.set("date_to", params.date_to);
  const qs = sp.toString();
  return apiFetch<PortActivityResponse>(
    `${BASE}activity/${qs ? `?${qs}` : ""}`,
  );
}
