"use client";

import {
  Anchor,
  BarChart3,
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Cog,
  FileText,
  LayoutDashboard,
  MapPin,
  Minus,
  Plus,
  Settings,
  Ship,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useMainLayoutOptional } from "@/contexts/MainLayoutContext";
import PortPaxLogo from "./PortPaxLogo";

const MOBILE_BREAKPOINT = 768;

const navDocking = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/ships", label: "Barcos", icon: Ship },
  { href: "/ports", label: "Puertos", icon: MapPin },
  { href: "/berths", label: "Muelles", icon: Anchor },
  { href: "/shipping-lines", label: "Navieras", icon: Building2 },
  { href: "/scales", label: "Escalas", icon: CalendarDays },
  { href: "/rates", label: "Tarifas", icon: CircleDollarSign },
];

const navComingSoon = [
  { href: "/operations", label: "Operaciones", icon: Cog },
  { href: "/passengers", label: "Pasajeros (PAX)", icon: Users },
  { href: "/billing", label: "Facturación", icon: FileText },
  { href: "/reports", label: "Reportes", icon: BarChart3 },
];

export default function Sidebar() {
  const pathname = usePathname() ?? "";
  const layout = useMainLayoutOptional();
  const isMobileFromContext = layout?.isMobile ?? false;
  const [isMobile, setIsMobile] = useState(false);
  const [userCollapsed, setUserCollapsed] = useState<boolean | null>(null);
  const [sectionDockingOpen, setSectionDockingOpen] = useState(true);
  const [sectionComingSoonOpen, setSectionComingSoonOpen] = useState(true);

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

  const setCollapsed = (value: boolean | ((prev: boolean) => boolean)) => {
    const next = typeof value === "function" ? value(collapsed) : value;
    setUserCollapsed(next);
  };

  const isConfigActive =
    pathname === "/configuration" || pathname.startsWith("/configuration");

  const linkBase =
    "relative flex cursor-pointer items-center rounded-lg text-sm font-medium transition-colors duration-200";
  const linkExpanded = "gap-3 px-3 py-3";
  const linkCollapsed = "justify-center p-3";
  const linkActive =
    "bg-white/80 text-[var(--admin-accent)] shadow-[var(--admin-card-shadow)] dark:bg-zinc-900/70";
  const linkInactive =
    "text-zinc-600 hover:bg-white/70 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900/50 dark:hover:text-zinc-50";
  const linkInactiveSoon =
    "text-zinc-500 hover:bg-white/70 hover:text-zinc-700 dark:text-zinc-500 dark:hover:bg-zinc-900/50 dark:hover:text-zinc-300";

  const closeMobileSidebar = () => setSidebarMobileOpen(false);

  const asideClassName = `flex min-h-0 shrink-0 flex-col border-r border-[var(--admin-border)] bg-[var(--admin-sidebar)]/90 backdrop-blur-md transition-[width] duration-200 ease-out ${
    isMobileView ? "w-64" : collapsed ? "w-16" : "w-64"
  }`;

  const sidebarInner = (
    <>
      {/* Fondo decorativo: cuadros superpuestos en bottom-left (colores waves, escalonado) */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 z-0 h-36 w-36 overflow-visible"
        aria-hidden
      >
        <span className="sidebar-square sidebar-square-1" />
        <span className="sidebar-square sidebar-square-2" />
        <span className="sidebar-square sidebar-square-3" />
        <span className="sidebar-square sidebar-square-4" />
      </div>

      <nav className="relative z-10 min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-4">
        {(collapsed && !isMobileView) ? (
          <>
            <div className="flex flex-col gap-1.5 mb-6">
              {navDocking.map(({ href, label, icon: Icon }) => {
                const isActive =
                  pathname === href ||
                  (href !== "/" && pathname.startsWith(href));
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`${linkBase} ${linkCollapsed} ${isActive ? linkActive : linkInactive}`}
                    title={label}
                    onClick={isMobileView ? closeMobileSidebar : undefined}
                  >
                    {isActive && (
                      <span
                        className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-[var(--admin-accent)]"
                        aria-hidden
                      />
                    )}
                    <Icon
                      className="h-[18px] w-[18px] shrink-0"
                      strokeWidth={2}
                    />
                  </Link>
                );
              })}
            </div>
            <div className="flex flex-col gap-1.5">
              {navComingSoon.map(({ href, label, icon: Icon }) => {
                const isActive =
                  pathname === href ||
                  (href !== "/" && pathname.startsWith(href));
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`${linkBase} ${linkCollapsed} ${isActive ? linkActive : linkInactiveSoon}`}
                    title={label}
                    onClick={isMobileView ? closeMobileSidebar : undefined}
                  >
                    {isActive && (
                      <span
                        className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-[var(--admin-accent)]"
                        aria-hidden
                      />
                    )}
                    <Icon
                      className="h-[18px] w-[18px] shrink-0"
                      strokeWidth={2}
                    />
                  </Link>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <div className="mb-2 flex items-center justify-between gap-2 px-3">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                Docking / Muellaje
              </span>
              <button
                type="button"
                onClick={() => setSectionDockingOpen((o) => !o)}
                className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded text-zinc-500 transition-colors hover:bg-white/10 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                aria-label={
                  sectionDockingOpen ? "Colapsar sección" : "Expandir sección"
                }
                title={sectionDockingOpen ? "Colapsar" : "Expandir"}
              >
                {sectionDockingOpen ? (
                  <Minus className="h-3.5 w-3.5" strokeWidth={2.5} />
                ) : (
                  <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                )}
              </button>
            </div>
            <div
              className={`grid transition-[grid-template-rows] duration-200 ease-out ${sectionDockingOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
            >
              <div className="min-h-0 overflow-hidden">
                <div
                  className={`flex flex-col gap-1.5 mb-6 transition-opacity duration-200 ${sectionDockingOpen ? "opacity-100" : "opacity-0"}`}
                >
                  {navDocking.map(({ href, label, icon: Icon }) => {
                    const isActive =
                      pathname === href ||
                      (href !== "/" && pathname.startsWith(href));
                    return (
                      <Link
                        key={href}
                        href={href}
                        className={`${linkBase} ${linkExpanded} ${isActive ? linkActive : linkInactive}`}
                        title={label}
                        onClick={isMobileView ? closeMobileSidebar : undefined}
                      >
                        {isActive && (
                          <span
                            className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-[var(--admin-accent)]"
                            aria-hidden
                          />
                        )}
                        <Icon
                          className="h-[18px] w-[18px] shrink-0"
                          strokeWidth={2}
                        />
                        <span className={isActive ? "pl-0.5" : ""}>
                          {label}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="mb-2 mt-6 flex items-center justify-between gap-2 px-3">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                Próximas fases
              </span>
              <button
                type="button"
                onClick={() => setSectionComingSoonOpen((o) => !o)}
                className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded text-zinc-500 transition-colors hover:bg-white/10 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                aria-label={
                  sectionComingSoonOpen
                    ? "Colapsar sección"
                    : "Expandir sección"
                }
                title={sectionComingSoonOpen ? "Colapsar" : "Expandir"}
              >
                {sectionComingSoonOpen ? (
                  <Minus className="h-3.5 w-3.5" strokeWidth={2.5} />
                ) : (
                  <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                )}
              </button>
            </div>
            <div
              className={`grid transition-[grid-template-rows] duration-200 ease-out ${sectionComingSoonOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
            >
              <div className="min-h-0 overflow-hidden">
                <div
                  className={`flex flex-col gap-1.5 transition-opacity duration-200 ${sectionComingSoonOpen ? "opacity-100" : "opacity-0"}`}
                >
                  {navComingSoon.map(({ href, label, icon: Icon }) => {
                    const isActive =
                      pathname === href ||
                      (href !== "/" && pathname.startsWith(href));
                    return (
                      <Link
                        key={href}
                        href={href}
                        className={`${linkBase} ${linkExpanded} ${isActive ? linkActive : linkInactiveSoon}`}
                        title={label}
                        onClick={isMobileView ? closeMobileSidebar : undefined}
                      >
                        {isActive && (
                          <span
                            className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-[var(--admin-accent)]"
                            aria-hidden
                          />
                        )}
                        <Icon
                          className="h-[18px] w-[18px] shrink-0"
                          strokeWidth={2}
                        />
                        <span className={isActive ? "pl-0.5" : ""}>
                          {label}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}
      </nav>

      {/* Bloque Configuración fijo al pie del sidebar (fondo transparente para que se vean los cuadros) */}
      <div className="relative z-10 shrink-0 border-t border-[var(--admin-border)] p-4">
        <Link
          href="/configuration"
          onClick={isMobileView ? closeMobileSidebar : undefined}
          className={`relative flex cursor-pointer items-center rounded-lg py-2.5 text-sm font-medium transition-all duration-200 ${
            collapsed && !isMobileView ? "justify-center px-0" : "gap-3 px-3"
          } ${
            isConfigActive
              ? "bg-[var(--admin-accent)]/15 text-[var(--admin-accent)] shadow-sm dark:bg-[var(--admin-accent)]/20"
              : "text-zinc-600 hover:bg-white/60 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-zinc-50"
          }`}
          title={collapsed ? "Configuración" : undefined}
        >
          {isConfigActive && (
            <span
              className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-[var(--admin-accent)]"
              aria-hidden
            />
          )}
          <Settings className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
          {(!collapsed || isMobileView) && (
            <span className={isConfigActive ? "pl-0.5" : ""}>
              Configuración
            </span>
          )}
        </Link>
      </div>
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
        {/* En móvil el sidebar real es overlay; ocupamos 0 en el layout para que el contenido use todo el ancho */}
        <div className="hidden w-0 shrink-0 md:block" aria-hidden />
      </>
    );
  }

  return (
    <aside
      className={`relative min-h-0 shrink-0 ${asideClassName}`}
    >
      {sidebarInner}
      {/* Flecha recoger/expandir: centrada en el borde entre sidebar y contenido */}
      <button
        type="button"
        onClick={() => {
          setUserCollapsed(collapsed ? false : true);
        }}
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
