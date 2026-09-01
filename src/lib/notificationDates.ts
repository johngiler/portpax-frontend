/** Human-readable notification timestamp (es-MX, with weekday). */
export function formatNotificationTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const weekdayRaw = date.toLocaleDateString("es-MX", { weekday: "short" });
  const weekday = weekdayRaw
    .replace(/\./g, "")
    .replace(/^\w/, (c) => c.toUpperCase());
  const day = date.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const time = date.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${weekday} ${day} · ${time}`;
}
