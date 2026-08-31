/** Format audit `changes` JSON for ops + audit history feeds. */

import { formatLtaWeekdays } from "@/types/lta";
import { formatTimeShort } from "@/lib/bookingDisplay";
import { BOOKING_STATUS_LABELS, type BookingStatus } from "@/types/booking";

const PORT_STATUS_LABELS: Record<string, string> = {
  operational: "Operativo",
  in_development: "En desarrollo",
  planned_extension: "Ampliación proyectada",
};

const POSITION_TYPE_LABELS: Record<string, string> = {
  pier: "Muelle",
  anchorage: "Fondeo",
};

const BOLLARD_TYPE_LABELS: Record<string, string> = {
  standard: "Estándar",
  t_head: "T-head",
  quick_release: "Quick release",
  single_bitt: "Single bitt",
  other: "Otro",
};

const CHOICE_LABELS_BY_FIELD: Record<string, Record<string, string>> = {
  status: PORT_STATUS_LABELS,
  position_type: POSITION_TYPE_LABELS,
  bollard_type: BOLLARD_TYPE_LABELS,
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
  source: "Origen",
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
  min_packs: "PAX mín.",
  advance_months_min: "Anticipación mín.",
  advance_months_max: "Anticipación máx.",
  interval_days: "Cadencia (días)",
  cadence_anchor: "Fecha ancla cadencia",
  valid_from: "Vigencia desde",
  valid_until: "Vigencia hasta",
  notes: "Notas",
  has_contract: "Contrato",
  linked: "Vinculadas",
  unlinked: "Desvinculadas",
  skipped: "Ya existían",
  created: "Creadas",
  candidates: "Candidatas",
  dates: "Fechas",
  vessel_name: "Barco",
  kept: "Sin cambio",
  linked_bookings: "Reservas vinculadas",
  unlinked_bookings: "Reservas desvinculadas",
  job_status: "Estado del proceso",
  job_kind: "Tipo de proceso",
  error: "Error",
  task_id: "Task Celery",
  booking_policy: "Política de ventana",
  lta_depth_blocks: "Profundidad LTA",
  reserve_foreign_slots: "Reserva de slot",
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
  berth_id: "Muelle",
  berth_code: "Muelle",
  position_type: "Tipo",
  short_code: "Posición",
  max_loa_m: "Eslora máx.",
  min_loa_m: "Eslora mín.",
  max_beam_m: "Manga máx.",
  min_draft_m: "Calado mín.",
  min_eta: "ETA mín.",
  bollard_type: "Tipo de bita",
  capacity_t: "Capacidad (t)",
  quantity: "Cantidad",
  label: "Etiqueta",
  fender_type: "Tipo de defensa",
  bollard_allocations: "Bitas asignadas",
  fender_allocations: "Defensas asignadas",
  length_m: "Largo",
  width_m: "Ancho",
  walkway_length_m: "Largo pasarela",
  walkway_width_m: "Ancho pasarela",
  effective_from: "Vigente desde",
  effective_until: "Vigente hasta",
  sort_order: "Orden",
  is_cover: "Portada",
  has_image: "Imagen",
  caption: "Leyenda",
  outer_position_id: "Posición exterior",
  inner_position_id: "Posición interior",
  position_a_id: "Posición A",
  position_b_id: "Posición B",
  enforce_eta: "Validar ETA",
  enforce_etd: "Validar ETD",
  separation_m: "Separación (m)",
  yellow_from_m: "Amarillo desde (m)",
  red_from_m: "Rojo desde (m)",
  ship_code: "Código de barco",
  vessel_class: "Clase",
  gross_tonnage: "Tonelaje bruto",
  pax_capacity: "PAX",
  crew_capacity: "Tripulación",
  loa_m: "Eslora",
  beam_m: "Manga",
  draft_m: "Calado",
  flag: "Bandera",
  year_built: "Año",
  segment: "Segmento",
  size_category: "Categoría",
  mooring_line_count: "Líneas de amarre",
  bollard_swl_t: "SWL bitas (t)",
};

const META_KEYS = new Set([
  "context",
  "entity",
  "created",
  "deleted",
  "agreement_code",
  "task_id",
  // Shown as friendly badge + tooltip in LtaHistoryFeed
  "job_status",
  "job_kind",
  // Labels live on the id change payload (from_labels / from_name)
  "vessel_labels",
  "position_labels",
  "port_labels",
  "role_label",
]);

const LABELED_ID_LIST_FIELDS = new Set([
  "position_ids",
  "vessel_ids",
  "port_ids",
]);

function formatWeekdaysValue(value: unknown): string {
  if (!Array.isArray(value)) return formatValue(value);
  const nums = value
    .map((v) => Number(v))
    .filter((n) => Number.isFinite(n));
  return formatLtaWeekdays(nums);
}

function formatBookingStatus(value: unknown): string {
  if (typeof value === "string") {
    const label = BOOKING_STATUS_LABELS[value as BookingStatus];
    return label ?? value;
  }
  return formatValue(value);
}

function formatCatalogStatus(value: unknown): string {
  if (typeof value === "string") {
    if (PORT_STATUS_LABELS[value]) return PORT_STATUS_LABELS[value];
    return formatBookingStatus(value);
  }
  return formatValue(value);
}

function formatChoiceValue(value: unknown, key?: string): string {
  if (typeof value === "string" && key && CHOICE_LABELS_BY_FIELD[key]?.[value]) {
    return CHOICE_LABELS_BY_FIELD[key][value];
  }
  if (key === "status") return formatCatalogStatus(value);
  return formatValue(value, key);
}

function formatChoiceChange(
  rec: Record<string, unknown>,
  key?: string,
): string {
  const labels = key ? CHOICE_LABELS_BY_FIELD[key] : undefined;
  const fromLabel = rec.from_label ?? rec.old_label;
  const toLabel = rec.to_label ?? rec.new_label;
  const fromRaw = rec.from ?? rec.old;
  const toRaw = rec.to ?? rec.new;
  const from =
    typeof fromLabel === "string" && fromLabel.trim()
      ? fromLabel
      : typeof fromRaw === "string" && labels?.[fromRaw]
        ? labels[fromRaw]
        : formatChoiceValue(fromRaw, key);
  const to =
    typeof toLabel === "string" && toLabel.trim()
      ? toLabel
      : typeof toRaw === "string" && labels?.[toRaw]
        ? labels[toRaw]
        : formatChoiceValue(toRaw, key);
  return `${from} → ${to}`;
}

function formatAllocations(value: unknown): string {
  if (!Array.isArray(value) || value.length === 0) return "—";
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return String(item);
      const rec = item as Record<string, unknown>;
      if (rec.capacity_t != null) {
        return `${rec.quantity ?? 1}×${rec.capacity_t} t`;
      }
      if (typeof rec.fender_type === "string") {
        return `${rec.quantity ?? 1}×${rec.fender_type}`;
      }
      return formatLabelList([item]);
    })
    .join(", ");
}

function formatNamedSide(rec: Record<string, unknown>, side: "from" | "to"): string {
  const nameKey = side === "from" ? "from_name" : "to_name";
  const codeKey = side === "from" ? "from_code" : "to_code";
  const labelKey = side === "from" ? "from_label" : "to_label";
  const label = rec[labelKey];
  if (typeof label === "string" && label.trim()) return label;
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

function formatLabelList(value: unknown): string {
  if (!Array.isArray(value) || value.length === 0) return "—";
  return value
    .map((item) => {
      if (item == null || item === "") return null;
      if (typeof item === "string" || typeof item === "number") return String(item);
      if (typeof item === "object") {
        const rec = item as Record<string, unknown>;
        if (typeof rec.name === "string" && rec.name.trim()) return rec.name;
        if (typeof rec.code === "string" && rec.code.trim()) return rec.code;
        if (typeof rec.label === "string" && rec.label.trim()) return rec.label;
      }
      return String(item);
    })
    .filter(Boolean)
    .join(", ");
}

function formatLabeledIdListChange(rec: Record<string, unknown>): string {
  const fromLabels = rec.from_labels ?? rec.old_labels;
  const toLabels = rec.to_labels ?? rec.new_labels;
  const from =
    Array.isArray(fromLabels) && fromLabels.length
      ? formatLabelList(fromLabels)
      : formatLabelList(rec.from ?? rec.old);
  const to =
    Array.isArray(toLabels) && toLabels.length
      ? formatLabelList(toLabels)
      : formatLabelList(rec.to ?? rec.new);
  return `${from} → ${to}`;
}

const NAMED_ID_FIELDS = new Set([
  "port_id",
  "shipping_line_id",
  "vessel_id",
  "long_term_agreement_id",
  "group_id",
  "berth_id",
  "outer_position_id",
  "inner_position_id",
  "position_a_id",
  "position_b_id",
]);

const CODE_FK_FIELDS = new Set([
  "position_id",
  "berth_id",
  "outer_position_id",
  "inner_position_id",
  "position_a_id",
  "position_b_id",
]);

const TIME_FIELD_KEYS = new Set(["eta", "etd", "eta_real", "etd_real", "min_eta"]);

const ALLOCATION_FIELDS = new Set(["bollard_allocations", "fender_allocations"]);

const CHOICE_FIELDS = new Set(["status", "position_type", "bollard_type"]);

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
  if (key === "source" && typeof value === "string") {
    const labels: Record<string, string> = {
      wizard: "Wizard",
      mass_import: "Importación masiva",
      import_file: "Importación masiva",
      import_paste: "Importación masiva",
      berthing_import: "BERTHING PAPERS",
      lta_generate: "Generación LTA",
      lta_regenerate: "Regeneración LTA",
    };
    return labels[value] ?? value;
  }
  if (key === "job_status" && typeof value === "string") {
    const labels: Record<string, string> = {
      queued: "En segundo plano",
      success: "Completado",
      failed: "Falló",
    };
    return labels[value] ?? value;
  }
  if (key === "job_kind" && typeof value === "string") {
    const labels: Record<string, string> = {
      link: "Enlace con reservas",
      resync: "Re-sincronización de vínculos",
      destroy: "Eliminación del acuerdo",
      generate: "Generación de reservas",
      regenerate: "Regeneración de reservas",
    };
    return labels[value] ?? value;
  }
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
  if (key && LABELED_ID_LIST_FIELDS.has(key)) {
    if (value != null && typeof value === "object" && !Array.isArray(value)) {
      const rec = value as Record<string, unknown>;
      if ("from" in rec || "to" in rec || "old" in rec || "new" in rec) {
        return formatLabeledIdListChange(rec);
      }
    }
    return formatLabelList(value);
  }
  if (key && ALLOCATION_FIELDS.has(key)) {
    if (value != null && typeof value === "object" && !Array.isArray(value)) {
      const rec = value as Record<string, unknown>;
      if ("from" in rec || "to" in rec || "old" in rec || "new" in rec) {
        const from = rec.from ?? rec.old;
        const to = rec.to ?? rec.new;
        return `${formatAllocations(from)} → ${formatAllocations(to)}`;
      }
    }
    return formatAllocations(value);
  }
  if (key && CHOICE_FIELDS.has(key)) {
    if (value != null && typeof value === "object" && !Array.isArray(value)) {
      const rec = value as Record<string, unknown>;
      if ("from" in rec || "to" in rec || "old" in rec || "new" in rec) {
        return formatChoiceChange(rec, key);
      }
    }
    return formatChoiceValue(value, key);
  }
  if (key && CODE_FK_FIELDS.has(key)) {
    if (value != null && typeof value === "object" && !Array.isArray(value)) {
      const rec = value as Record<string, unknown>;
      if ("from" in rec || "to" in rec || "old" in rec || "new" in rec) {
        return `${formatPositionSide(rec, "from")} → ${formatPositionSide(rec, "to")}`;
      }
    }
  }
  if (key === "position_id") {
    if (value != null && typeof value === "object" && !Array.isArray(value)) {
      const rec = value as Record<string, unknown>;
      if ("from" in rec || "to" in rec || "old" in rec || "new" in rec) {
        return `${formatPositionSide(rec, "from")} → ${formatPositionSide(rec, "to")}`;
      }
    }
  }
  if (key === "role") {
    if (value != null && typeof value === "object" && !Array.isArray(value)) {
      const rec = value as Record<string, unknown>;
      if ("from" in rec || "to" in rec || "old" in rec || "new" in rec) {
        return `${formatNamedSide(rec, "from")} → ${formatNamedSide(rec, "to")}`;
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
        return formatChoiceChange(rec, "status");
      }
    }
    return formatCatalogStatus(value);
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
  if (Array.isArray(value)) return formatLabelList(value);
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
    // Snapshot blobs stay hidden; numeric `created` from generate jobs is shown.
    if (key === "created" || key === "deleted") {
      if (value != null && typeof value === "object" && !Array.isArray(value)) {
        continue;
      }
    } else if (META_KEYS.has(key)) {
      continue;
    }
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
  if (rec.shipping_line_name || rec.shipping_line_code) {
    parts.push(String(rec.shipping_line_name || rec.shipping_line_code));
  }
  if (rec.berth_code) parts.push(`Muelle ${rec.berth_code}`);
  if (rec.vessel_name) parts.push(String(rec.vessel_name));
  if (rec.call_date) parts.push(String(rec.call_date));
  if (rec.position_code) parts.push(`Pos. ${rec.position_code}`);
  return parts.length ? parts.join(" · ") : null;
}
