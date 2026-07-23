/** Display helpers for booking LOA / times (list + calendar chips). */

export function formatTimeShort(value: string | null | undefined): string {
  if (!value) return "—";
  return value.slice(0, 5);
}

export function formatLoa(value: string | null | undefined): string {
  if (value == null || value === "") return "—";
  const n = Number(value);
  if (Number.isNaN(n)) return "—";
  return `${Math.round(n)} m`;
}
