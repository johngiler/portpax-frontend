/**
 * Safe in-app return paths for detail → list/calendar navigation.
 * Rejects absolute URLs and paths outside known app views.
 */
export function sanitizeReturnTo(value: string | null | undefined): string | null {
  if (!value) return null;
  let path = value;
  try {
    path = decodeURIComponent(value);
  } catch {
    return null;
  }
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("://")) {
    return null;
  }
  if (path.startsWith("/bookings/detail") || path.startsWith("/bookings/new")) {
    return null;
  }
  if (path === "/bookings" || path.startsWith("/bookings?")) return path;
  if (path === "/calendar" || path.startsWith("/calendar?")) return path;
  if (path === "/reports" || path.startsWith("/reports?")) return path;
  if (path === "/" || path.startsWith("/?")) return path;
  return null;
}

export function returnToLabel(returnTo: string | null): string {
  if (!returnTo) return "Volver a reservas";
  if (returnTo.includes("tab=calendar") || returnTo.startsWith("/calendar")) {
    return "Volver al calendario";
  }
  if (returnTo.includes("tab=availability")) {
    return "Volver a disponibilidad";
  }
  if (returnTo.startsWith("/reports")) return "Volver a reportes";
  if (returnTo === "/" || returnTo.startsWith("/?")) return "Volver al dashboard";
  return "Volver a reservas";
}

/** Current path + query for use as returnTo. */
export function currentReturnTo(
  pathname: string,
  searchParams: { toString(): string },
): string {
  const q = searchParams.toString();
  return q ? `${pathname}?${q}` : pathname;
}
