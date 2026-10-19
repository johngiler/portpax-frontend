"use client";

import {
  Filter,
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
import { HEADER_MOBILE_FILTERS_ID } from "@/components/layout/filterSidebarIds";
import NotificationDropdown from "./NotificationDropdown";
import OnlineUsersDropdown from "./OnlineUsersDropdown";
import PortPaxLogo from "./PortPaxLogo";

const iconBtnClass =
  "relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-black/5 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-zinc-100";

export default function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [openMenu, setOpenMenu] = useState<
    "online" | "notifications" | "user" | null
  >(null);
  const [searchExpanded, setSearchExpanded] = useState(false);

  const { resolvedTheme, toggleTheme } = useTheme();
  const {
    isMobile,
    sidebarMobileOpen,
    setSidebarMobileOpen,
    filterOpen,
    setFilterOpen,
    filterContent,
  } = useMainLayout();
  const hasFilterSidebar = filterContent != null;
  const homeHref = roleHomePath(user?.role);
  const closeAll = () => setOpenMenu(null);
  const toggle = (key: "online" | "notifications" | "user") =>
    setOpenMenu((prev) => (prev === key ? null : key));

  const handleLogout = () => {
    closeAll();
    logout();
    router.push("/login");
  };

  const toggleMobileNav = () => {
    if (!sidebarMobileOpen) setFilterOpen(false);
    setSidebarMobileOpen(!sidebarMobileOpen);
  };

  const toggleMobileFilters = () => {
    if (!filterOpen) setSidebarMobileOpen(false);
    setFilterOpen(!filterOpen);
  };

  return (
    <header
      className="relative z-30 flex h-14 shrink-0 items-center justify-between gap-2 overflow-visible px-3 shadow-[var(--admin-card-shadow)] sm:h-16 sm:px-6"
      style={{ background: "var(--admin-gradient-header)" }}
    >
      <div
        className="pointer-events-none absolute right-0 bottom-0 z-0 w-24 overflow-hidden sm:w-28"
        style={{ top: "calc(-1 * env(safe-area-inset-top, 0px))" }}
        aria-hidden
      >
        <span className="header-square header-square-1" />
        <span className="header-square header-square-2" />
        <span className="header-square header-square-3" />
        <span className="header-square header-square-4" />
      </div>
      <div className="relative flex min-w-0 shrink items-center gap-1.5 sm:gap-3">
        {isMobile && (
          <button
            type="button"
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-black/5 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-zinc-100 md:hidden"
            aria-label={sidebarMobileOpen ? "Cerrar menú" : "Abrir menú"}
            title={sidebarMobileOpen ? "Cerrar menú" : "Abrir menú"}
            onClick={toggleMobileNav}
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
      <div
        className={[
          "relative z-10 flex items-center gap-0.5 sm:gap-2",
          searchExpanded ? "min-w-0 flex-1 justify-end" : "shrink-0",
        ].join(" ")}
      >
        <GlobalSearch
          fillAvailableOnMobile
          onExpandedChange={(next) => {
            setSearchExpanded(next);
            if (next) closeAll();
          }}
        />
        <div
          className={[
            "flex items-center gap-0.5 sm:gap-2",
            searchExpanded ? "hidden md:flex" : "contents md:flex",
          ].join(" ")}
        >
        <button
          type="button"
          className={`${iconBtnClass} hidden md:flex`}
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
        <div className="hidden md:contents">
          <OnlineUsersDropdown
            open={openMenu === "online"}
            onToggle={() => toggle("online")}
            onClose={closeAll}
          />
        </div>
        <NotificationDropdown
          open={openMenu === "notifications"}
          onToggle={() => toggle("notifications")}
          onClose={closeAll}
        />

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
        {isMobile && hasFilterSidebar ? (
          <button
            type="button"
            id={HEADER_MOBILE_FILTERS_ID}
            className={`${iconBtnClass} md:hidden ${
              filterOpen
                ? "bg-[var(--admin-accent)]/10 text-[var(--admin-accent)]"
                : ""
            }`}
            aria-label={filterOpen ? "Cerrar filtros" : "Abrir filtros"}
            title={filterOpen ? "Cerrar filtros" : "Filtros"}
            onClick={toggleMobileFilters}
          >
            <Filter className="h-5 w-5" strokeWidth={1.5} />
          </button>
        ) : null}
        </div>
      </div>
    </header>
  );
}
