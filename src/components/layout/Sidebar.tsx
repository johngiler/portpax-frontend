"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useMainLayoutOptional } from "@/contexts/MainLayoutContext";
import { useNavCounts } from "@/hooks/useNavCounts";
import { formatCompactCount } from "@/lib/formatCompactCount";
import { canSeeNavItem, roleHomePath } from "@/lib/navAccess";
import { NAV_SECTIONS, type NavItem } from "@/lib/navConfig";
import type { NavCounts } from "@/services/core/navCountsService";
import PortPaxLogo from "./PortPaxLogo";

const MOBILE_BREAKPOINT = 768;

function resolveNavCount(
  item: NavItem,
  counts: NavCounts | null,
): number | null {
  if (!item.countKey || !counts) return null;
  const value = counts[item.countKey];
  return typeof value === "number" ? value : null;
}

export default function Sidebar() {
  const pathname = usePathname() ?? "";
  const { user } = useAuth();
  const layout = useMainLayoutOptional();
  const isMobileFromContext = layout?.isMobile ?? false;
  const [isMobile, setIsMobile] = useState(false);
  const [userCollapsed, setUserCollapsed] = useState<boolean | null>(null);
  const homeHref = roleHomePath(user?.role);
  const navCounts = useNavCounts(Boolean(user));

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${MOBILE_BREAKPOINT}px)`);
    const sync = () => {
      const mobile = !mq.matches;
      setIsMobile(mobile);
      if (mobile) setUserCollapsed(null);
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const isMobileView = isMobile || isMobileFromContext;
  const sidebarMobileOpen = layout?.sidebarMobileOpen ?? false;
  const setSidebarMobileOpen = layout?.setSidebarMobileOpen ?? (() => {});

  const collapsedByUser = userCollapsed !== null ? userCollapsed : isMobileView;
  const collapsed = collapsedByUser;

  const closeMobileSidebar = () => setSidebarMobileOpen(false);

  const linkBase =
    "relative flex cursor-pointer items-center rounded-lg text-sm font-medium transition-colors duration-200";
  const linkExpanded = "gap-2.5 px-2.5 py-2.5";
  const linkCollapsed = "justify-center p-2.5";
  const linkActive =
    "bg-white/80 text-[var(--admin-accent)] shadow-[var(--admin-card-shadow)] dark:bg-zinc-900/70";
  const linkInactive =
    "text-zinc-600 hover:bg-white/70 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900/50 dark:hover:text-zinc-50";

  const asideClassName = `flex min-h-0 shrink-0 flex-col border-r border-[var(--admin-border)] bg-[var(--admin-sidebar)]/90 backdrop-blur-md transition-[width] duration-200 ease-out ${
    isMobileView ? "w-52" : collapsed ? "w-16" : "w-52"
  }`;

  function renderNavLink(item: NavItem) {
    const { href, label, icon: Icon } = item;
    const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
    const count = resolveNavCount(item, navCounts);
    const countLabel = count != null ? formatCompactCount(count) : null;
    const showLabel = !collapsed || isMobileView;
    const title =
      count != null ? `${label} (${count.toLocaleString("es")})` : label;

    return (
      <Link
        key={href}
        href={href}
        className={`${linkBase} ${collapsed && !isMobileView ? linkCollapsed : linkExpanded} ${isActive ? linkActive : linkInactive}`}
        title={title}
        onClick={isMobileView ? closeMobileSidebar : undefined}
      >
        {isActive && (
          <span
            className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-[var(--admin-accent)]"
            aria-hidden
          />
        )}
        <span className="relative shrink-0">
          <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
          {!showLabel && countLabel ? (
            <span className="absolute -right-2 -top-1.5 min-w-[1.1rem] rounded-full bg-zinc-200/90 px-1 text-center text-[9px] font-semibold tabular-nums leading-4 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200">
              {countLabel}
            </span>
          ) : null}
        </span>
        {showLabel && (
          <>
            <span className={`min-w-0 flex-1 truncate ${isActive ? "pl-0.5" : ""}`}>
              {label}
            </span>
            {countLabel ? (
              <span
                className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold tabular-nums ${
                  isActive
                    ? "bg-[var(--admin-accent)]/15 text-[var(--admin-accent)]"
                    : "bg-zinc-200/80 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                }`}
              >
                {countLabel}
              </span>
            ) : null}
          </>
        )}
      </Link>
    );
  }

  const sidebarInner = (
    <>
      <div
        className="pointer-events-none absolute bottom-0 left-0 z-0 h-36 w-36 overflow-visible"
        aria-hidden
      >
        <span className="sidebar-square sidebar-square-1" />
        <span className="sidebar-square sidebar-square-2" />
        <span className="sidebar-square sidebar-square-3" />
        <span className="sidebar-square sidebar-square-4" />
      </div>

      <nav className="relative z-10 min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-3">
        <div className="flex flex-col gap-5">
          {NAV_SECTIONS.map((section) => {
            const items = section.items.filter((item) =>
              canSeeNavItem(user?.role, item.roles),
            );
            if (items.length === 0) return null;
            return (
              <div key={section.id} className="flex flex-col gap-1.5">
                {(!collapsed || isMobileView) && (
                  <span className="mb-1 px-2.5 text-[11px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                    {section.label}
                  </span>
                )}
                {items.map(renderNavLink)}
              </div>
            );
          })}
        </div>
      </nav>
    </>
  );

  if (isMobileView) {
    return (
      <>
        {sidebarMobileOpen && (
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-pointer bg-black/40 transition-opacity duration-200 md:hidden"
            aria-label="Cerrar menú"
            onClick={closeMobileSidebar}
          />
        )}
        <aside
          className={`fixed left-0 top-0 z-50 flex h-full flex-col ${asideClassName} transition-transform duration-200 ease-out md:hidden ${
            sidebarMobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <header className="flex shrink-0 items-center border-b border-[var(--admin-border)] px-4 py-3">
            <Link
              href={homeHref}
              className="cursor-pointer"
              aria-label="Ir al inicio"
              onClick={closeMobileSidebar}
            >
              <PortPaxLogo showSlogan sloganClassName="hidden" />
            </Link>
          </header>
          {sidebarInner}
        </aside>
        <div className="hidden w-0 shrink-0 md:block" aria-hidden />
      </>
    );
  }

  return (
    <aside className={`relative min-h-0 shrink-0 ${asideClassName}`}>
      {sidebarInner}
      <button
        type="button"
        onClick={() => setUserCollapsed(collapsed ? false : true)}
        className="absolute right-0 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 translate-x-1/2 cursor-pointer items-center justify-center rounded-full border border-[var(--admin-border)] bg-[var(--admin-sidebar)] shadow-[var(--admin-card-shadow)] text-zinc-500 transition-colors duration-200 hover:bg-white hover:text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-100"
        aria-label={collapsed ? "Expandir menú" : "Recoger menú"}
        title={collapsed ? "Expandir menú" : "Recoger menú"}
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4" strokeWidth={2} />
        ) : (
          <ChevronLeft className="h-4 w-4" strokeWidth={2} />
        )}
      </button>
    </aside>
  );
}
