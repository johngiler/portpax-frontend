import { Activity, CalendarDays, MapPin, TrendingUp } from "lucide-react";
import { formatIsoDateLabel } from "@/lib/bookingDates";
import type { OccupancyStats } from "./occupancyUtils";

type OccupancyStatsStripProps = {
  stats: OccupancyStats;
};

export default function OccupancyStatsStrip({ stats }: OccupancyStatsStripProps) {
  const cards = [
    {
      label: "Escalas activas",
      value: String(stats.totalActive),
      hint: "Confirmadas y solicitadas",
      icon: Activity,
      color: "#3478b5",
    },
    {
      label: "Promedio / día",
      value: String(stats.avgPerDay),
      hint: "En el período filtrado",
      icon: TrendingUp,
      color: "#0d9488",
    },
    {
      label: "Día pico",
      value: stats.peakDay ? formatIsoDateLabel(stats.peakDay.date, "short") : "—",
      hint: stats.peakDay ? `${stats.peakDay.count} escala${stats.peakDay.count === 1 ? "" : "s"}` : "Sin ocupación",
      icon: CalendarDays,
      color: "#d97706",
    },
    {
      label: "Puerto más activo",
      value: stats.busiestPort?.name ?? "—",
      hint: stats.busiestPort
        ? `${stats.busiestPort.count} escala${stats.busiestPort.count === 1 ? "" : "s"}`
        : "Sin datos",
      icon: MapPin,
      color: "#7c3aed",
    },
  ];

  return (
    <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ label, value, hint, icon: Icon, color }) => (
        <div
          key={label}
          className="relative overflow-hidden rounded-2xl border border-zinc-200/80 bg-gradient-to-br from-white to-zinc-50/80 p-4 dark:border-zinc-800 dark:from-zinc-900 dark:to-zinc-950/60"
        >
          <div
            className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full opacity-20 blur-2xl"
            style={{ backgroundColor: color }}
          />
          <div className="flex items-start gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${color}18`, color }}
            >
              <Icon className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</p>
              <p className="mt-1 truncate text-lg font-bold text-zinc-900 dark:text-zinc-50">{value}</p>
              <p className="mt-0.5 text-xs text-zinc-400">{hint}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
