"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import useSWR, { mutate } from "swr";
import { useAuthOptional } from "@/contexts/AuthContext";
import {
  useNotificationsInfinite,
} from "@/hooks/swr/useNotificationsInfinite";
import { swrKeys } from "@/lib/swr/keys";
import { wsNotificationsUrl } from "@/services/apiBase";
import { getStoredAccessToken } from "@/services/authService";
import {
  fetchNotificationUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/services/notificationService";
import type { AppNotification, NotificationListResponse } from "@/types/notification";

type NotificationContextValue = {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  loadedCount: number;
  totalCount: number;
  loadMore: () => void;
  markRead: (id: number) => Promise<void>;
  markAllRead: () => Promise<void>;
  refresh: () => void;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

function patchNotificationPages(
  pages: NotificationListResponse[] | undefined,
  patch: (item: AppNotification) => AppNotification,
): NotificationListResponse[] | undefined {
  if (!pages) return pages;
  return pages.map((page) => ({
    ...page,
    results: page.results.map(patch),
  }));
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const auth = useAuthOptional();
  const isAuthenticated = auth?.isAuthenticated ?? false;
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [liveItems, setLiveItems] = useState<AppNotification[]>([]);

  const {
    items: baseNotifications,
    totalCount,
    loadedCount,
    hasMore,
    loading,
    loadingMore,
    loadMore,
    refresh: refreshList,
    mutate: mutateList,
    setSize,
  } = useNotificationsInfinite(isAuthenticated);

  const { data: unreadCount = 0, mutate: mutateUnread } = useSWR(
    isAuthenticated ? swrKeys.notificationUnreadCount : null,
    fetchNotificationUnreadCount,
    { refreshInterval: 60_000 },
  );

  const notifications = useMemo(() => {
    const seen = new Set<number>();
    const merged: AppNotification[] = [];
    for (const item of [...liveItems, ...baseNotifications]) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      merged.push(item);
    }
    return merged.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }, [liveItems, baseNotifications]);

  const refresh = useCallback(() => {
    void refreshList();
    void mutateUnread();
  }, [refreshList, mutateUnread]);

  const markRead = useCallback(
    async (id: number) => {
      await markNotificationRead(id);
      const readAt = new Date().toISOString();
      setLiveItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, is_read: true, read_at: readAt }
            : item,
        ),
      );
      void mutateList(
        (pages) =>
          patchNotificationPages(pages, (item) =>
            item.id === id
              ? { ...item, is_read: true, read_at: readAt }
              : item,
          ),
        { revalidate: false },
      );
      void mutateUnread();
      void mutate(swrKeys.notificationUnreadCount);
    },
    [mutateList, mutateUnread],
  );

  const markAllRead = useCallback(async () => {
    await markAllNotificationsRead();
    const readAt = new Date().toISOString();
    setLiveItems((prev) =>
      prev.map((item) => ({
        ...item,
        is_read: true,
        read_at: item.read_at ?? readAt,
      })),
    );
    void mutateList(
      (pages) =>
        patchNotificationPages(pages, (item) => ({
          ...item,
          is_read: true,
          read_at: item.read_at ?? readAt,
        })),
      { revalidate: false },
    );
    void mutateUnread(0, { revalidate: false });
  }, [mutateList, mutateUnread]);

  useEffect(() => {
    if (!isAuthenticated) {
      setLiveItems([]);
      void setSize(1);
      return;
    }

    let cancelled = false;

    function connect() {
      const token = getStoredAccessToken();
      if (!token || cancelled) return;

      const socket = new WebSocket(wsNotificationsUrl(token));
      wsRef.current = socket;

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data as string) as {
            type?: string;
            payload?: AppNotification;
          };
          if (data.type !== "notification" || !data.payload) return;
          const payload = data.payload;
          setLiveItems((prev) => {
            const without = prev.filter((item) => item.id !== payload.id);
            return [payload, ...without];
          });
          void mutateUnread((count) => (typeof count === "number" ? count + 1 : 1), {
            revalidate: false,
          });
          void mutateList();
        } catch {
          // ignore malformed payloads
        }
      };

      socket.onclose = () => {
        if (cancelled) return;
        reconnectTimer.current = setTimeout(connect, 4000);
      };
    }

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      const socket = wsRef.current;
      wsRef.current = null;
      if (!socket) return;
      if (socket.readyState === WebSocket.CONNECTING) {
        socket.onopen = () => socket.close();
      } else {
        socket.close();
      }
    };
  }, [isAuthenticated, mutateList, mutateUnread, setSize]);

  const value = useMemo<NotificationContextValue>(
    () => ({
      notifications,
      unreadCount,
      loading: loading && notifications.length === 0,
      loadingMore,
      hasMore,
      loadedCount: Math.max(loadedCount, notifications.length),
      totalCount: Math.max(totalCount, notifications.length),
      loadMore,
      markRead,
      markAllRead,
      refresh,
    }),
    [
      notifications,
      unreadCount,
      loading,
      loadingMore,
      hasMore,
      loadedCount,
      totalCount,
      loadMore,
      markRead,
      markAllRead,
      refresh,
    ],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return ctx;
}
