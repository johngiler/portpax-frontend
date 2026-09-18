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

function documentTitleForPath(pathname: string): string {
  const view = titleForPath(pathname);
  return view === "PortPax" ? "PortPax" : `PortPax | ${view}`;
}

/**
 * Sets `document.title` to `PortPax | {View}` from the current route.
 *
 * Next.js 16.3 soft navigation can drop `<title>` (empty tab) after our effect
 * runs; re-apply on head mutations and a short retry window.
 */
export default function DocumentTitle() {
  const pathname = usePathname() ?? "/";

  useEffect(() => {
    const desired = documentTitleForPath(pathname);

    function apply() {
      if (document.title !== desired) {
        document.title = desired;
      }
    }

    apply();

    const timers = [
      window.setTimeout(apply, 0),
      window.setTimeout(apply, 50),
      window.setTimeout(apply, 200),
    ];
    const raf = requestAnimationFrame(apply);

    const observer = new MutationObserver(apply);
    observer.observe(document.head, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      cancelAnimationFrame(raf);
      for (const id of timers) window.clearTimeout(id);
      observer.disconnect();
    };
  }, [pathname]);

  return null;
}
