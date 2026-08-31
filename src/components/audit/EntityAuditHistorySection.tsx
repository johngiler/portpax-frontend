"use client";

import { ArrowRight, User } from "lucide-react";
import InfiniteScrollFooter from "@/components/ui/InfiniteScrollFooter";
import Skeleton from "@/components/ui/Skeleton";
import {
  auditEntityHint,
  auditFieldChangeLines,
} from "@/lib/auditChangeLines";
import { formatAuditActorDisplay } from "@/lib/auditActor";
import type { AuditHistoryRow } from "@/types/audit";

export const DETAIL_AUDIT_PAGE_SIZE = 12;

type EntityAuditHistorySectionProps = {
  rows: AuditHistoryRow[];
  resolveActionLabel: (action: string) => string;
  isLoading?: boolean;
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  loadedCount: number;
  totalCount: number;
  itemLabel?: string;
  className?: string;
};

function titlesMatch(summary: string, label: string, action: string): boolean {
  const normalized = summary.trim().toLowerCase();
  return (
    !normalized ||
    normalized === label.toLowerCase() ||
    normalized === action.toLowerCase()
  );
}

function ChangeChip({ label, text }: { label: string; text: string }) {
  const arrowSplit = text.includes(" → ");
  const [from, to] = arrowSplit ? text.split(" → ") : [null, text];

  return (
    <div className="w-fit max-w-full rounded-lg border border-zinc-200/80 bg-zinc-50/80 px-2.5 py-1.5 dark:border-zinc-700 dark:bg-zinc-950/50">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
        {label}
      </p>
      {arrowSplit && from != null ? (
        <p className="mt-0.5 flex flex-wrap items-center gap-1 text-xs text-zinc-700 dark:text-zinc-200">
          <span className="text-zinc-500 line-through decoration-zinc-300 dark:text-zinc-400">
            {from}
          </span>
          <ArrowRight
            className="h-3 w-3 shrink-0 text-zinc-400"
            strokeWidth={2}
            aria-hidden
          />
          <span className="font-medium text-zinc-900 dark:text-zinc-50">{to}</span>
        </p>
      ) : (
        <p className="mt-0.5 text-xs font-medium text-zinc-800 dark:text-zinc-100">
          {text}
        </p>
      )}
    </div>
  );
}

function AuditHistorySkeleton() {
  return (
    <div className="mt-5 space-y-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="rounded-xl border border-zinc-200/80 px-4 py-3 dark:border-zinc-800"
        >
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="mt-3 h-4 w-3/4 max-w-md rounded" />
          <Skeleton className="mt-3 h-8 w-full max-w-sm rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export default function EntityAuditHistorySection({
  rows,
  resolveActionLabel,
  isLoading = false,
  hasMore,
  loadingMore,
  onLoadMore,
  loadedCount,
  totalCount,
  itemLabel = "movimientos",
  className = "",
}: EntityAuditHistorySectionProps) {
  if (!isLoading && rows.length === 0) return null;

  return (
    <section
      className={`rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-[var(--admin-card-shadow)] dark:border-zinc-800 dark:bg-zinc-900/80 ${className}`.trim()}
    >
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        Historial
      </h2>

      {isLoading ? (
        <AuditHistorySkeleton />
      ) : (
        <>
          <ul className="mt-5 space-y-4">
            {rows.map((entry) => {
              const fieldLines = auditFieldChangeLines(entry.changes);
              const whereHint = auditEntityHint(entry.changes);
              const when = new Date(entry.occurredAt).toLocaleString("es-MX", {
                dateStyle: "medium",
                timeStyle: "short",
              });
              const who = formatAuditActorDisplay(entry.actorDisplay);
              const label = resolveActionLabel(entry.action);
              const summary = entry.summary?.trim() || "";
              const showSummary = Boolean(
                summary && !titlesMatch(summary, label, entry.action),
              );

              return (
                <li
                  key={entry.key}
                  className="rounded-xl border border-zinc-200/80 px-4 py-3 dark:border-zinc-800"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-sky-800 dark:bg-sky-900/40 dark:text-sky-200">
                      {label}
                    </span>
                    {showSummary ? (
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                        {summary}
                      </p>
                    ) : null}
                  </div>

                  {fieldLines.length > 0 ? (
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      {fieldLines.map((line) => (
                        <ChangeChip
                          key={line.field}
                          label={line.label}
                          text={line.text}
                        />
                      ))}
                    </div>
                  ) : null}

                  <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-zinc-100 pt-2 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                    <span className="inline-flex items-center gap-1">
                      <User className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      <span className="font-medium text-zinc-700 dark:text-zinc-200">
                        {who}
                      </span>
                    </span>
                    <span>{when}</span>
                    {whereHint ? (
                      <span className="min-w-0 truncate" title={whereHint}>
                        {whereHint}
                      </span>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>

          <InfiniteScrollFooter
            hasMore={hasMore}
            loading={loadingMore}
            onLoadMore={onLoadMore}
            loadedCount={loadedCount}
            totalCount={totalCount}
            itemLabel={itemLabel}
            className="mt-4 sm:mt-5"
          />
        </>
      )}
    </section>
  );
}
