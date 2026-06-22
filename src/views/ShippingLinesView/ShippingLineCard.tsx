"use client";

import Link from "next/link";
import { Anchor } from "lucide-react";
import type { ShippingLine } from "@/types/cruise";
import {
  shippingLineDetailHref,
  shippingLineDisplayName,
  shippingLineStatusLabel,
} from "@/types/cruise";

type ShippingLineCardProps = {
  line: ShippingLine;
};

export default function ShippingLineCard({ line }: ShippingLineCardProps) {
  const href = shippingLineDetailHref(line);

  return (
    <Link
      href={href}
      className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-[var(--admin-card-shadow)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--admin-accent)]/30 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900/80"
    >
      <div className="relative flex aspect-[5/4] items-center justify-center bg-gradient-to-br from-[var(--admin-accent)]/8 via-zinc-50 to-zinc-100 dark:from-[var(--admin-accent)]/15 dark:via-zinc-900 dark:to-zinc-950">
        {line.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={line.logo}
            alt=""
            className="max-h-[70%] max-w-[75%] object-contain transition-transform duration-200 group-hover:scale-105"
          />
        ) : (
          <span
            className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--admin-accent)]/10 text-[var(--admin-accent)] transition-transform duration-200 group-hover:scale-105"
          >
            <Anchor className="h-8 w-8" strokeWidth={1.75} />
          </span>
        )}
        <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-600 shadow-sm dark:bg-zinc-900/90 dark:text-zinc-300">
          {shippingLineStatusLabel(line.is_active)}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-0.5 p-3">
        <h3 className="line-clamp-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          {shippingLineDisplayName(line)}
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{line.group_name}</p>
        <p className="mt-auto pt-2 text-xs text-zinc-400">
          {line.vessel_count > 0
            ? `${line.vessel_count} barco${line.vessel_count === 1 ? "" : "s"}`
            : "Sin barcos"}
        </p>
      </div>
    </Link>
  );
}
