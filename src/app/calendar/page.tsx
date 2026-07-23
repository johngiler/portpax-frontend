import { redirect } from "next/navigation";

type CalendarPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

/** Legacy route — calendar lives under Reservas tabs. */
export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  const params = (await searchParams) ?? {};
  const qs = new URLSearchParams();
  qs.set("tab", "calendar");

  const ports = params.ports;
  const portRaw = Array.isArray(ports) ? ports[0] : ports;
  if (portRaw) {
    const first = String(portRaw).split(",")[0]?.trim();
    if (first) qs.set("port", first);
  }
  const port = params.port;
  if (port && !qs.has("port")) {
    qs.set("port", Array.isArray(port) ? String(port[0]) : String(port));
  }

  for (const key of ["mode", "line", "status", "q", "week", "year", "month", "position"] as const) {
    const value = params[key];
    if (value == null) continue;
    qs.set(key, Array.isArray(value) ? String(value[0]) : String(value));
  }

  redirect(`/bookings?${qs.toString()}`);
}
