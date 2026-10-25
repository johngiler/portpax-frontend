"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useAuthOptional } from "@/contexts/AuthContext";
import { canBrowseCatalogs } from "@/lib/navAccess";

const DEFAULT_LINK_CLASS =
  "text-inherit underline-offset-2 transition-colors hover:text-[var(--admin-accent)] hover:underline";

type CatalogEntityLinkProps = {
  href?: string | null;
  children: ReactNode;
  className?: string;
  fallbackClassName?: string;
  ariaLabel?: string;
  title?: string;
};

/**
 * Catalog shortcut (port / shipping line / vessel). Renders as a link only when
 * the current role may browse catalogs and a destination exists.
 */
export default function CatalogEntityLink({
  href,
  children,
  className,
  fallbackClassName,
  ariaLabel,
  title,
}: CatalogEntityLinkProps) {
  const auth = useAuthOptional();
  const dest = href?.trim() ?? "";
  const clickable = dest.length > 0 && canBrowseCatalogs(auth?.user?.role);

  if (!clickable) {
    if (fallbackClassName) {
      return <div className={fallbackClassName}>{children}</div>;
    }
    return <>{children}</>;
  }

  return (
    <Link
      href={dest}
      className={className ?? DEFAULT_LINK_CLASS}
      aria-label={ariaLabel}
      title={title ?? ariaLabel}
    >
      {children}
    </Link>
  );
}
