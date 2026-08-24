"use client";

import DefaultButton from "@/components/buttons/DefaultButton";
import NoticeAlert from "@/components/ui/NoticeAlert";
import { formatIsoDateLabel } from "@/lib/bookingDates";

type FilteredResultsFromHintProps = {
  firstDate: string | null;
  /** When set, show a jump action (calendar / availability start). */
  onGoToDate?: (iso: string) => void;
  className?: string;
};

/** Warn that filters match bookings outside the current visual window. */
export default function FilteredResultsFromHint({
  firstDate,
  onGoToDate,
  className = "",
}: FilteredResultsFromHintProps) {
  if (!firstDate) return null;
  const label = formatIsoDateLabel(firstDate);
  return (
    <div className={`space-y-2 ${className}`.trim()}>
      <NoticeAlert
        variant="warning"
        messages={[
          `Hay resultados a partir del ${label}. No aparecen en esta vista actual.`,
        ]}
      />
      {onGoToDate ? (
        <div className="flex justify-end">
          <DefaultButton
            type="button"
            className="!px-3 !py-1.5 text-xs"
            onClick={() => onGoToDate(firstDate)}
          >
            Ir a {label}
          </DefaultButton>
        </div>
      ) : null}
    </div>
  );
}
