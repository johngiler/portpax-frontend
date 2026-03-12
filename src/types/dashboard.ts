export type DashboardVisibility = {
  cards: boolean;
  resumenMetricas: boolean;
  distribucionCatalogo: boolean;
  escalasPorPuerto: boolean;
  paxPorPuerto: boolean;
  escalasPorMes: boolean;
  paxPorMes: boolean;
  escalasPaxPorAno: boolean;
};

export const DEFAULT_DASHBOARD_VISIBILITY: DashboardVisibility = {
  cards: true,
  resumenMetricas: true,
  distribucionCatalogo: true,
  escalasPorPuerto: true,
  paxPorPuerto: true,
  escalasPorMes: true,
  paxPorMes: true,
  escalasPaxPorAno: true,
};
