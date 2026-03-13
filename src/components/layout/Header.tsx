"use client";

import {
  Bell,
  CircleUser,
  HelpCircle,
  LogOut,
  MessageSquare,
  Settings,
  User,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DropdownMenu from "@/components/ui/DropdownMenu";
import PortPaxLogo from "./PortPaxLogo";

const iconBtnClass =
  "relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-black/5 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-zinc-100";

const NOTIFICATIONS_DUMMY = [
  {
    id: "1",
    title: "Nueva escala asignada",
    body: "Muelle 2 — Caribbean Princess, 14:00",
    time: "Hace 5 min",
    unread: true,
  },
  {
    id: "2",
    title: "Barco llegó a puerto",
    body: "Port of Roatán — Harmony of the Seas",
    time: "Hace 1 h",
    unread: true,
  },
  {
    id: "3",
    title: "Actualización de tarifas",
    body: "Se aplicaron los nuevos precios de muellaje",
    time: "Ayer",
    unread: false,
  },
];

const MESSAGES_DUMMY = [
  {
    id: "1",
    from: "Equipo PortPax",
    preview: "Recordatorio: cierre de manifiestos a las 18:00",
    time: "10:30",
  },
  {
    id: "2",
    from: "Soporte",
    preview: "Tu solicitud de acceso a reportes fue aprobada.",
    time: "Ayer",
  },
  {
    id: "3",
    from: "Sistema",
    preview: "Backup completado correctamente.",
    time: "Lun",
  },
];

export default function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [openMenu, setOpenMenu] = useState<
    "notifications" | "messages" | "user" | null
  >(null);
  const notificationCount = NOTIFICATIONS_DUMMY.filter((n) => n.unread).length;

  const closeAll = () => setOpenMenu(null);
  const toggle = (key: "notifications" | "messages" | "user") =>
    setOpenMenu((prev) => (prev === key ? null : key));

  const handleLogout = () => {
    closeAll();
    logout();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-2 overflow-visible px-4 shadow-[var(--admin-card-shadow)] backdrop-blur-md sm:h-16 sm:px-6">
      <span
        className="pointer-events-none absolute inset-0 -z-10 dark:hidden"
        style={{ background: "var(--admin-gradient-header)" }}
        aria-hidden
      />
      <span
        className="pointer-events-none absolute inset-0 -z-10 hidden dark:block"
        style={{ background: "var(--admin-gradient-header)" }}
        aria-hidden
      />
      <div className="relative flex min-w-0 shrink items-center gap-2 sm:gap-3">
        <Link href="/" className="cursor-pointer" aria-label="Ir al Dashboard">
          <PortPaxLogo showSlogan sloganClassName="hidden sm:block" />
        </Link>
      </div>
      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <DropdownMenu
          open={openMenu === "notifications"}
          onClose={closeAll}
          width="min-w-[20rem] max-w-[22rem]"
          trigger={
            <button
              type="button"
              className={iconBtnClass}
              aria-label="Notificaciones"
              title="Notificaciones"
              onClick={() => toggle("notifications")}
            >
              <Bell className="h-5 w-5" strokeWidth={1.5} />
              {notificationCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--admin-accent)] px-1 text-[10px] font-bold text-white">
                  {notificationCount > 9 ? "9+" : notificationCount}
                </span>
              )}
            </button>
          }
        >
          <div className="dropdown-panel overflow-hidden">
            <div className="border-b border-zinc-200/80 px-4 py-3 dark:border-zinc-700/70">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Notificaciones
              </h3>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                {notificationCount} sin leer
              </p>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {NOTIFICATIONS_DUMMY.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  className="flex w-full cursor-pointer flex-col gap-0.5 border-b border-zinc-100 px-4 py-3 text-left transition-colors hover:bg-[var(--admin-accent)]/10 dark:border-zinc-800 dark:hover:bg-[var(--admin-accent)]/15"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`text-sm font-medium ${n.unread ? "text-zinc-900 dark:text-zinc-50" : "text-zinc-600 dark:text-zinc-400"}`}
                    >
                      {n.title}
                    </span>
                    <span className="shrink-0 text-[11px] text-zinc-400 dark:text-zinc-500">
                      {n.time}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {n.body}
                  </p>
                </button>
              ))}
            </div>
            <div className="border-t border-zinc-200/80 p-2 dark:border-zinc-700/70">
              <button
                type="button"
                className="w-full cursor-pointer rounded-lg border border-[var(--admin-fuchsia)]/40 bg-[var(--admin-fuchsia)]/10 py-2.5 text-center text-sm font-semibold text-[var(--admin-fuchsia)] transition-colors hover:bg-[var(--admin-fuchsia)]/20 dark:border-[var(--admin-fuchsia)]/50 dark:bg-[var(--admin-fuchsia)]/15 dark:hover:bg-[var(--admin-fuchsia)]/25"
              >
                Ver todas
              </button>
            </div>
          </div>
        </DropdownMenu>

        <DropdownMenu
          open={openMenu === "messages"}
          onClose={closeAll}
          width="min-w-[20rem] max-w-[22rem]"
          trigger={
            <button
              type="button"
              className={iconBtnClass}
              aria-label="Mensajes"
              title="Mensajes"
              onClick={() => toggle("messages")}
            >
              <MessageSquare className="h-5 w-5" strokeWidth={1.5} />
            </button>
          }
        >
          <div className="dropdown-panel overflow-hidden">
            <div className="border-b border-zinc-200/80 px-4 py-3 dark:border-zinc-700/70">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Mensajes
              </h3>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                Bandeja de entrada
              </p>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {MESSAGES_DUMMY.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className="flex w-full cursor-pointer flex-col gap-0.5 border-b border-zinc-100 px-4 py-3 text-left transition-colors hover:bg-[var(--admin-accent)]/10 dark:border-zinc-800 dark:hover:bg-[var(--admin-accent)]/15"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      {m.from}
                    </span>
                    <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                      {m.time}
                    </span>
                  </div>
                  <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                    {m.preview}
                  </p>
                </button>
              ))}
            </div>
            <div className="border-t border-zinc-200/80 p-2 dark:border-zinc-700/70">
              <button
                type="button"
                className="w-full cursor-pointer rounded-lg border border-[var(--admin-fuchsia)]/40 bg-[var(--admin-fuchsia)]/10 py-2.5 text-center text-sm font-semibold text-[var(--admin-fuchsia)] transition-colors hover:bg-[var(--admin-fuchsia)]/20 dark:border-[var(--admin-fuchsia)]/50 dark:bg-[var(--admin-fuchsia)]/15 dark:hover:bg-[var(--admin-fuchsia)]/25"
              >
                Ver todos los mensajes
              </button>
            </div>
          </div>
        </DropdownMenu>

        <button
          type="button"
          className={iconBtnClass}
          aria-label="Ayuda"
          title="Ayuda"
        >
          <HelpCircle className="h-5 w-5" strokeWidth={1.5} />
        </button>
        <div
          className="ml-1 h-4 w-px bg-zinc-300/60 dark:bg-zinc-600/60 sm:h-5"
          aria-hidden
        />
        <span className="hidden rounded-full px-2 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-300 sm:inline md:px-3 md:py-1.5">
          admin
        </span>

        <DropdownMenu
          open={openMenu === "user"}
          onClose={closeAll}
          width="min-w-[12rem]"
          trigger={
            <button
              type="button"
              className={iconBtnClass}
              aria-label="Perfil del usuario"
              title="Perfil"
              onClick={() => toggle("user")}
            >
              <CircleUser className="h-5 w-5" strokeWidth={1.5} />
            </button>
          }
        >
          <div className="dropdown-panel overflow-hidden py-2">
            <div className="border-b border-zinc-200/80 px-4 pb-3 dark:border-zinc-700/70">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                Cuenta
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {user?.email || user?.username || "—"}
              </p>
            </div>
            <div className="py-1">
              <Link
                href="/configuration"
                onClick={closeAll}
                className="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 transition-colors hover:bg-[var(--admin-accent)]/10 hover:text-[var(--admin-accent)] dark:text-zinc-300 dark:hover:bg-[var(--admin-accent)]/15"
              >
                <User className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                Mi perfil
              </Link>
              <Link
                href="/configuration"
                onClick={closeAll}
                className="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 transition-colors hover:bg-[var(--admin-accent)]/10 hover:text-[var(--admin-accent)] dark:text-zinc-300 dark:hover:bg-[var(--admin-accent)]/15"
              >
                <Settings className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                Configuración
              </Link>
            </div>
            <div className="border-t border-zinc-200/80 pt-1 dark:border-zinc-700/70">
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-sm text-zinc-600 transition-colors hover:bg-red-500/10 hover:text-red-600 dark:text-zinc-400 dark:hover:bg-red-500/15 dark:hover:text-red-400"
              >
                <LogOut className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                Cerrar sesión
              </button>
            </div>
          </div>
        </DropdownMenu>
      </div>
    </header>
  );
}
