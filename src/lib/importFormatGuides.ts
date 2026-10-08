/**
 * Accepted formats / normalization rules for view data imports.
 * Keep in sync with backend `apps.bookings.services.import_mass` + booking_recap.
 * Paste-grid headers are Spanish (same language as the rest of the UI).
 */

export type ImportFormatGuideRow = {
  field: string;
  required: boolean;
  accepted: string;
  notes: string;
};

export type ImportFormatGuide = {
  id: string;
  title: string;
  summary: string;
  rows: ImportFormatGuideRow[];
  footer?: string;
};

/** Mass booking paste grid (homologated with recap; Posición = slot). */
export const BULK_BOOKING_PASTE_COLUMNS = [
  "Naviera",
  "Barco",
  "Puerto",
  "Fecha",
  "ETA",
  "ETD",
  "Posición",
] as const;

/** Recap paste grid — same as mass create, without Posición. */
export const BOOKING_RECAP_PASTE_COLUMNS = [
  "Naviera",
  "Barco",
  "Puerto",
  "Fecha",
  "ETA",
  "ETD",
] as const;

/** Mass booking columns (Excel / paste). */
export const BULK_BOOKINGS_IMPORT_GUIDE: ImportFormatGuide = {
  id: "bulk_bookings",
  title: "Formatos aceptados — reservas masivas",
  summary:
    "Encabezados Naviera, Barco, Puerto, Fecha, ETA, ETD y Posición (opcional). La fecha va separada de los horarios. Naviera acota el barco a esa línea (homónimos).",
  rows: [
    {
      field: "Naviera",
      required: false,
      accepted: "Naviera, Shipping Line, Group o Carrier",
      notes:
        "Nombre o código de la naviera (no del grupo corporativo). Si hay barcos homónimos, acota la búsqueda a esa línea.",
    },
    {
      field: "Barco",
      required: true,
      accepted: "Barco, Ship o Ship Name",
      notes: "Debe existir en catálogo (exacto o coincidencia).",
    },
    {
      field: "Puerto",
      required: true,
      accepted: "Puerto, Port o Port Name",
      notes: "Ej. Roatán, Puerto Plata, POP. Se ignoran acentos y «País» tras la coma.",
    },
    {
      field: "Fecha",
      required: true,
      accepted: "Fecha, Arrival Date o Berth Date",
      notes: "12/02/26 · 05/11/2026 · 2026-11-05. Sin hora (la hora va en ETA).",
    },
    {
      field: "ETA",
      required: true,
      accepted: "Hora de llegada",
      notes: "08:00 · 8:00",
    },
    {
      field: "ETD",
      required: true,
      accepted: "Hora de salida",
      notes: "17:00 · 17:30",
    },
    {
      field: "Posición",
      required: false,
      accepted: "Posición, Position, P1, E2…",
      notes:
        "Opcional. Si se resuelve en el puerto, prevalece. Si falta o no se encuentra, se usa la posición sugerida.",
    },
  ],
  footer:
    "También se acepta el formato legacy Ship, Port, Arrival, Departure (o equivalentes en español). Filas sin Barco ni Puerto se omiten.",
};

export const BOOKING_RECAP_IMPORT_GUIDE: ImportFormatGuide = {
  id: "booking_recap",
  title: "Formatos aceptados — recap de reservas",
  summary:
    "Mismo formato que creación masiva, sin Posición. Contrasta filas ya existentes; no crea reservas. Naviera acota la búsqueda por línea (homónimos).",
  rows: [
    {
      field: "Naviera",
      required: false,
      accepted: "Naviera, Shipping Line, Group o Carrier",
      notes:
        "Naviera (línea), no grupo corporativo. Evita «la reserva no existe» cuando hay barcos homónimos.",
    },
    {
      field: "Barco",
      required: true,
      accepted: "Barco, Ship o Ship Name",
      notes: "Nombre del barco en catálogo.",
    },
    {
      field: "Puerto",
      required: true,
      accepted: "Puerto, Port o Port Name",
      notes: "Nombre, comercial o código. Se ignoran acentos.",
    },
    {
      field: "Fecha",
      required: true,
      accepted: "Fecha, Arrival Date o Berth Date",
      notes:
        "12/02/26 · 05/11/2026 · 2026-11-05. Si la escala en PortPax cae ±1 día, igual entra al filtro y el aviso indica la fecha.",
    },
    {
      field: "ETA",
      required: false,
      accepted: "ETA o Arrive Time",
      notes: "08:00. Si difiere de la llegada en PortPax, queda en avisos.",
    },
    {
      field: "ETD",
      required: false,
      accepted: "ETD o Depart Time",
      notes: "17:00. Si difiere de la salida en PortPax, queda en avisos.",
    },
  ],
  footer:
    "Sin posición. La lista queda filtrada con las reservas encontradas. La modificación masiva no se abre sola.",
};

/** Availability date list (Excel / paste). */
export const AVAILABILITY_IMPORT_GUIDE: ImportFormatGuide = {
  id: "availability_filter",
  title: "Formatos aceptados — disponibilidad",
  summary:
    "Una fecha por fila. Encabezado opcional: Fecha / Fechas / Date / Arrival.",
  rows: [
    {
      field: "Fecha",
      required: true,
      accepted: "Fecha de escala",
      notes:
        "2026-08-05 · 05/08/2026 · 5 ago 2026 · Aug 5, 2026 · Monday, 21 June 2027",
    },
  ],
  footer:
    "Si no hay encabezado, se toma la primera celda con fecha válida de cada fila. Duplicados se unifican al filtrar.",
};

export const IMPORT_FORMAT_GUIDES: Record<string, ImportFormatGuide> = {
  bulk_bookings: BULK_BOOKINGS_IMPORT_GUIDE,
  booking_recap: BOOKING_RECAP_IMPORT_GUIDE,
  availability_filter: AVAILABILITY_IMPORT_GUIDE,
};

export function getImportFormatGuide(
  id: string | null | undefined,
): ImportFormatGuide | null {
  if (!id) return null;
  return IMPORT_FORMAT_GUIDES[id] ?? null;
}
