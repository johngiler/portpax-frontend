"use client";

import { useEffect, useRef } from "react";

function getScrollParent(node: HTMLElement | null): Element | null {
  let parent = node?.parentElement ?? null;
  while (parent) {
    const { overflowY } = getComputedStyle(parent);
    if (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay") {
      return parent;
    }
    parent = parent.parentElement;
  }
  return null;
}

type UseInfiniteScrollOptions = {
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void | Promise<void>;
  /** Prefetch before the sentinel reaches the fold (mobile-friendly). */
  rootMargin?: string;
  disabled?: boolean;
};

/**
 * Observes a sentinel at the end of a list. Works with nested scroll
 * containers (e.g. main overflow-auto) and the viewport.
 */
export function useInfiniteScroll({
  hasMore,
  loading,
  onLoadMore,
  rootMargin = "320px 0px",
  disabled = false,
}: UseInfiniteScrollOptions) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const inFlightRef = useRef(false);
  const onLoadMoreRef = useRef(onLoadMore);

  useEffect(() => {
    onLoadMoreRef.current = onLoadMore;
  }, [onLoadMore]);

  useEffect(() => {
    if (!loading) inFlightRef.current = false;
  }, [loading]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || disabled || !hasMore || loading) return;

    const scrollRoot = getScrollParent(sentinel);
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        if (inFlightRef.current) return;
        inFlightRef.current = true;
        void Promise.resolve(onLoadMoreRef.current());
      },
      {
        root: scrollRoot,
        rootMargin,
        threshold: 0,
      },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading, disabled, rootMargin]);

  return sentinelRef;
}
