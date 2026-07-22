"use client";

import InfoTooltip from "@/components/ui/InfoTooltip";
import type { UserRole } from "@/types/accounts";
import { userRoleDescription, userRoleLabel } from "@/types/accounts";

type RoleLabelWithInfoProps = {
  role: UserRole | null | undefined;
  className?: string;
};

export default function RoleLabelWithInfo({
  role,
  className = "",
}: RoleLabelWithInfoProps) {
  const label = userRoleLabel(role);
  const description = userRoleDescription(role);

  return (
    <span className={`inline-flex max-w-full items-center gap-1.5 ${className}`}>
      <span className="truncate">{label}</span>
      <InfoTooltip content={description} label={label} />
    </span>
  );
}
