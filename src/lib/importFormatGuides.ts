/**
 * Accepted formats / normalization rules for view data imports.
 * Keep in sync with backend `apps.bookings.services.import_mass`.
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

/** Mass booking paste grid columns (Excel file may still include extra ITM fields). */
export const BULK_BOOKING_PASTE_COLUMNS = [
  "Ship",
  "Port",
  "Arrival",
  "Departure",
  "Posición",
] as const;

/** Recap paste grid — same idea as mass import, without position. */
export const BOOKING_RECAP_PASTE_COLUMNS = [
  "Ship",
  "Port",
  "Berth Date",
  "Arrive Time",
  "Depart Time",
] as const;

/** Mass booking ITM columns (Excel / paste). */
export const BULK_BOOKINGS_IMPORT_GUIDE: ImportFormatGuide = {
  id: "bulk_bookings",
  title: "Formatos aceptados — reservas masivas",
  summary:
    "Encabezados Ship, Port, Arrival, Departure. Posición es opcional. Excel: una fila por reserva (tab o ;). Correo/Outlook: también un campo por línea (cabeceras y luego bloques de valores).",
  rows: [
    {
      field: "Ship",
      required: true,
      accepted: "Nombre del barco",
      notes: "Debe existir en catálogo (exacto o coincidencia única).",
    },
    {
      field: "Port",
      required: true,
      accepted: "Nombre, comercial o código",
      notes: "Ej. Roatán, Puerto Plata, POP. Se ignoran acentos y «País» tras la coma.",
    },
    {
      field: "Arrival",
      required: true,
      accepted: "Fecha u hora de llegada",
      notes:
        "ISO 2026-08-05 08:00 · 05/08/2026 · 5 ago 2026 · Aug 5, 2026 · 16-Feb-2028 8:00",
    },
    {
      field: "Departure",
      required: true,
      accepted: "Fecha u hora de salida",
      notes: "Mismos formatos que Arrival. Define el día de escala (call_date).",
    },
    {
      field: "Posición",
      required: false,
      accepted: "Código corto o completo (P1, E2…)",
      notes:
        "Opcional. Si se resuelve en el puerto, prevalece. Si falta o no se encuentra, se usa la posición sugerida.",
    },
  ],
  footer:
    "Solo se usan Ship, Port, Arrival, Departure y Posición. Cualquier otra columna del pegado (Vendor Name, Call Type, etc.) se descarta. Posición vacía o no encontrada → se sugiere en el siguiente paso. Filas sin Ship ni Port se omiten.",
};

export const BOOKING_RECAP_IMPORT_GUIDE: ImportFormatGuide = {
  id: "booking_recap",
  title: "Formatos aceptados — recap de reservas",
  summary:
    "Contrasta filas ya existentes. No crea reservas. Encabezados Ship, Port, Berth Date, Arrive Time y Depart Time. También vale Ship, Port, Arrival y Departure (sin posición).",
  rows: [
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
      field: "Berth Date",
      required: true,
      accepted: "Berth Date, Arrival o fecha",
      notes:
        "12/02/26 · 05/11/2026 · 2026-11-05. Si la escala en PortPax cae ±1 día, igual entra al filtro y el aviso indica la fecha.",
    },
    {
      field: "Arrive Time",
      required: false,
      accepted: "Arrive Time o Arrival con hora",
      notes: "08:00. Si difiere de la llegada en PortPax, queda en avisos.",
    },
    {
      field: "Depart Time",
      required: false,
      accepted: "Depart Time o Departure con hora",
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
