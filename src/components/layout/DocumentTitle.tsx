"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { NAV_SECTIONS } from "@/lib/navConfig";

const EXTRA_TITLES: { prefix: string; title: string }[] = [
  { prefix: "/login", title: "Iniciar sesión" },
  { prefix: "/profile", title: "Perfil" },
  { prefix: "/bookings/new", title: "Nueva reserva" },
  { prefix: "/bookings/detail", title: "Detalle de reserva" },
  { prefix: "/ports/detail", title: "Detalle de puerto" },
  { prefix: "/shipping-lines/detail", title: "Detalle de naviera" },
  { prefix: "/vessels", title: "Barcos" },
  { prefix: "/positions", title: "Posiciones" },
  { prefix: "/calendar", title: "Calendario" },
];

function titleForPath(pathname: string): string {
  const path = pathname || "/";

  for (const extra of EXTRA_TITLES) {
    if (path === extra.prefix || path.startsWith(`${extra.prefix}/`)) {
      return extra.title;
    }
  }

  for (const section of NAV_SECTIONS) {
    for (const item of section.items) {
      if (item.href === "/") {
        if (path === "/") return item.label;
        continue;
      }
      if (path === item.href || path.startsWith(`${item.href}/`)) {
        return item.label;
      }
    }
  }

  return "PortPax";
}

/** Sets `document.title` to `PortPax | {View}` from the current route. */
export default function DocumentTitle() {
  const pathname = usePathname() ?? "/";

  useEffect(() => {
    const view = titleForPath(pathname);
    document.title = view === "PortPax" ? "PortPax" : `PortPax | ${view}`;
  }, [pathname]);

  return null;
}
