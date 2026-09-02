export type ReportGuideId = "ports_totals" | "port_carrier" | "port_trends";

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
      "Exporta Excel con estilo ITM. Opción sin LTA / CL / LTD. Base PAX: planificado o cap. máx. (filtros transversales entre reportes).",
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
];
