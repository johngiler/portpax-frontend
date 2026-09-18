"use client";

import CatalogLogoThumb from "@/components/ui/CatalogLogoThumb";

type ShippingLineCaptionProps = {
  name: string;
  /** Friendly corporate group — always shown when present (cards / summaries). */
  groupName?: string | null;
  logoUrl?: string | null;
  showLogo?: boolean;
  /** stacked (default): name then group below. inline: name · group. */
  layout?: "stacked" | "inline";
  className?: string;
  nameClassName?: string;
  groupClassName?: string;
};

/** Naviera label for cards: name + group (never slug/code as the subtitle). */
export default function ShippingLineCaption({
  name,
  groupName,
  logoUrl = null,
  showLogo = false,
  layout = "stacked",
  className = "",
  nameClassName = "truncate",
  groupClassName = "mt-0.5 truncate text-xs font-normal text-zinc-500 dark:text-zinc-400",
}: ShippingLineCaptionProps) {
  const group = groupName?.trim() || "";
  const showGroup = Boolean(group && group !== name.trim());

  if (layout === "inline") {
    return (
      <span className={["min-w-0 truncate", className].filter(Boolean).join(" ")}>
        {showLogo ? (
          <span className="mr-1.5 inline-flex align-middle">
            <CatalogLogoThumb
              src={logoUrl}
              alt=""
              size="xs"
              kind="shipping_line"
            />
          </span>
        ) : null}
        <span className={nameClassName}>{name}</span>
        {showGroup ? (
          <span className="text-zinc-400 dark:text-zinc-500">
            {" "}
            · {group}
          </span>
        ) : null}
      </span>
    );
  }

  return (
    <div className={["min-w-0", className].filter(Boolean).join(" ")}>
      <div className="flex min-w-0 items-center gap-2">
        {showLogo ? (
          <CatalogLogoThumb
            src={logoUrl}
            alt=""
            size="xs"
            kind="shipping_line"
          />
        ) : null}
        <span className={nameClassName}>{name}</span>
      </div>
      {showGroup ? <p className={groupClassName}>{group}</p> : null}
    </div>
  );
}

/** Compact text for titles / one-liners: `Naviera · Grupo`. */
export function shippingLineWithGroupLabel(
  name: string,
  groupName?: string | null,
): string {
  const n = name.trim();
  const g = groupName?.trim() || "";
  if (g && g !== n) return `${n} · ${g}`;
  return n;
}
