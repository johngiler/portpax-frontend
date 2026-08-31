import { apiFetch } from "@/services/apiClient";
import type { UserRole } from "@/types/accounts";

export type UserActivityKind = "all" | "crud" | "login";

export type UserActivityItem = {
  kind: "crud" | "login";
  audit_id?: number;
  action: string;
  occurred_at: string;
  actor_display: string | null;
  summary: string;
  subject_id: number | null;
  subject_username: string;
  subject_display: string;
  subject_role: UserRole | null;
  subject_is_active: boolean | null;
  changes: Record<string, unknown>;
};

export type UserActivityResponse = {
  count: number;
  page: number;
  page_size: number;
  results: UserActivityItem[];
};

const BASE = "api/accounts/users/";

export async function fetchUserActivity(params: {
  page?: number;
  page_size?: number;
  kind?: UserActivityKind;
  role?: UserRole | "";
  is_active?: "" | "true" | "false";
  date_from?: string;
  date_to?: string;
  actor?: string;
  user_id?: number;
}): Promise<UserActivityResponse> {
  const sp = new URLSearchParams();
  if (params.page) sp.set("page", String(params.page));
  if (params.page_size) sp.set("page_size", String(params.page_size));
  if (params.kind && params.kind !== "all") sp.set("kind", params.kind);
  if (params.role) sp.set("role", params.role);
  if (params.is_active) sp.set("is_active", params.is_active);
  if (params.date_from) sp.set("date_from", params.date_from);
  if (params.date_to) sp.set("date_to", params.date_to);
  if (params.actor?.trim()) sp.set("actor", params.actor.trim());
  if (params.user_id && params.user_id > 0) {
    sp.set("user_id", String(params.user_id));
  }
  const qs = sp.toString();
  return apiFetch<UserActivityResponse>(
    `${BASE}activity/${qs ? `?${qs}` : ""}`,
  );
}

export type UserActivityActor = { id: number; label: string };

export async function fetchUserActivityActors(): Promise<{
  results: UserActivityActor[];
  has_system: boolean;
}> {
  return apiFetch<{ results: UserActivityActor[]; has_system: boolean }>(
    `${BASE}activity-actors/`,
  );
}
