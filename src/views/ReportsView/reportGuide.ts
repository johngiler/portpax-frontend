export type ReportGuideId =
  | "ports_totals"
  | "port_carrier"
  | "port_trends"
  | "solicitudes_port"
  | "booking_movements"
  | "weekly_report"
  | "carrier_panorama";

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
      "Matriz de calls y PAX por puerto (columnas = meses; filas = años o temporadas).",
    notes:
      "Puertos ordenados por volumen de PAX. En Temporadas hay una fila por año crucero (may–abr, p. ej. 2025/2026) y las columnas van de MAY a ABR. En año natural, filas por calendario y columnas ene–dic. Filtros: multi-puerto, Temporada, Base PAX, Sin LTA y fechas. Exporta PDF / Excel / CSV.",
  },
  {
    id: "port_carrier",
    name: "Totals por puerto",
    description:
      "Matriz de calls y PAX de un puerto, desglosada por naviera (columnas = meses).",
    notes:
      "Requiere puerto. Navieras ordenadas por volumen de PAX. Con filtro de grupo/naviera aparece «Otros». En Temporadas hay una fila por año crucero (may–abr) y columnas MAY–ABR; en año natural, filas por calendario y columnas ene–dic. Exporta PDF / Excel / CSV.",
  },
  {
    id: "port_trends",
    name: "Trends por puerto",
    description:
      "SHIPS y PAX por grupo de naviera (columnas = años o temporadas), Growth %, y gráfico mensual calls/PAX por naviera.",
    notes:
      "Requiere puerto. Con filtro de grupo/naviera aparece «Otros». Temporada cambia títulos de columna a Summer/Winter. Growth compara Summer vs Summer y Winter vs Winter. Gráfica de PAX/escalas por año o temporada, y escalas por día. Exporta PDF / Excel / CSV.",
  },
  {
    id: "solicitudes_port",
    name: "Resumen de movimientos",
    description:
      "Listado de escalas por año en un puerto, con totales PAX del puerto y por naviera.",
    notes:
      "Puerto obligatorio. Grupo de naviera o naviera (cualquiera de los dos). Sin naviera, el grupo filtra todas las navieras del grupo. Por defecto mismos estados de ocupación que los otros reportes (sin canceladas); con filtro de Tags también entran Cancelada (PAX con signo negativo). Sin Desde/Hasta: el rango sale de Años (vacío = todos desde 2025). El carrier filtra el listado y muestra la caja de totales; el puerto no aplica ese filtro. Tags opcionales. Exporta PDF / Excel / CSV.",
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
      "Por puerto: totales anuales de PAX (fila azul) y desglose de movimientos de la semana ISO (NEW / CANCEL / SHIP / PAX PROY·REAL).",
    notes:
      "Filtros: Año (pasados + actual) + Semana ISO (por defecto la actual) + Base PAX + Sin LTA. Fila azul = totales PAX del puerto por año de escala (todos los años del rango). Filas = movimientos de la semana. PAX PROY / REAL = proyectado (Base PAX) − PAX real. Exporta PDF / Excel / CSV.",
  },
  {
    id: "carrier_panorama",
    name: "Panorama Navieras",
    description:
      "Arribos y PAX por puerto y año, con KPIs y pastel de participación.",
    notes:
      "Filtros: puertos (varios; por defecto todos), grupo, naviera, Temporada (año natural / Summer / Winter), Base PAX, Sin LTA y rango de fechas. Puertos ordenados por volumen de PAX. Incluye barco principal (más escalas) por puerto y promedio PAX/arribo. El export no incluye el detalle de filtros ni el desglose anual de KPIs. Exporta PDF / Excel / CSV.",
  },
];
