/** API base URL: env in local/dev; fixed host on itm.portpax.com. */
function getApiBase(): string {
  if (typeof window !== "undefined" && window.location?.hostname === "itm.portpax.com") {
    return "https://api.portpax.com";
  }
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
}

export const API_BASE = getApiBase();

function toWsScheme(url: string): string {
  return url.replace(/^http:\/\//, "ws://").replace(/^https:\/\//, "wss://");
}

/**
 * WebSocket base URL.
 *
 * LOCAL: REST on :8000 (runserver), Daphne on :8001 — set NEXT_PUBLIC_WS_URL
 * or we default ws://localhost:8001 when API is localhost:8000.
 *
 * DEV/PROD: same host as API; nginx routes /ws/ to Daphne.
 */
export function getWsBase(): string {
  if (typeof window !== "undefined" && window.location?.hostname === "itm.portpax.com") {
    return "wss://api.portpax.com";
  }

  const fromEnv = process.env.NEXT_PUBLIC_WS_URL?.trim();
  if (fromEnv) {
    return toWsScheme(fromEnv.replace(/\/$/, ""));
  }

  const api = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(
    /\/$/,
    "",
  );

  if (/^https?:\/\/(localhost|127\.0\.0\.1):8000$/i.test(api)) {
    return "ws://localhost:8001";
  }

  return toWsScheme(api);
}

export function wsNotificationsUrl(token: string): string {
  const base = getWsBase();
  const path = base.endsWith("/")
    ? `${base}ws/notifications/`
    : `${base}/ws/notifications/`;
  return `${path}?token=${encodeURIComponent(token)}`;
}

