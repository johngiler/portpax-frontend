/** Format audit `changes` JSON for ops + audit history feeds. */

import { formatLtaWeekdays } from "@/types/lta";
import { formatTimeShort } from "@/lib/bookingDisplay";
import { BOOKING_STATUS_LABELS, type BookingStatus } from "@/types/booking";

const PORT_STATUS_LABELS: Record<string, string> = {
  operational: "Operativo",
  in_development: "En desarrollo",
  planned_extension: "Ampliación proyectada",
};

const FIELD_LABELS: Record<string, string> = {
  username: "Usuario",
  email: "Correo",
  first_name: "Nombre",
  last_name: "Apellido",
  is_active: "Estado",
  role: "Rol",
  port_ids: "Puertos",
  password: "Contraseña",
  status: "Estado",
  position_id: "Posición",
  eta: "ETA",
  etd: "ETD",
  eta_real: "ETA real",
  etd_real: "ETD real",
  planned_pax: "PAX planificado",
  actual_pax: "PAX real",
  actual_crew: "Tripulación",
  long_term_agreement: "Acuerdo LTA",
  override_reason: "Motivo override",
  acknowledge_combined_red: "Ack. eslora combinada",
  has_conflict: "En conflicto",
  conflict_severity: "Severidad de conflicto",
  conflicts: "Conflictos",
  resolved_conflicts: "Conflictos resueltos",
  conflicts_from: "Conflictos anteriores",
  conflicts_to: "Conflictos actuales",
  booking_code: "Código de reserva",
  call_date: "Fecha de escala",
  vessel_id: "Barco",
  long_term_agreement_id: "Acuerdo LTA",
  code: "Código",
  name: "Nombre",
  port_id: "Puerto",
  port_code: "Puerto",
  shipping_line_id: "Naviera",
  shipping_line_code: "Naviera",
  all_vessels: "Todos los barcos",
  vessel_ids: "Barcos",
  position_ids: "Posiciones",
  weekdays: "Días",
  min_packs: "Packs mín.",
  advance_months_min: "Anticipación mín.",
  advance_months_max: "Anticipación máx.",
  interval_days: "Cadencia (días)",
  cadence_anchor: "Fecha ancla cadencia",
  valid_from: "Vigencia desde",
  valid_until: "Vigencia hasta",
  notes: "Notas",
  has_contract: "Contrato",
  linked: "Vinculadas",
  skipped: "Omitidas",
  commercial_name: "Nombre comercial",
  country: "País",
  region: "Región",
  latitude: "Latitud",
  longitude: "Longitud",
  min_berth_draft_m: "Calado mín.",
  anchorage_slot_count: "Fondos",
  fender_count: "Defensas",
  has_logo: "Logo",
  group_id: "Grupo",
  group_name: "Grupo",
};

const META_KEYS = new Set([
  "context",
  "entity",
  "created",
  "deleted",
  "agreement_code",
]);

function formatWeekdaysValue(value: unknown): string {
  if (!Array.isArray(value)) return formatValue(value);
  const nums = value
    .map((v) => Number(v))
    .filter((n) => Number.isFinite(n));
  return formatLtaWeekdays(nums);
}

function formatBookingStatus(value: unknown): string {
  if (typeof value !== "string") return formatValue(value);
  const label = BOOKING_STATUS_LABELS[value as BookingStatus];
  return label ?? value;
}

function formatNamedSide(rec: Record<string, unknown>, side: "from" | "to"): string {
  const nameKey = side === "from" ? "from_name" : "to_name";
  const codeKey = side === "from" ? "from_code" : "to_code";
  const name = rec[nameKey];
  const code = rec[codeKey];
  if (typeof name === "string" && name.trim()) return name;
  if (typeof code === "string" && code.trim()) return code;
  const raw = rec[side] ?? rec[side === "from" ? "old" : "new"];
  if (raw == null || raw === "") return "—";
  return String(raw);
}

function formatPositionSide(rec: Record<string, unknown>, side: "from" | "to"): string {
  const codeKey = side === "from" ? "from_code" : "to_code";
  const code = rec[codeKey];
  if (typeof code === "string" && code.trim()) return code;
  const raw = rec[side] ?? rec[side === "from" ? "old" : "new"];
  if (raw == null || raw === "") return "—";
  return String(raw);
}

const NAMED_ID_FIELDS = new Set([
  "port_id",
  "shipping_line_id",
  "vessel_id",
]);

const TIME_FIELD_KEYS = new Set(["eta", "etd", "eta_real", "etd_real"]);

function formatConflictList(value: unknown): string {
  if (!Array.isArray(value) || value.length === 0) return "—";
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return String(item);
      const rec = item as Record<string, unknown>;
      const code = typeof rec.code === "string" ? rec.code : "";
      const sev = typeof rec.severity === "string" ? rec.severity : "";
      const msg = typeof rec.message === "string" ? rec.message : "";
      if (code && msg) return `${code} (${sev || "?"}): ${msg}`;
      if (code) return sev ? `${code} (${sev})` : code;
      return msg || "—";
    })
    .join(" · ");
}

function formatValue(value: unknown, key?: string): string {
  if (
    key === "conflicts" ||
    key === "resolved_conflicts" ||
    key === "conflicts_from" ||
    key === "conflicts_to"
  ) {
    return formatConflictList(value);
  }
  if (key === "weekdays") {
    if (value != null && typeof value === "object" && !Array.isArray(value)) {
      const rec = value as Record<string, unknown>;
      if ("from" in rec || "to" in rec || "old" in rec || "new" in rec) {
        const from = rec.from ?? rec.old;
        const to = rec.to ?? rec.new;
        return `${formatWeekdaysValue(from)} → ${formatWeekdaysValue(to)}`;
      }
    }
    return formatWeekdaysValue(value);
  }
  if (key === "position_id") {
    if (value != null && typeof value === "object" && !Array.isArray(value)) {
      const rec = value as Record<string, unknown>;
      if ("from" in rec || "to" in rec || "old" in rec || "new" in rec) {
        return `${formatPositionSide(rec, "from")} → ${formatPositionSide(rec, "to")}`;
      }
    }
  }
  if (key && NAMED_ID_FIELDS.has(key)) {
    if (value != null && typeof value === "object" && !Array.isArray(value)) {
      const rec = value as Record<string, unknown>;
      if ("from" in rec || "to" in rec || "old" in rec || "new" in rec) {
        return `${formatNamedSide(rec, "from")} → ${formatNamedSide(rec, "to")}`;
      }
    }
  }
  if (key === "status") {
    if (value != null && typeof value === "object" && !Array.isArray(value)) {
      const rec = value as Record<string, unknown>;
      if ("from" in rec || "to" in rec || "old" in rec || "new" in rec) {
        const from = rec.from ?? rec.old;
        const to = rec.to ?? rec.new;
        return `${formatBookingStatus(from)} → ${formatBookingStatus(to)}`;
      }
    }
    if (typeof value === "string") {
      if (PORT_STATUS_LABELS[value]) return PORT_STATUS_LABELS[value];
      return formatBookingStatus(value);
    }
  }
  if (key && TIME_FIELD_KEYS.has(key)) {
    if (value != null && typeof value === "object" && !Array.isArray(value)) {
      const rec = value as Record<string, unknown>;
      if ("from" in rec || "to" in rec || "old" in rec || "new" in rec) {
        const from = rec.from ?? rec.old;
        const to = rec.to ?? rec.new;
        return `${formatValue(from, key)} → ${formatValue(to, key)}`;
      }
    }
    if (typeof value === "string") return formatTimeShort(value);
  }
  if (value == null || value === "") return "—";
  if (typeof value === "boolean") return value ? "Sí" : "No";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "—";
  if (typeof value === "object") {
    const rec = value as Record<string, unknown>;
    if ("from" in rec || "to" in rec || "old" in rec || "new" in rec) {
      const from = rec.from ?? rec.old;
      const to = rec.to ?? rec.new;
      return `${formatValue(from, key)} → ${formatValue(to, key)}`;
    }
    if (rec.changed === true) return "actualizada";
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

export type AuditChangeLine = {
  field: string;
  label: string;
  text: string;
};

export function auditFieldChangeLines(
  changes: Record<string, unknown> | null | undefined,
): AuditChangeLine[] {
  if (!changes || typeof changes !== "object") return [];
  const lines: AuditChangeLine[] = [];
  for (const [key, value] of Object.entries(changes)) {
    if (META_KEYS.has(key)) continue;
    const label = FIELD_LABELS[key] ?? key;
    lines.push({ field: key, label, text: formatValue(value, key) });
  }
  return lines;
}

export function auditContextLines(
  changes: Record<string, unknown> | null | undefined,
): AuditChangeLine[] {
  const ctx = changes?.context;
  if (!ctx || typeof ctx !== "object") return [];
  const rec = ctx as Record<string, unknown>;
  const lines: AuditChangeLine[] = [];
  if (rec.ip) lines.push({ field: "ip", label: "IP", text: String(rec.ip) });
  if (rec.path) {
    lines.push({ field: "path", label: "Ruta", text: String(rec.path) });
  }
  if (rec.user_agent) {
    lines.push({
      field: "user_agent",
      label: "Cliente",
      text: String(rec.user_agent).slice(0, 120),
    });
  }
  return lines;
}

export function auditEntityHint(
  changes: Record<string, unknown> | null | undefined,
): string | null {
  const entity = changes?.entity;
  if (!entity || typeof entity !== "object") return null;
  const rec = entity as Record<string, unknown>;
  const parts: string[] = [];
  if (rec.port_code || rec.port_name) {
    parts.push(String(rec.port_code || rec.port_name));
  }
  if (rec.vessel_name) parts.push(String(rec.vessel_name));
  if (rec.call_date) parts.push(String(rec.call_date));
  if (rec.position_code) parts.push(`Pos. ${rec.position_code}`);
  return parts.length ? parts.join(" · ") : null;
}
