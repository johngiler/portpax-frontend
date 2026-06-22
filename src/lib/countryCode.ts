/** Map catalog country names to ISO 3166-1 alpha-2 for flag icons. */
const COUNTRY_ISO2: Record<string, string> = {
  mexico: "MX",
  méxico: "MX",
  "dominican republic": "DO",
  "república dominicana": "DO",
  honduras: "HN",
  spain: "ES",
  españa: "ES",
};

export function countryToIso2(country: string): string | null {
  const key = country.trim().toLowerCase();
  return COUNTRY_ISO2[key] ?? null;
}

/** Regional indicator symbols from ISO 3166-1 alpha-2 (e.g. HN → 🇭🇳). */
export function iso2ToFlagEmoji(iso2: string): string {
  const code = iso2.trim().toUpperCase();
  if (code.length !== 2 || !/^[A-Z]{2}$/.test(code)) return "";
  return String.fromCodePoint(
    ...[...code].map((char) => 0x1f1e6 - 65 + char.charCodeAt(0)),
  );
}
