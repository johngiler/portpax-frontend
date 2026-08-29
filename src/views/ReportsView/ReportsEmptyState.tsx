"use client";

import { BarChart3 } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import {
  REPORTS_EMPTY_DESCRIPTION,
  REPORTS_EMPTY_TITLE,
  REPORTS_FILTERED_EMPTY_DESCRIPTION,
  REPORTS_FILTERED_EMPTY_TITLE,
  REPORTS_MISSING_PORT_CARRIER_DESCRIPTION,
  REPORTS_MISSING_PORT_TITLE,
  REPORTS_MISSING_PORT_TRENDS_DESCRIPTION,
} from "./reportsEmptyCopy";

export type ReportsEmptyVariant = "empty" | "filtered" | "missing_port_carrier" | "missing_port_trends";

type ReportsEmptyStateProps = {
  variant: ReportsEmptyVariant;
  onClearFilters?: () => void;
};

export default function ReportsEmptyState({
  variant,
  onClearFilters,
}: ReportsEmptyStateProps) {
  const isFiltered = variant === "filtered";
  const isMissingPort = variant.startsWith("missing_port");

  const title = isFiltered
    ? REPORTS_FILTERED_EMPTY_TITLE
    : isMissingPort
      ? REPORTS_MISSING_PORT_TITLE
      : REPORTS_EMPTY_TITLE;

  const description = isFiltered
    ? REPORTS_FILTERED_EMPTY_DESCRIPTION
    : variant === "missing_port_carrier"
      ? REPORTS_MISSING_PORT_CARRIER_DESCRIPTION
      : variant === "missing_port_trends"
        ? REPORTS_MISSING_PORT_TRENDS_DESCRIPTION
        : REPORTS_EMPTY_DESCRIPTION;

  return (
    <EmptyState
      icon={BarChart3}
      filtered={isFiltered}
      title={title}
      description={description}
      onClearFilters={isFiltered ? onClearFilters : undefined}
    />
  );
}
