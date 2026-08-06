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

/** Mass booking ITM columns (Excel / paste). */
export const BULK_BOOKINGS_IMPORT_GUIDE: ImportFormatGuide = {
  id: "bulk_bookings",
  title: "Formatos aceptados — reservas masivas",
  summary:
    "Encabezados Ship, Port, Arrival, Departure (y opcionales). Excel: una fila por reserva (tab o ;). Correo/Outlook: también un campo por línea (cabeceras y luego bloques de valores).",
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
      field: "Vendor Name",
      required: false,
      accepted: "Texto libre / naviera",
      notes: "Opcional. Ayuda a identificar la línea si el barco es ambiguo.",
    },
    {
      field: "Call Type",
      required: false,
      accepted: "Texto libre",
      notes: "Opcional. Se conserva como referencia en la fila importada.",
    },
  ],
  footer:
    "Normalización: espacios múltiples → uno; puertos sin acentos; años de 2 dígitos → 20xx. Filas sin Ship ni Port se omiten. Pegado vertical del correo se reordena automáticamente a columnas.",
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
  availability_filter: AVAILABILITY_IMPORT_GUIDE,
};

export function getImportFormatGuide(
  id: string | null | undefined,
): ImportFormatGuide | null {
  if (!id) return null;
  return IMPORT_FORMAT_GUIDES[id] ?? null;
}
