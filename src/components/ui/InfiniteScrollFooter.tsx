"use client";

import { Loader2 } from "lucide-react";
import type { RefObject } from "react";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";

type InfiniteScrollFooterProps = {
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void | Promise<void>;
  loadedCount: number;
  totalCount: number;
  /** Plural noun for the count hint, e.g. "puertos". */
  itemLabel: string;
  disabled?: boolean;
  className?: string;
  /** Nested scroll panel — loads only when scrolling inside this element. */
  scrollRootRef?: RefObject<Element | null>;
  rootMargin?: string;
};

/**
 * Bottom sentinel + loading indicator for grid/list infinite scroll.
 * Prefetches before the fold; pass `scrollRootRef` for card-scoped scroll.
 */
export default function InfiniteScrollFooter({
  hasMore,
  loading,
  onLoadMore,
  loadedCount,
  totalCount,
  itemLabel,
  disabled = false,
  className = "",
  scrollRootRef,
  rootMargin,
}: InfiniteScrollFooterProps) {
  const sentinelRef = useInfiniteScroll({
    hasMore,
    loading,
    onLoadMore,
    disabled,
    scrollRootRef,
    rootMargin,
  });

  if (totalCount <= 0) return null;

  return (
    <div
      className={[
        "mt-6 flex flex-col items-center gap-3 px-2 pb-2 sm:mt-8 sm:pb-4",
        className,
      ].join(" ")}
    >
      {hasMore ? (
        <div
          ref={sentinelRef}
          className="flex min-h-12 w-full max-w-sm flex-col items-center justify-center gap-2"
          aria-hidden={!loading}
        >
          {loading ? (
            <span className="inline-flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Cargando…
            </span>
          ) : (
            <span className="h-1 w-8 rounded-full bg-zinc-200/80 dark:bg-zinc-700/60" />
          )}
        </div>
      ) : null}

      <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
        {loadedCount} de {totalCount} {itemLabel}
      </p>

      <div
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      >
        {loading
          ? `Cargando más ${itemLabel}`
          : hasMore
            ? `${loadedCount} de ${totalCount} ${itemLabel} cargados`
            : `Todos los ${itemLabel} cargados: ${totalCount}`}
      </div>
    </div>
  );
}
