import { apiFetch } from "@/services/apiClient";
import type {
  AppNotification,
  NotificationListResponse,
} from "@/types/notification";

export async function fetchNotifications(
  page = 1,
  pageSize = 20,
): Promise<NotificationListResponse> {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });
  return apiFetch<NotificationListResponse>(
    `/api/notifications/?${params.toString()}`,
  );
}

export async function fetchNotificationUnreadCount(): Promise<number> {
  const data = await apiFetch<{ count: number }>(
    "/api/notifications/unread-count/",
  );
  return data.count ?? 0;
}

export async function markNotificationRead(
  id: number,
): Promise<AppNotification> {
  return apiFetch<AppNotification>(`/api/notifications/${id}/read/`, {
    method: "POST",
  });
}

export async function markAllNotificationsRead(): Promise<number> {
  const data = await apiFetch<{ updated: number }>(
    "/api/notifications/read-all/",
    { method: "POST" },
  );
  return data.updated ?? 0;
}
