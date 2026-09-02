/** Occupancy / fulfillment percentages for booking PAX fields. */

export function paxPercent(
  part: number | null | undefined,
  whole: number | null | undefined,
): number | null {
  if (part == null || whole == null || whole <= 0) return null;
  return Math.round((part / whole) * 100);
}

export function formatPaxWithPercent(
  value: number | null | undefined,
  percent: number | null | undefined,
): string {
  if (value == null) return "—";
  const base = value.toLocaleString("es-MX");
  if (percent == null) return base;
  return `${base} (${percent}%)`;
}

/** Cards / chips: real PAX when set, otherwise planned (average snapshot). */
export function displayCardPax(
  actualPax: number | null | undefined,
  plannedPax: number | null | undefined = null,
): number | null {
  if (actualPax != null) return actualPax;
  if (plannedPax != null) return plannedPax;
  return null;
}

export function formatCardPax(
  actualPax: number | null | undefined,
  plannedPax: number | null | undefined = null,
): string {
  const value = displayCardPax(actualPax, plannedPax);
  return value != null ? value.toLocaleString("es-MX") : "—";
}

export function cardPaxTitle(
  actualPax: number | null | undefined,
  plannedPax: number | null | undefined = null,
): string {
  if (actualPax != null) return "PAX real";
  if (plannedPax != null) return "PAX planificado";
  return "PAX";
}
