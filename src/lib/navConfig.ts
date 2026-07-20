import {
  Anchor,
  BarChart3,
  CalendarDays,
  CalendarRange,
  LayoutDashboard,
  MapPin,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@/types/auth";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** If set, only these roles see the item. Omit = all frontend roles. */
  roles?: readonly UserRole[];
  /** Key in /api/nav-counts/ for the sidebar badge. */
  countKey?: "bookings" | "ports" | "shipping_lines" | "users";
};

export type NavSection = {
  id: string;
  label: string;
  items: NavItem[];
};

const ADMIN_ONLY: readonly UserRole[] = ["admin"];
const CATALOG_ROLES: readonly UserRole[] = ["admin", "viewer"];

/** Sidebar order — home path is always the first item visible for the role. */
export const NAV_SECTIONS: NavSection[] = [
  {
    id: "operation",
    label: "Operación",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard, roles: CATALOG_ROLES },
      { href: "/bookings", label: "Reservas", icon: CalendarDays, countKey: "bookings" },
      { href: "/calendar", label: "Calendario", icon: CalendarRange },
      { href: "/reports", label: "Reportes", icon: BarChart3 },
      { href: "/ports", label: "Puertos", icon: MapPin, roles: CATALOG_ROLES, countKey: "ports" },
      {
        href: "/shipping-lines",
        label: "Navieras",
        icon: Anchor,
        roles: CATALOG_ROLES,
        countKey: "shipping_lines",
      },
    ],
  },
  {
    id: "system",
    label: "Sistema",
    items: [
      {
        href: "/users",
        label: "Usuarios",
        icon: Users,
        roles: ADMIN_ONLY,
        countKey: "users",
      },
    ],
  },
];
