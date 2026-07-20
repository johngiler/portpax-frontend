"use client";

import type { YoyBadge } from "./formatDashboardKpi";
import { YOY_TONE_CLASS } from "./formatDashboardKpi";

type DashboardYoyBadgeProps = {
  badge: YoyBadge;
};

export default function DashboardYoyBadge({ badge }: DashboardYoyBadgeProps) {
  return (
    <span
      className={`inline-flex max-w-full truncate rounded-md px-2 py-0.5 text-[11px] font-semibold tabular-nums ${YOY_TONE_CLASS[badge.tone]}`}
      title={badge.label}
    >
      {badge.label}
    </span>
  );
}
