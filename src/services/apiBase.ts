/** API base URL: env in local/dev; fixed host on itm.portpax.com. */
function getApiBase(): string {
  if (typeof window !== "undefined" && window.location?.hostname === "itm.portpax.com") {
    return "https://api.portpax.com";
  }
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
}

export const API_BASE = getApiBase();
