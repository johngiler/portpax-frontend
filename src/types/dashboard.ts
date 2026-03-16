export type DashboardVisibility = {
  cards: boolean;
  resumenMetricas: boolean;
  estimadoIngresos: boolean;
  proximasEscalas: boolean;
  escalasPorPuerto: boolean;
  paxPorPuerto: boolean;
  escalasPorNaviera: boolean;
  escalasPorMuelle: boolean;
  escalasPorMes: boolean;
  paxPorMes: boolean;
  escalasPaxPorAno: boolean;
};

export const DEFAULT_DASHBOARD_VISIBILITY: DashboardVisibility = {
  cards: true,
  resumenMetricas: true,
  estimadoIngresos: true,
  proximasEscalas: true,
  escalasPorPuerto: true,
  paxPorPuerto: true,
  escalasPorNaviera: true,
  escalasPorMuelle: true,
  escalasPorMes: true,
  paxPorMes: true,
  escalasPaxPorAno: true,
};
