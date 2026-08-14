import { formatIsoDateLabel } from "@/lib/bookingDates";
import type { BulkImportPreviewRow } from "@/services/bookings/bulkImportService";

const BATCH_MARK = "En esta carga:";

function hhmm(value: string | null | undefined): string | null {
  const raw = (value ?? "").trim();
  if (!raw) return null;
  const m = raw.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

/** Same-day windows overlap; missing times count as occupying the whole day. */
function timesOverlap(
  etaA: string | null | undefined,
  etdA: string | null | undefined,
  etaB: string | null | undefined,
  etdB: string | null | undefined,
): boolean {
  const startA = hhmm(etaA) ?? "00:00";
  const endA = hhmm(etdA) ?? "23:59";
  const startB = hhmm(etaB) ?? "00:00";
  const endB = hhmm(etdB) ?? "23:59";
  return startA < endB && endA > startB;
}

function rowLabel(row: BulkImportPreviewRow): string {
  const ship = row.vessel_name || row.ship || "barco";
  return `fila ${row.row_number} (${ship})`;
}

function dateLabel(iso: string | null | undefined): string {
  if (!iso) return "";
  return formatIsoDateLabel(iso, "short") || iso;
}

function sameCallDate(a: BulkImportPreviewRow, b: BulkImportPreviewRow): boolean {
  return Boolean(a.call_date) && a.call_date === b.call_date;
}

function samePort(a: BulkImportPreviewRow, b: BulkImportPreviewRow): boolean {
  if (a.port_id && b.port_id) return a.port_id === b.port_id;
  const na = (a.port_name || a.port_raw || "").trim().toLowerCase();
  const nb = (b.port_name || b.port_raw || "").trim().toLowerCase();
  return Boolean(na && na === nb);
}

function samePosition(a: BulkImportPreviewRow, b: BulkImportPreviewRow): boolean {
  if (a.position_id && b.position_id) return a.position_id === b.position_id;
  const ca = (a.position_code || "").trim().toUpperCase();
  const cb = (b.position_code || "").trim().toUpperCase();
  return Boolean(ca && ca === cb);
}

function clashWarnings(
  a: BulkImportPreviewRow,
  b: BulkImportPreviewRow,
): string[] {
  const out: string[] = [];
  if (!sameCallDate(a, b)) return out;

  const sharedPort = samePort(a, b);
  const sharedPosition = samePosition(a, b);
  // Same position id is enough (ids are unique). Same code needs a shared port,
  // unless neither row has a port yet (paste still in progress).
  const positionClash =
    sharedPosition &&
    (Boolean(a.position_id && b.position_id) ||
      sharedPort ||
      (!a.port_id && !b.port_id));

  if (a.vessel_id && a.vessel_id === b.vessel_id && (sharedPort || (!a.port_id && !b.port_id))) {
    out.push(
      `${BATCH_MARK} ${rowLabel(b)} es el mismo barco, puerto y fecha.`,
    );
  }

  if (positionClash && timesOverlap(a.eta, a.etd, b.eta, b.etd)) {
    const pos = a.position_code || "esta posición";
    const eta = hhmm(b.eta) ?? "—";
    const etd = hhmm(b.etd) ?? "—";
    out.push(
      `${BATCH_MARK} ${rowLabel(b)} usa ${pos} el ${dateLabel(a.call_date)} (${eta}–${etd}).`,
    );
  }
  return out;
}

/** Overlay peer-row occupancy/identity clashes onto preview warnings. */
export function withDraftBatchConflictWarnings(
  rows: BulkImportPreviewRow[],
): BulkImportPreviewRow[] {
  const extra = new Map<string, string[]>();
  for (let i = 0; i < rows.length; i += 1) {
    for (let j = i + 1; j < rows.length; j += 1) {
      const a = rows[i];
      const b = rows[j];
      for (const msg of clashWarnings(a, b)) {
        const list = extra.get(a.id) ?? [];
        list.push(msg);
        extra.set(a.id, list);
      }
      for (const msg of clashWarnings(b, a)) {
        const list = extra.get(b.id) ?? [];
        list.push(msg);
        extra.set(b.id, list);
      }
    }
  }
  return rows.map((row) => {
    const added = extra.get(row.id);
    const kept = (row.warnings ?? []).filter((w) => !w.startsWith(BATCH_MARK));
    if (!added?.length) {
      return { ...row, warnings: kept };
    }
    return { ...row, warnings: [...kept, ...added] };
  });
}
