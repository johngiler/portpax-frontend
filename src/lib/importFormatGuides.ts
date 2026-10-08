/**
 * Accepted formats / normalization rules for view data imports.
 * Keep in sync with backend `apps.bookings.services.import_mass` + booking_recap.
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

/** Mass booking paste grid (homologated with recap; Assignment = posición). */
export const BULK_BOOKING_PASTE_COLUMNS = [
  "Group",
  "Ship",
  "Port",
  "Arrival Date",
  "ETA",
  "ETD",
  "Assignment",
] as const;

/** Recap paste grid — same as mass create, without Assignment. */
export const BOOKING_RECAP_PASTE_COLUMNS = [
  "Group",
  "Ship",
  "Port",
  "Arrival Date",
  "ETA",
  "ETD",
] as const;

/** Mass booking columns (Excel / paste). */
export const BULK_BOOKINGS_IMPORT_GUIDE: ImportFormatGuide = {
  id: "bulk_bookings",
  title: "Formatos aceptados — reservas masivas",
  summary:
    "Encabezados Group, Ship, Port, Arrival Date, ETA, ETD y Assignment (posición, opcional). La fecha va separada de los horarios. Group fuerza la búsqueda del barco por grupo de naviera (homónimos).",
  rows: [
    {
      field: "Group",
      required: false,
      accepted: "Group, Grupo o NAVIERA",
      notes:
        "Nombre o código del grupo de naviera. Si hay varios barcos con el mismo nombre, acota la búsqueda a ese grupo.",
    },
    {
      field: "Ship",
      required: true,
      accepted: "Nombre del barco",
      notes: "Debe existir en catálogo (exacto o coincidencia).",
    },
    {
      field: "Port",
      required: true,
      accepted: "Nombre, comercial o código",
      notes: "Ej. Roatán, Puerto Plata, POP. Se ignoran acentos y «País» tras la coma.",
    },
    {
      field: "Arrival Date",
      required: true,
      accepted: "Fecha de escala",
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
      field: "Assignment",
      required: false,
      accepted: "Assignment, Posición, P1, E2…",
      notes:
        "Opcional. Si se resuelve en el puerto, prevalece. Si falta o no se encuentra, se usa la posición sugerida.",
    },
  ],
  footer:
    "También se acepta el formato legacy Ship, Port, Arrival, Departure. Filas sin Ship ni Port se omiten.",
};

export const BOOKING_RECAP_IMPORT_GUIDE: ImportFormatGuide = {
  id: "booking_recap",
  title: "Formatos aceptados — recap de reservas",
  summary:
    "Mismo formato que creación masiva, sin Assignment. Contrasta filas ya existentes; no crea reservas. Group fuerza la búsqueda por grupo de naviera.",
  rows: [
    {
      field: "Group",
      required: false,
      accepted: "Group, Grupo o NAVIERA",
      notes:
        "Grupo de naviera. Evita «la reserva no existe» cuando hay barcos homónimos en distintos grupos.",
    },
    {
      field: "Ship",
      required: true,
      accepted: "Ship o Ship Name",
      notes: "Nombre del barco en catálogo.",
    },
    {
      field: "Port",
      required: true,
      accepted: "Port o Port Name",
      notes: "Nombre, comercial o código. Se ignoran acentos.",
    },
    {
      field: "Arrival Date",
      required: true,
      accepted: "Arrival Date, Berth Date o fecha",
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
