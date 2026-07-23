"use client";

import { useEffect, useRef, type RefObject } from "react";

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
  /** Prefetch before the sentinel reaches the fold. */
  rootMargin?: string;
  disabled?: boolean;
  /**
   * Force a scroll container (e.g. card panel). When set, page/body scroll
   * does not trigger loads — only scrolling inside this element.
   */
  scrollRootRef?: RefObject<Element | null>;
};

/**
 * Observes a sentinel at the end of a list. Prefer `scrollRootRef` for
 * nested panels so page scroll does not trigger loads.
 */
export function useInfiniteScroll({
  hasMore,
  loading,
  onLoadMore,
  rootMargin = "160px 0px",
  disabled = false,
  scrollRootRef,
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

    const scrollRoot =
      scrollRootRef?.current ?? getScrollParent(sentinel) ?? null;

    // Nested panel: fill until content overflows the box, then observe scroll.
    if (scrollRootRef && scrollRoot) {
      const canScroll = scrollRoot.scrollHeight > scrollRoot.clientHeight + 4;
      if (!canScroll) {
        if (inFlightRef.current) return;
        inFlightRef.current = true;
        void Promise.resolve(onLoadMoreRef.current());
        return;
      }
    }

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
  }, [hasMore, loading, disabled, rootMargin, scrollRootRef]);

  return sentinelRef;
}
