import { apiFetch } from "@/services/apiClient";

export type NavCounts = {
  bookings: number;
  /** Bookings in the current calendar year (badge for Reportes). */
  reports: number;
  ports: number;
  shipping_lines: number;
  users: number | null;
  report_modules: number;
};

export async function fetchNavCounts(): Promise<NavCounts> {
  return apiFetch("api/nav-counts/");
}
