import { apiFetch, type ApiListResponse } from "@/services/apiClient";
import type {
  ChangePasswordPayload,
  ManagedUser,
  ManagedUserPayload,
  MeProfile,
  MeProfilePayload,
  MeProfileSaveOptions,
} from "@/types/accounts";

const USERS_BASE = "api/accounts/users/";
const ME_BASE = "api/accounts/me/";

export type FetchUsersParams = {
  page?: number;
  search?: string;
  pageSize?: number;
};

export async function fetchUsers(
  params: FetchUsersParams = {},
): Promise<ApiListResponse<ManagedUser>> {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.pageSize) query.set("page_size", String(params.pageSize));
  const qs = query.toString();
  return apiFetch<ApiListResponse<ManagedUser>>(`${USERS_BASE}${qs ? `?${qs}` : ""}`);
}

export async function createUser(payload: ManagedUserPayload): Promise<ManagedUser> {
  return apiFetch<ManagedUser>(USERS_BASE, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateUser(
  id: number,
  payload: ManagedUserPayload,
): Promise<ManagedUser> {
  return apiFetch<ManagedUser>(`${USERS_BASE}${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteUser(id: number): Promise<void> {
  await apiFetch<void>(`${USERS_BASE}${id}/`, { method: "DELETE" });
}

export async function fetchMeProfile(): Promise<MeProfile> {
  return apiFetch<MeProfile>(ME_BASE);
}

function buildMeProfileFormData(
  payload: MeProfilePayload,
  options?: MeProfileSaveOptions,
): FormData {
  const form = new FormData();
  form.append("email", payload.email);
  form.append("first_name", payload.first_name);
  form.append("last_name", payload.last_name);
  if (options?.avatarFile) {
    form.append("avatar", options.avatarFile);
  } else if (options?.removeAvatar) {
    form.append("avatar", "");
  }
  return form;
}

export async function updateMeProfile(
  payload: MeProfilePayload,
  options?: MeProfileSaveOptions,
): Promise<MeProfile> {
  // Always multipart so avatar uploads are reliable with DRF parsers.
  return apiFetch<MeProfile>(ME_BASE, {
    method: "PATCH",
    body: buildMeProfileFormData(payload, options),
  });
}

export async function changeMyPassword(payload: ChangePasswordPayload): Promise<void> {
  await apiFetch<{ detail: string }>(`${ME_BASE}change-password/`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
