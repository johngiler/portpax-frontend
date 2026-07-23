export type ReportGuideId =
  | "totals"
  | "movements"
  | "panorama"
  | "cumplimiento";

export type ReportGuideRow = {
  id: ReportGuideId;
  name: string;
  description: string;
  notes: string;
};

/**
 * Guide copy for operational reports currently in PortPax MVP
 * (bookings data only — no proyección / garantías).
 */
export const REPORT_GUIDE: ReportGuideRow[] = [
  {
    id: "totals",
    name: "Booking Totals",
    description:
      "Resumen operativo del período: totales de calls/PAX y desglose por estado, puerto o naviera según los filtros.",
    notes: "Opcional: excluir LTA / CL / LTD. Exporta CSV o Excel.",
  },
  {
    id: "movements",
    name: "WEEK / Movimientos",
    description:
      "Movimientos del período (confirmaciones y cancelaciones) y matrices tipo WEEK usadas en el seguimiento semanal de booking.",
    notes: "Solo exporta Excel (libro multi-hoja). El rango por defecto es la última semana.",
  },
  {
    id: "panorama",
    name: "Panorama por naviera",
    description:
      "Vista consolidada de una naviera: calls y PAX por puerto y año en el rango elegido.",
    notes: "Requiere seleccionar una naviera. Exporta CSV o Excel.",
  },
  {
    id: "cumplimiento",
    name: "Cumplimiento REAL",
    description:
      "Cierre operativo vs plan: PAX real (desembarcados) frente a lo planificado, con % de cumplimiento sobre calls cerrados en Real.",
    notes: "Sin proyección ni garantías contractuales. Exporta CSV o Excel.",
  },
];
