"use client";

import { Users } from "lucide-react";
import DropdownMenu from "@/components/ui/DropdownMenu";
import EntityThumb from "@/components/ui/EntityThumb";
import { useNotifications } from "@/contexts/NotificationContext";
import { API_BASE } from "@/services/apiBase";
import type { OnlineUser, PresenceStatus } from "@/types/presence";

const iconBtnClass =
  "relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-black/5 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-zinc-100";

const PANEL_CLASS =
  "dropdown-panel dropdown-panel--solid overflow-hidden rounded-xl ring-1 ring-black/[0.04] dark:ring-white/[0.06]";

type OnlineUsersDropdownProps = {
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
};

function resolveAvatarUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${API_BASE.replace(/\/$/, "")}${path}`;
}

function presenceStatus(user: OnlineUser): PresenceStatus {
  return user.status === "idle" ? "idle" : "active";
}

function OnlineUserRow({ user }: { user: OnlineUser }) {
  const name = user.display_name || user.username;
  const status = presenceStatus(user);
  const isActive = status === "active";
  return (
    <div className="flex items-center gap-3 border-b border-[var(--admin-border)] px-4 py-3 last:border-b-0">
      <EntityThumb
        src={resolveAvatarUrl(user.avatar)}
        label={name}
        size="sm"
        className="!h-9 !w-9 shrink-0"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
          {name}
        </p>
        <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
          {user.role_label || "—"}
          <span className="text-zinc-400 dark:text-zinc-500">
            {" · "}
            {isActive ? "Activo" : "Inactivo"}
          </span>
        </p>
      </div>
      <span
        className={`h-2 w-2 shrink-0 rounded-full ${
          isActive ? "bg-emerald-500" : "bg-amber-400"
        }`}
        title={isActive ? "Activo" : "Inactivo"}
        aria-label={isActive ? "Activo" : "Inactivo"}
      />
    </div>
  );
}

export default function OnlineUsersDropdown({
  open,
  onToggle,
  onClose,
}: OnlineUsersDropdownProps) {
  const { onlineUsers } = useNotifications();
  const count = onlineUsers.length;
  const activeCount = onlineUsers.filter(
    (user) => presenceStatus(user) === "active",
  ).length;
  const badge = count > 0 ? (count > 9 ? "9+" : String(count)) : null;

  return (
    <DropdownMenu
      open={open}
      onClose={onClose}
      width="min-w-[18rem] max-w-[22rem] sm:min-w-[20rem]"
      panelClassName={PANEL_CLASS}
      trigger={
        <button
          type="button"
          className={iconBtnClass}
          aria-label="Usuarios en línea"
          title="Usuarios en línea"
          onClick={onToggle}
        >
          <Users className="h-5 w-5" strokeWidth={1.5} />
          {badge ? (
            <span className="absolute -right-0.5 -top-0.5 z-10 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--admin-accent)] px-1 text-[10px] font-bold leading-none text-white">
              {badge}
            </span>
          ) : null}
        </button>
      }
    >
      <div className="border-b border-[var(--admin-border)] bg-[var(--admin-surface-muted)] px-4 py-3">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Usuarios en línea
        </h3>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          {count === 0
            ? "Nadie conectado"
            : `${count} conectado${count === 1 ? "" : "s"} · ${activeCount} activo${activeCount === 1 ? "" : "s"}`}
        </p>
      </div>
      <div className="max-h-[min(20rem,60vh)] overflow-y-auto bg-[var(--admin-surface)]">
        {count === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
            <Users
              className="h-8 w-8 text-zinc-300 dark:text-zinc-600"
              strokeWidth={1.25}
              aria-hidden
            />
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Sin usuarios en línea
            </p>
          </div>
        ) : (
          onlineUsers.map((user) => (
            <OnlineUserRow key={user.id} user={user} />
          ))
        )}
      </div>
    </DropdownMenu>
  );
}
