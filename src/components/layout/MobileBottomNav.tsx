"use client";

import {
  BarChart3,
  CalendarDays,
  FileText,
  LayoutDashboard,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { canSeeNavItem, canWriteApp } from "@/lib/navAccess";
import type { UserRole } from "@/types/auth";

const CATALOG_ROLES: readonly UserRole[] = ["admin", "viewer"];

type NavSlot = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles?: readonly UserRole[];
};

const LEFT: NavSlot[] = [
  {
    href: "/",
    label: "Inicio",
    icon: LayoutDashboard,
    roles: CATALOG_ROLES,
  },
  { href: "/bookings", label: "Reservas", icon: CalendarDays },
];

const RIGHT: NavSlot[] = [
  { href: "/reports", label: "Reportes", icon: BarChart3 },
  {
    href: "/lta",
    label: "Acuerdos",
    icon: FileText,
    roles: CATALOG_ROLES,
  },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({
  item,
  active,
}: {
  item: NavSlot;
  active: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={[
        "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1 transition-colors",
        active
          ? "text-[var(--admin-accent)]"
          : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100",
      ].join(" ")}
      aria-current={active ? "page" : undefined}
    >
      <Icon
        className="h-5 w-5 shrink-0"
        strokeWidth={active ? 2.25 : 1.75}
        aria-hidden
      />
      <span className="max-w-full truncate text-[10px] font-medium leading-tight">
        {item.label}
      </span>
    </Link>
  );
}

/** Mobile-only bottom bar with raised + for new booking. */
export default function MobileBottomNav() {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const { user } = useAuth();
  const role = user?.role;
  // List only — hide + while already creating / editing a booking.
  const onBookingsList =
    pathname === "/bookings" || pathname === "/bookings/";
  const showCreateFab = canWriteApp(role) && onBookingsList;

  const left = LEFT.filter((item) => canSeeNavItem(role, item.roles));
  const right = RIGHT.filter((item) => canSeeNavItem(role, item.roles));

  return (
    <nav
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 md:hidden"
      aria-label="Navegación principal"
    >
      <div className="pointer-events-auto relative mx-auto border-t border-zinc-200/90 bg-white/95 pb-[max(0.25rem,env(safe-area-inset-bottom,0px))] shadow-[0_-8px_24px_rgba(15,44,92,0.08)] backdrop-blur-xl dark:border-zinc-700/80 dark:bg-zinc-900/95">
        <div className="relative flex h-12 items-stretch px-1 sm:h-14">
          <div className="flex min-w-0 flex-1 items-stretch">
            {left.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                active={isActive(pathname, item.href)}
              />
            ))}
          </div>

          {showCreateFab ? (
            <div className="w-16 shrink-0" aria-hidden />
          ) : null}

          <div className="flex min-w-0 flex-1 items-stretch">
            {right.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                active={isActive(pathname, item.href)}
              />
            ))}
          </div>

          {showCreateFab ? (
            <button
              type="button"
              onClick={() => router.push("/bookings/new")}
              className="absolute left-1/2 top-0 z-10 flex h-12 w-12 -translate-x-1/2 -translate-y-1/3 cursor-pointer items-center justify-center rounded-full bg-[var(--admin-accent)] text-white shadow-[0_8px_20px_rgba(52,120,181,0.45)] ring-4 ring-white transition hover:bg-[var(--admin-accent-hover)] active:scale-95 dark:ring-zinc-900 sm:h-14 sm:w-14"
              aria-label="Nueva reserva"
              title="Nueva reserva"
            >
              <Plus className="h-7 w-7" strokeWidth={2.25} aria-hidden />
            </button>
          ) : null}
        </div>
      </div>
    </nav>
  );
}
