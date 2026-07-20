"use client";

import type { LucideIcon } from "lucide-react";

export type CatalogLogoThumbSize = "xs" | "sm" | "md";

const SIZE_CLASS: Record<CatalogLogoThumbSize, string> = {
  xs: "h-5 w-5",
  sm: "h-8 w-8",
  md: "h-10 w-10",
};

const ICON_CLASS: Record<CatalogLogoThumbSize, string> = {
  xs: "h-3 w-3",
  sm: "h-4 w-4",
  md: "h-5 w-5",
};

type CatalogLogoThumbProps = {
  src?: string | null;
  alt?: string;
  size?: CatalogLogoThumbSize;
  /** Shown only when there is no logo — never a letter initial. */
  fallbackIcon?: LucideIcon;
  className?: string;
};

/**
 * Catalog brand/logo thumbnail (ports, shipping lines, vessels).
 * Do not use for user avatars — use `EntityThumb` (letter initial) there.
 */
export default function CatalogLogoThumb({
  src,
  alt = "",
  size = "sm",
  fallbackIcon: FallbackIcon,
  className = "",
}: CatalogLogoThumbProps) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-md border border-zinc-200/80 bg-white dark:border-zinc-700 dark:bg-zinc-900 ${SIZE_CLASS[size]} ${className}`}
      aria-hidden={src ? undefined : true}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="h-full w-full object-contain p-0.5" />
      ) : FallbackIcon ? (
        <FallbackIcon
          className={`${ICON_CLASS[size]} text-zinc-400 dark:text-zinc-500`}
          strokeWidth={1.75}
        />
      ) : null}
    </span>
  );
}
