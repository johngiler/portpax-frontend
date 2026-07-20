/** Compact count for UI badges: 999 → "999", 1500 → "1.5k", 3000 → "3k", 1_200_000 → "1.2M". */
export function formatCompactCount(value: number): string {
  const n = Math.abs(Math.round(value));
  const sign = value < 0 ? "-" : "";

  if (n < 1000) return `${sign}${n}`;

  if (n < 1_000_000) {
    const k = n / 1000;
    const text =
      k >= 100 || Number.isInteger(k) ? String(Math.round(k)) : k.toFixed(1).replace(/\.0$/, "");
    return `${sign}${text}k`;
  }

  const m = n / 1_000_000;
  const text =
    m >= 100 || Number.isInteger(m) ? String(Math.round(m)) : m.toFixed(1).replace(/\.0$/, "");
  return `${sign}${text}M`;
}
