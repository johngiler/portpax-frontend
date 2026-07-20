"use client";

import type { LucideIcon } from "lucide-react";
import { Anchor, MapPin } from "lucide-react";
import CatalogLogoThumb from "@/components/ui/CatalogLogoThumb";

type ReportLogoNameProps = {
  name: string;
  logo: string | null;
  /** Port vs shipping line empty-state icon (never a letter initial). */
  kind?: "port" | "shipping_line";
};

const FALLBACK: Record<"port" | "shipping_line", LucideIcon> = {
  port: MapPin,
  shipping_line: Anchor,
};

/** Name cell with catalog logo — no letter initials (avatars only). */
export default function ReportLogoName({
  name,
  logo,
  kind = "shipping_line",
}: ReportLogoNameProps) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <CatalogLogoThumb
        src={logo}
        alt=""
        size="sm"
        fallbackIcon={FALLBACK[kind]}
      />
      <span className="truncate font-medium text-zinc-900 dark:text-zinc-50">{name}</span>
    </div>
  );
}
