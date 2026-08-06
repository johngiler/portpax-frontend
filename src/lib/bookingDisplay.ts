/** Display helpers for booking LOA / times (list + calendar chips). */

/**
 * Normalize any ETA/ETD string to 24-hour HH:mm.
 * Accepts HH:MM[:SS] and common 12-hour forms (8:00 a.m., 5:00pm).
 */
export function normalizeTimeToHhMm(
  value: string | null | undefined,
): string | null {
  if (value == null) return null;
  const raw = String(value).trim();
  if (!raw) return null;

  const twentyFour = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2}(?:\.\d+)?)?$/);
  if (twentyFour) {
    const h = Number(twentyFour[1]);
    const m = Number(twentyFour[2]);
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    }
  }

  const twelve = raw.match(
    /^(\d{1,2}):(\d{2})\s*(a\.?\s*m\.?|p\.?\s*m\.?|am|pm)$/i,
  );
  if (twelve) {
    let h = Number(twelve[1]);
    const m = Number(twelve[2]);
    const meridiem = twelve[3].replace(/[\s.]/g, "").toLowerCase();
    const isPm = meridiem.startsWith("p");
    if (isPm && h < 12) h += 12;
    if (!isPm && h === 12) h = 0;
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    }
  }

  return null;
}

/** Visible ETA/ETD label — always 24h (13:00, 14:00…). */
export function formatTimeShort(value: string | null | undefined): string {
  return normalizeTimeToHhMm(value) ?? "—";
}

/** Controlled input value for ETA/ETD fields (empty or HH:mm). */
export function toTimeInputValue(value: string | null | undefined): string {
  return normalizeTimeToHhMm(value) ?? "";
}

/**
 * Persist from a time text field. Empty → null; HH:mm → HH:mm:00 for API.
 */
export function fromTimeInputValue(value: string): string | null {
  const normalized = normalizeTimeToHhMm(value);
  if (!normalized) return null;
  return `${normalized}:00`;
}

export function formatLoa(value: string | null | undefined): string {
  if (value == null || value === "") return "—";
  const n = Number(value);
  if (Number.isNaN(n)) return "—";
  return `${Math.round(n)} m`;
}
