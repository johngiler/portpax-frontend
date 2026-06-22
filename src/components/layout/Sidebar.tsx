"use client";

import { Anchor, CalendarDays, ChevronLeft, ChevronRight, LayoutDashboard, MapPin } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useMainLayoutOptional } from "@/contexts/MainLayoutContext";
import PortPaxLogo from "./PortPaxLogo";

const MOBILE_BREAKPOINT = 768;

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/bookings", label: "Reservas", icon: CalendarDays },
  { href: "/ports", label: "Puertos", icon: MapPin },
  { href: "/shipping-lines", label: "Navieras", icon: Anchor },
] as const;

export default function Sidebar() {
  const pathname = usePathname() ?? "";
  const layout = useMainLayoutOptional();
  const isMobileFromContext = layout?.isMobile ?? false;
  const [isMobile, setIsMobile] = useState(false);
  const [userCollapsed, setUserCollapsed] = useState<boolean | null>(null);

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
        <div className={`flex flex-col gap-1.5 ${collapsed && !isMobileView ? "" : "mb-2"}`}>
          {(!collapsed || isMobileView) && (
            <span className="mb-2 px-2.5 text-[11px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              PortPax
            </span>
          )}
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive =
              pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`${linkBase} ${collapsed && !isMobileView ? linkCollapsed : linkExpanded} ${isActive ? linkActive : linkInactive}`}
                title={label}
                onClick={isMobileView ? closeMobileSidebar : undefined}
              >
                {isActive && (
                  <span
                    className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-[var(--admin-accent)]"
                    aria-hidden
                  />
                )}
                <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
                {(!collapsed || isMobileView) && (
                  <span className={isActive ? "pl-0.5" : ""}>{label}</span>
                )}
              </Link>
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
              href="/"
              className="cursor-pointer"
              aria-label="Ir al Dashboard"
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
