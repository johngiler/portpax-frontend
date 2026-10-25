const BLOCKED_PATHS = ["/login", "/bookings/detail"];

const ALLOWED_PREFIXES = [
  "/bookings",
  "/calendar",
  "/reports",
  "/ports",
  "/shipping-lines",
  "/users",
  "/lta",
  "/profile",
  "/vessels",
  "/positions",
];

function pathOnly(path: string): string {
  return path.split("?")[0] || "/";
}

function isBlockedPath(pathname: string): boolean {
  return BLOCKED_PATHS.some(
    (blocked) => pathname === blocked || pathname.startsWith(`${blocked}/`),
  );
}

function isAllowedPath(pathname: string): boolean {
  if (pathname === "/") return true;
  return ALLOWED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

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
  const pathname = pathOnly(path);
  if (isBlockedPath(pathname)) return null;
  if (isAllowedPath(pathname)) return path;
  return null;
}

export function returnToLabel(returnTo: string | null): string {
  if (!returnTo) return "Volver a reservas";
  if (returnTo.startsWith("/bookings/new")) return "Volver al asistente";
  if (returnTo.includes("tab=calendar") || returnTo.startsWith("/calendar")) {
    return "Volver al calendario";
  }
  if (returnTo.includes("tab=availability")) {
    return "Volver a disponibilidad";
  }
  if (returnTo.includes("tab=proximity")) return "Volver a proximidad";
  if (returnTo.startsWith("/lta")) return "Volver a acuerdos";
  if (returnTo.startsWith("/ports")) return "Volver a puertos";
  if (returnTo.startsWith("/shipping-lines")) return "Volver a navieras";
  if (returnTo.startsWith("/users")) return "Volver a usuarios";
  if (returnTo.startsWith("/profile")) return "Volver al perfil";
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
