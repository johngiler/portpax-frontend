"use client";

import CatalogLogoThumb, {
  type CatalogLogoKind,
} from "@/components/ui/CatalogLogoThumb";

type ReportEntityLabelProps = {
  name: string;
  logo?: string | null;
  logoKind: CatalogLogoKind;
};

export default function ReportEntityLabel({
  name,
  logo,
  logoKind,
}: ReportEntityLabelProps) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <CatalogLogoThumb src={logo} alt={name} kind={logoKind} size="xs" />
      <span className="min-w-0 truncate font-medium">{name}</span>
    </div>
  );
}
