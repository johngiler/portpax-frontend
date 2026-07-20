import type { UserRole } from "@/types/auth";
import { NAV_SECTIONS } from "@/lib/navConfig";

/** Booking-flow roles: calendar + bookings only (no dashboard / catalogs / users). */
export const OPERATOR_ROLES: readonly UserRole[] = [
  "booking_operator",
  "port_operator",
];

/** Roles that may browse dashboard + catalogs (read or write). */
export const CATALOG_BROWSER_ROLES: readonly UserRole[] = ["admin", "viewer"];

export function isAdminRole(role: UserRole | null | undefined): boolean {
  return role === "admin";
}

export function isViewerRole(role: UserRole | null | undefined): boolean {
  return role === "viewer";
}

export function isOperatorRole(role: UserRole | null | undefined): boolean {
  return role != null && (OPERATOR_ROLES as readonly string[]).includes(role);
}

/** True when the user may create / edit / delete app data (not viewer). Profile is always editable separately. */
export function canWriteApp(role: UserRole | null | undefined): boolean {
  return role != null && role !== "viewer";
}

export function canBrowseCatalogs(role: UserRole | null | undefined): boolean {
  return role != null && (CATALOG_BROWSER_ROLES as readonly string[]).includes(role);
}

export function canSeeNavItem(
  role: UserRole | null | undefined,
  allowedRoles?: readonly UserRole[],
): boolean {
  if (!allowedRoles || allowedRoles.length === 0) {
    return true;
  }
  if (!role) return false;
  return allowedRoles.includes(role);
}

/** Landing path: first sidebar item visible for the role. */
export function roleHomePath(role: UserRole | null | undefined): string {
  for (const section of NAV_SECTIONS) {
    for (const item of section.items) {
      if (canSeeNavItem(role, item.roles)) {
        return item.href;
      }
    }
  }
  return "/bookings";
}

/**
 * Frontend route access by MVP role.
 * - admin: full app
 * - viewer: full app except user management (/users); writes blocked in UI
 * - booking_operator / port_operator: calendar, bookings, profile only
 */
export function canAccessPath(
  role: UserRole | null | undefined,
  pathname: string,
): boolean {
  const path = pathname || "/";

  if (path === "/profile" || path.startsWith("/profile/")) {
    return true;
  }

  if (isAdminRole(role)) {
    return true;
  }

  if (isViewerRole(role)) {
    if (path === "/users" || path.startsWith("/users/")) {
      return false;
    }
    if (path === "/bookings/new" || path.startsWith("/bookings/new/")) {
      return false;
    }
    return true;
  }

  if (path === "/calendar" || path.startsWith("/calendar/")) {
    return true;
  }
  if (path === "/bookings" || path.startsWith("/bookings/")) {
    return true;
  }
  if (path === "/reports" || path.startsWith("/reports/")) {
    return true;
  }

  return false;
}
