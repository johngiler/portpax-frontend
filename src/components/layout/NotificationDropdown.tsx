"use client";

import { useRef } from "react";
import { AlertCircle, Bell, BellOff } from "lucide-react";
import { useRouter } from "next/navigation";
import DropdownMenu from "@/components/ui/DropdownMenu";
import InfiniteScrollFooter from "@/components/ui/InfiniteScrollFooter";
import { useNotifications } from "@/contexts/NotificationContext";
import { formatNotificationTimestamp } from "@/lib/notificationDates";
import { notificationMessageParts } from "@/lib/notificationMessage";
import { notificationHref } from "@/lib/notificationNavigation";
import type { AppNotification } from "@/types/notification";

const iconBtnClass =
  "relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-black/5 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-zinc-100";

const NOTIFICATION_PANEL_CLASS =
  "dropdown-panel dropdown-panel--solid overflow-hidden rounded-xl ring-1 ring-black/[0.04] dark:ring-white/[0.06]";

type NotificationDropdownProps = {
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
};

function NotificationRow({
  item,
  onSelect,
}: {
  item: AppNotification;
  onSelect: (item: AppNotification) => void;
}) {
  const isConflict = item.event.startsWith("conflict_");
  const { lead, code } = notificationMessageParts(item);

  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className={`flex w-full cursor-pointer gap-3 border-b border-[var(--admin-border)] px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-[var(--admin-surface-muted)] dark:hover:bg-[var(--admin-surface-muted)] ${
        item.is_read ? "" : "bg-[var(--admin-surface-muted)]/40 dark:bg-[var(--admin-surface-muted)]/30"
      }`}
    >
      <span
        className={`mt-2 h-2 w-2 shrink-0 rounded-full ${
          item.is_read
            ? "bg-zinc-300 dark:bg-zinc-600"
            : "bg-[var(--admin-accent)]"
        }`}
        aria-hidden
      />
      <span className="min-w-0 flex-1">
        <span
          className={`block text-sm leading-snug ${
            item.is_read
              ? "font-medium text-zinc-600 dark:text-zinc-400"
              : "font-semibold text-zinc-900 dark:text-zinc-50"
          }`}
        >
          <span className="block">{lead}</span>
          {code ? (
            <span className="mt-0.5 block break-all font-mono text-[10px] font-normal leading-snug tracking-tight text-zinc-500 dark:text-zinc-400">
              {code}
            </span>
          ) : null}
        </span>
        {item.actor_display ? (
          <span className="mt-1 block text-xs text-zinc-500 dark:text-zinc-400">
            Por: {item.actor_display}
          </span>
        ) : null}
        <span className="mt-0.5 block text-[11px] text-zinc-400 dark:text-zinc-500">
          {formatNotificationTimestamp(item.created_at)}
        </span>
      </span>
      {isConflict ? (
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500/15 dark:bg-amber-500/20">
          <AlertCircle
            className="h-4 w-4 text-amber-600 dark:text-amber-400"
            strokeWidth={2}
            aria-hidden
          />
        </span>
      ) : null}
    </button>
  );
}

function NotificationSkeleton() {
  return (
    <div className="divide-y divide-[var(--admin-border)]">
      {[0, 1, 2].map((key) => (
        <div key={key} className="flex gap-3 px-4 py-3">
          <div className="mt-2 h-2 w-2 shrink-0 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-700" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3.5 w-4/5 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
            <div className="h-3 w-1/3 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
            <div className="h-2.5 w-2/5 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function NotificationDropdown({
  open,
  onToggle,
  onClose,
}: NotificationDropdownProps) {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const {
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
  } = useNotifications();

  const badge =
    unreadCount > 0 ? (unreadCount > 9 ? "9+" : String(unreadCount)) : null;

  async function handleSelect(item: AppNotification) {
    if (!item.is_read) {
      await markRead(item.id);
    }
    onClose();
    router.push(notificationHref(item));
  }

  async function handleMarkAll() {
    if (unreadCount === 0) return;
    await markAllRead();
  }

  return (
    <DropdownMenu
      open={open}
      onClose={onClose}
      width="min-w-[22rem] max-w-[24rem] sm:min-w-[24rem]"
      panelClassName={NOTIFICATION_PANEL_CLASS}
      trigger={
        <button
          type="button"
          className={iconBtnClass}
          aria-label="Notificaciones"
          title="Notificaciones"
          onClick={onToggle}
        >
          <Bell className="h-5 w-5" strokeWidth={1.5} />
          {badge ? (
            <span className="absolute -right-0.5 -top-0.5 z-10 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--admin-accent)] px-1 text-[10px] font-bold leading-none text-white">
              {badge}
            </span>
          ) : null}
        </button>
      }
    >
      <div className="border-b border-[var(--admin-border)] bg-[var(--admin-surface-muted)] px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Notificaciones
            </h3>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              {unreadCount > 0
                ? `${unreadCount} sin leer`
                : "Estás al día"}
            </p>
          </div>
          {unreadCount > 0 ? (
            <button
              type="button"
              onClick={() => void handleMarkAll()}
              className="shrink-0 cursor-pointer rounded-md px-2 py-1 text-xs font-medium text-[var(--admin-fuchsia)] transition-colors hover:bg-[var(--admin-fuchsia-soft)]"
            >
              Marcar todas
            </button>
          ) : null}
        </div>
      </div>

      <div
        ref={scrollRef}
        className="max-h-[min(24rem,70vh)] overflow-y-auto bg-[var(--admin-surface)]"
      >
        {loading ? <NotificationSkeleton /> : null}
        {!loading && notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-2 bg-[var(--admin-surface)] px-6 py-10 text-center">
            <BellOff
              className="h-8 w-8 text-zinc-300 dark:text-zinc-600"
              strokeWidth={1.25}
              aria-hidden
            />
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Sin notificaciones
            </p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              Los movimientos de reservas aparecerán aquí.
            </p>
          </div>
        ) : null}
        {!loading
          ? notifications.map((item) => (
              <NotificationRow
                key={item.id}
                item={item}
                onSelect={handleSelect}
              />
            ))
          : null}
        {!loading && notifications.length > 0 ? (
          <InfiniteScrollFooter
            hasMore={hasMore}
            loading={loadingMore}
            onLoadMore={loadMore}
            loadedCount={loadedCount}
            totalCount={totalCount}
            itemLabel="notificaciones"
            scrollRootRef={scrollRef}
            className="mt-0 border-t border-[var(--admin-border)] py-3"
            rootMargin="80px"
          />
        ) : null}
      </div>
    </DropdownMenu>
  );
}
