import type { BookingRecapUnmatched } from "@/services/bookings/bulkImportService";

function clockDate(iso: string | null, clock: string | null | undefined): string {
  if (!iso) return (clock || "").trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  const label = match ? `${match[3]}/${match[2]}/${match[1]}` : iso;
  const time = (clock || "").trim();
  return time ? `${label} ${time}` : label;
}

/** Mass-create paste (Ship / Port / Arrival / Departure / Posición) from recap misses. */
export function recapUnmatchedToPaste(rows: BookingRecapUnmatched[]): string {
  const lines = ["Ship\tPort\tArrival\tDeparture\tPosición"];
  for (const row of rows) {
    lines.push(
      [
        row.ship,
        row.port,
        clockDate(row.call_date, row.eta),
        clockDate(row.call_date, row.etd),
        "",
      ].join("\t"),
    );
  }
  return lines.join("\n");
}
