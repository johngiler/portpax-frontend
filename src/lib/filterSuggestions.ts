import { fetchUsers } from "@/services/accounts/userService";
import { fetchLongTermAgreements } from "@/services/bookings/ltaService";
import { fetchPorts } from "@/services/catalogs/portService";
import { fetchPositions } from "@/services/catalogs/positionService";
import { fetchShippingLines } from "@/services/catalogs/shippingLineService";
import { globalSearch } from "@/services/searchService";

export type FilterSuggestion = {
  id: string;
  label: string;
  hint?: string;
  /** Text written into the search field when the user picks this row. */
  applyValue: string;
  group?: string;
};

const SUGGEST_LIMIT = 8;

function formatScaleDate(d: string | null): string {
  if (!d) return "";
  try {
    return new Date(d + "T12:00:00").toLocaleDateString("es", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return d;
  }
}

/** Bookings filter: vessels, ports, then booking codes from global search. */
export async function suggestBookings(query: string): Promise<FilterSuggestion[]> {
  const data = await globalSearch(query);
  const items: FilterSuggestion[] = [];

  for (const s of data.ships) {
    items.push({
      id: `ship-${s.id}`,
      label: s.name,
      hint: s.shipping_line_name ?? s.shipping_line_code,
      applyValue: s.name,
      group: "Barcos",
    });
  }
  for (const p of data.ports) {
    items.push({
      id: `port-${p.id}`,
      label: p.name,
      hint: p.code,
      applyValue: p.name,
      group: "Puertos",
    });
  }
  for (const sl of data.shipping_lines) {
    items.push({
      id: `line-${sl.id}`,
      label: sl.name,
      hint: sl.code,
      applyValue: sl.name,
      group: "Navieras",
    });
  }
  for (const sc of data.scales) {
    const dateHint = formatScaleDate(sc.date);
    items.push({
      id: `scale-${sc.id}`,
      label: sc.booking_code,
      hint: [sc.ship_name, sc.port_name, dateHint].filter(Boolean).join(" · "),
      applyValue: sc.booking_code,
      group: "Reservas",
    });
  }
  return items;
}

export async function suggestPorts(query: string): Promise<FilterSuggestion[]> {
  const data = await fetchPorts({ search: query, pageSize: SUGGEST_LIMIT });
  return data.results.map((p) => ({
    id: `port-${p.id}`,
    label: p.name,
    hint: [p.code, p.country].filter(Boolean).join(" · "),
    applyValue: p.name,
  }));
}

export async function suggestShippingLines(query: string): Promise<FilterSuggestion[]> {
  const data = await fetchShippingLines({ search: query, pageSize: SUGGEST_LIMIT });
  return data.results.map((line) => ({
    id: `line-${line.id}`,
    label: line.name,
    hint: line.code,
    applyValue: line.name,
  }));
}

export async function suggestUsers(query: string): Promise<FilterSuggestion[]> {
  const data = await fetchUsers({ search: query, pageSize: SUGGEST_LIMIT });
  return data.results.map((u) => {
    const fullName = [u.first_name, u.last_name].filter(Boolean).join(" ").trim();
    return {
      id: `user-${u.id}`,
      label: u.username,
      hint: [fullName, u.email].filter(Boolean).join(" · "),
      applyValue: u.username,
    };
  });
}

export async function suggestPositions(query: string): Promise<FilterSuggestion[]> {
  const data = await fetchPositions({ search: query, pageSize: SUGGEST_LIMIT });
  return data.results.map((pos) => ({
    id: `pos-${pos.id}`,
    label: pos.code,
    hint: [pos.port_name, pos.berth_code].filter(Boolean).join(" · "),
    applyValue: pos.code,
  }));
}

export async function suggestLtaAgreements(query: string): Promise<FilterSuggestion[]> {
  const data = await fetchLongTermAgreements({
    search: query,
    pageSize: SUGGEST_LIMIT,
  });
  return data.results.map((row) => ({
    id: `lta-${row.id}`,
    label: row.code,
    hint: [row.name, row.port_name, row.shipping_line_name]
      .filter(Boolean)
      .join(" · "),
    applyValue: row.code,
  }));
}
