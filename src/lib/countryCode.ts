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
