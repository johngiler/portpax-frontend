/**
 * URL base del API. En producción (itm.portpax.com) usa api.portpax.com;
 * en local usa NEXT_PUBLIC_API_URL o localhost:8000.
 * Así no dependemos de que el build inyecte bien la variable.
 */
function getApiBase(): string {
  if (typeof window !== "undefined" && window.location?.hostname === "itm.portpax.com") {
    return "https://api.portpax.com";
  }
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
}

export const API_BASE = getApiBase();
