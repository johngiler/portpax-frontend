export type ReportGuideId =
  | "ports_totals"
  | "port_carrier"
  | "port_trends"
  | "solicitudes_port"
  | "booking_movements";

export type ReportGuideRow = {
  id: ReportGuideId;
  name: string;
  description: string;
  notes: string;
};

export const REPORT_GUIDE: ReportGuideRow[] = [
  {
    id: "ports_totals",
    name: "Totals puertos",
    description:
      "Matriz año × mes de calls y PAX por puerto (vista consolidada multi-puerto).",
    notes:
      "Exporta Excel con estilo ITM. Opción sin LTA (excluye solo escalas fantasma LTA; CL sí cuenta). Base PAX: planificado o cap. máx. (filtros transversales entre reportes).",
  },
  {
    id: "port_carrier",
    name: "Totals por puerto",
    description:
      "Misma matriz para un puerto, desglosada por naviera (RCI, NCL, MSC…).",
    notes:
      "Requiere puerto. Conserva fechas, base PAX y sin LTA al cambiar de reporte.",
  },
  {
    id: "port_trends",
    name: "Trends por puerto",
    description:
      "SHIPS y PAX por naviera y año, más % de crecimiento interanual de PAX.",
    notes:
      "Requiere puerto. Growth en verde/rojo. Solo Excel. Misma base PAX transversal.",
  },
  {
    id: "solicitudes_port",
    name: "Resumen de movimientos",
    description:
      "Listado de escalas por año en un puerto, con totales PAX del puerto y por naviera.",
    notes:
      "Puerto y naviera obligatorios. Mismos estados de ocupación que los otros reportes (sin canceladas). Sin Desde/Hasta: el rango sale de Años (vacío = todos desde 2025). La naviera filtra el listado y muestra la caja de totales; el puerto no aplica ese filtro. Tags opcionales. Solo Excel.",
  },
  {
    id: "booking_movements",
    name: "Movimientos de bookings",
    description:
      "Conteo de movimientos (alta, cancelación, cambio de fecha/barco, PAX real) por mes, y PAX con signo por puerto y año de escala.",
    notes:
      "Solo filtro Año (mismo catálogo 2025…actual+4). Fuente: historial de auditoría. Excel: Movimientos de bookings.xlsx.",
  },
];
