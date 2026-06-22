const FLAG_CDN_BASE = "https://cdn.jsdelivr.net/gh/lipis/flag-icons/flags/4x3/";

/** SVG flag URL (same CDN as react-country-flag). */
export function buildFlagIconUrl(iso2: string): string {
  return `${FLAG_CDN_BASE}${iso2.trim().toLowerCase()}.svg`;
}
