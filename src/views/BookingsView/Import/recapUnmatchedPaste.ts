import type { BookingRecapUnmatched } from "@/services/bookings/bulkImportService";
import { BULK_BOOKING_PASTE_COLUMNS } from "@/lib/importFormatGuides";

function formatPasteDate(iso: string | null): string {
  if (!iso) return "";
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return iso;
  return `${match[3]}/${match[2]}/${match[1]}`;
}

function formatPasteTime(clock: string | null | undefined): string {
  return (clock || "").trim().slice(0, 5);
}

/** Mass-create paste from recap misses (Naviera…Assignment). */
export function recapUnmatchedToPaste(rows: BookingRecapUnmatched[]): string {
  const lines = [[...BULK_BOOKING_PASTE_COLUMNS].join("\t")];
  for (const row of rows) {
    lines.push(
      [
        row.line || row.group || "",
        row.ship,
        row.port,
        formatPasteDate(row.call_date),
        formatPasteTime(row.eta),
        formatPasteTime(row.etd),
        "",
      ].join("\t"),
    );
  }
  return lines.join("\n");
}
