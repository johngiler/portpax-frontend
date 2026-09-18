export type ReportGuideId =
  | "ports_totals"
  | "port_carrier"
  | "port_trends"
  | "solicitudes_port"
  | "booking_movements"
  | "weekly_report";

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
      "Exporta PDF, Excel y CSV con el mismo diseño de familia. Opción sin LTA (excluye solo escalas fantasma LTA; CL sí cuenta). Base PAX: planificado o cap. máx. (filtros transversales entre reportes).",
  },
  {
    id: "port_carrier",
    name: "Totals por puerto",
    description:
      "Misma matriz para un puerto, desglosada por naviera (RCI, NCL, MSC…).",
    notes:
      "Requiere puerto. Conserva fechas, base PAX y sin LTA al cambiar de reporte. Exporta PDF / Excel / CSV.",
  },
  {
    id: "port_trends",
    name: "Trends por puerto",
    description:
      "SHIPS y PAX por grupo de naviera y año (desglose a navieras), más % de crecimiento interanual de PAX.",
    notes:
      "Requiere puerto. Growth en verde/rojo. Misma base PAX transversal. Total al pie de ambos bloques. Exporta PDF / Excel / CSV.",
  },
  {
    id: "solicitudes_port",
    name: "Resumen de movimientos",
    description:
      "Listado de escalas por año en un puerto, con totales PAX del puerto y por naviera.",
    notes:
      "Puerto obligatorio. Grupo de naviera o naviera (cualquiera de los dos). Sin naviera, el grupo filtra todas las navieras del grupo. Mismos estados de ocupación que los otros reportes (sin canceladas). Sin Desde/Hasta: el rango sale de Años (vacío = todos desde 2025). El carrier filtra el listado y muestra la caja de totales; el puerto no aplica ese filtro. Tags opcionales. Exporta PDF / Excel / CSV.",
  },
  {
    id: "booking_movements",
    name: "Movimientos de bookings",
    description:
      "Conteo de movimientos (alta, cancelación, cambio de fecha/barco, PAX real) por mes, y PAX con signo por puerto y año de escala.",
    notes:
      "Solo filtro Año (pasados + actual, desde 2025). Fuente: historial de auditoría. Exporta PDF / Excel / CSV como «Movimientos de bookings».",
  },
  {
    id: "weekly_report",
    name: "Reporte Semanal",
    description:
      "Desglose de movimientos de la semana ISO: por puerto, PAX con signo (NEW BOOKING, CANCELLATION, SHIP CHANGE, PAX PROY / REAL) en columnas de año de escala.",
    notes:
      "Filtros: Año (pasados + actual) + Semana ISO (por defecto la semana actual). Fuente: auditoría. Exporta PDF / Excel / CSV como «Reporte Semanal».",
  },
];
