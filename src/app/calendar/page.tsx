"use client";

import { useEffect } from "react";

/**
 * Legacy route — calendar lives under Reservas tabs.
 * Client redirect: static export cannot await searchParams.
 */
export default function CalendarPage() {
  useEffect(() => {
    const incoming = new URLSearchParams(window.location.search);
    const qs = new URLSearchParams();
    qs.set("tab", "calendar");

    const ports = incoming.get("ports");
    if (ports) {
      const first = ports.split(",")[0]?.trim();
      if (first) qs.set("port", first);
    }
    const port = incoming.get("port");
    if (port && !qs.has("port")) qs.set("port", port);

    for (const key of [
      "mode",
      "line",
      "status",
      "q",
      "week",
      "year",
      "month",
      "position",
    ] as const) {
      const value = incoming.get(key);
      if (value) qs.set(key, value);
    }

    window.location.replace(`/bookings?${qs.toString()}`);
  }, []);

  return (
    <p className="p-6 text-sm text-zinc-500 dark:text-zinc-400">
      Redirigiendo al calendario…
    </p>
  );
}
