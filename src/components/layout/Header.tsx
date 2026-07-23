"use client";

import {
  Bell,
  LogOut,
  Menu,
  Moon,
  Sun,
  UserCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useMainLayout } from "@/contexts/MainLayoutContext";
import { useTheme } from "@/hooks/useTheme";
import DropdownMenu from "@/components/ui/DropdownMenu";
import EntityThumb from "@/components/ui/EntityThumb";
import GlobalSearch from "@/components/search/GlobalSearch";
import { userRoleLabel } from "@/types/accounts";
import { userDisplayName } from "@/types/auth";
import { roleHomePath } from "@/lib/navAccess";
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

export default function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [openMenu, setOpenMenu] = useState<"notifications" | "user" | null>(null);
  const notificationCount = NOTIFICATIONS_DUMMY.filter((n) => n.unread).length;

  const { resolvedTheme, toggleTheme } = useTheme();
  const { isMobile, sidebarMobileOpen, setSidebarMobileOpen } = useMainLayout();
  const homeHref = roleHomePath(user?.role);
  const closeAll = () => setOpenMenu(null);
  const toggle = (key: "notifications" | "user") =>
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
      <div
        className="pointer-events-none absolute right-0 top-0 z-0 h-16 w-24 overflow-hidden sm:w-28"
        aria-hidden
      >
        <span className="header-square header-square-1" />
        <span className="header-square header-square-2" />
        <span className="header-square header-square-3" />
        <span className="header-square header-square-4" />
      </div>
      <div className="relative flex min-w-0 shrink items-center gap-2 sm:gap-3">
        {isMobile && (
          <button
            type="button"
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-black/5 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-zinc-100 md:hidden"
            aria-label={sidebarMobileOpen ? "Cerrar menú" : "Abrir menú"}
            title={sidebarMobileOpen ? "Cerrar menú" : "Abrir menú"}
            onClick={() => setSidebarMobileOpen(!sidebarMobileOpen)}
          >
            <Menu className="h-5 w-5" strokeWidth={1.5} />
          </button>
        )}
        <Link
          href={homeHref}
          className="cursor-pointer shrink-0"
          aria-label="Ir al inicio"
        >
          <PortPaxLogo showSlogan sloganClassName="hidden sm:block" />
        </Link>
      </div>
      <div className="relative z-10 flex shrink-0 items-center gap-1 sm:gap-2">
        <div className="hidden sm:block">
          <GlobalSearch />
        </div>
        <button
          type="button"
          className={iconBtnClass}
          aria-label={
            resolvedTheme === "dark" ? "Usar tema claro" : "Usar tema oscuro"
          }
          title={resolvedTheme === "dark" ? "Tema claro" : "Tema oscuro"}
          onClick={toggleTheme}
        >
          {resolvedTheme === "dark" ? (
            <Sun className="h-5 w-5" strokeWidth={1.5} />
          ) : (
            <Moon className="h-5 w-5" strokeWidth={1.5} />
          )}
        </button>
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
                <span className="absolute -right-0.5 -top-0.5 z-10 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--admin-accent)] px-1 text-[10px] font-bold leading-none text-white">
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

        <div
          className="ml-1 h-4 w-px bg-zinc-300/60 dark:bg-zinc-600/60 sm:h-5"
          aria-hidden
        />

        <DropdownMenu
          open={openMenu === "user"}
          onClose={closeAll}
          width="min-w-[12rem]"
          trigger={
            <button
              type="button"
              className="flex max-w-[12rem] cursor-pointer items-center gap-2 rounded-full py-1 pl-1 pr-2 text-left transition-colors hover:bg-black/5 dark:hover:bg-white/10 sm:max-w-[16rem]"
              aria-label="Perfil del usuario"
              title="Perfil"
              onClick={() => toggle("user")}
            >
              <EntityThumb
                src={user?.avatar}
                label={user ? userDisplayName(user) : "?"}
                size="sm"
                className="!h-9 !w-9 border-transparent"
              />
              <span className="hidden min-w-0 flex-col sm:flex">
                <span className="truncate text-xs font-medium leading-tight text-zinc-800 dark:text-zinc-100">
                  {user ? userDisplayName(user) : "—"}
                </span>
                <span className="truncate text-[11px] leading-tight text-zinc-500 dark:text-zinc-400">
                  {userRoleLabel(user?.role)}
                </span>
              </span>
            </button>
          }
        >
          <div className="dropdown-panel overflow-hidden py-2">
            <div className="flex items-center gap-3 border-b border-zinc-200/80 px-4 pb-3 dark:border-zinc-700/70">
              <EntityThumb
                src={user?.avatar}
                label={user ? userDisplayName(user) : "?"}
                size="md"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  {user ? userDisplayName(user) : "Cuenta"}
                </p>
                <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                  {userRoleLabel(user?.role)}
                </p>
              </div>
            </div>
            <Link
              href="/profile"
              onClick={closeAll}
              className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-sm text-zinc-600 transition-colors hover:bg-black/5 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-zinc-100"
            >
              <UserCircle className="h-4 w-4 shrink-0" strokeWidth={1.5} />
              Mi perfil
            </Link>
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
