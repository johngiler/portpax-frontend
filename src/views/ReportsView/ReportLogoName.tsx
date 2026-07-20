"use client";

import CatalogLogoThumb, {
  type CatalogLogoKind,
} from "@/components/ui/CatalogLogoThumb";

type ReportLogoNameProps = {
  name: string;
  logo: string | null;
  /** Port / shipping line / vessel empty-state icon (never a letter initial). */
  kind?: CatalogLogoKind;
};

/** Name cell with catalog logo — no letter initials (avatars only). */
export default function ReportLogoName({
  name,
  logo,
  kind = "shipping_line",
}: ReportLogoNameProps) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <CatalogLogoThumb src={logo} alt="" size="sm" kind={kind} />
      <span className="truncate font-medium text-zinc-900 dark:text-zinc-50">{name}</span>
    </div>
  );
}
