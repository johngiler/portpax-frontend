import {
  Anchor,
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
      { href: "/bookings", label: "Reservas", icon: CalendarDays },
      { href: "/calendar", label: "Calendario", icon: CalendarRange },
      { href: "/ports", label: "Puertos", icon: MapPin, roles: CATALOG_ROLES },
      { href: "/shipping-lines", label: "Navieras", icon: Anchor, roles: CATALOG_ROLES },
    ],
  },
  {
    id: "system",
    label: "Sistema",
    items: [
      { href: "/users", label: "Usuarios", icon: Users, roles: ADMIN_ONLY },
    ],
  },
];
