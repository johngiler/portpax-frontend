"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
  useSyncExternalStore,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { sanitizeReturnTo } from "@/lib/safeReturnTo";

/** Matches sidebar / layout compact mode (`max-width: 767px`). */
export const COMPACT_LAYOUT_BREAKPOINT_PX = 768;

const SCROLL_PREFIX = "portpax:scroll:";
const CAN_BACK_KEY = "portpax:canBack";
export const APP_SCROLL_ATTR = "data-app-scroll";

export type InAppLinkTargetProps =
  | Record<string, never>
  | { target: "_blank"; rel: "noopener noreferrer" };

function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  if (window.matchMedia("(display-mode: fullscreen)").matches) return true;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return Boolean(nav.standalone);
}

function isLikelyWebView(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent || "";
  if (/\bwv\b/.test(ua) || /; wv\)/.test(ua)) return true;
  if (/iPhone|iPad|iPod/.test(ua) && !/Safari/.test(ua)) return true;
  return false;
}

/**
 * Same-tab in-app navigation: compact viewport, installed PWA, or WebView.
 * Default true until measured so mobile/WebView never flashes `_blank`.
 */
export function prefersSameTabNav(): boolean {
  if (typeof window === "undefined") return true;
  if (
    window.matchMedia(
      `(max-width: ${COMPACT_LAYOUT_BREAKPOINT_PX - 1}px)`,
    ).matches
  ) {
    return true;
  }
  return isStandaloneDisplay() || isLikelyWebView();
}

const COMPACT_MQ = `(max-width: ${COMPACT_LAYOUT_BREAKPOINT_PX - 1}px)`;

function subscribeCompact(onChange: () => void): () => void {
  const mq = window.matchMedia(COMPACT_MQ);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function compactSnapshot(): boolean {
  return window.matchMedia(COMPACT_MQ).matches;
}

/** Viewport compact layout (`< 768px`). SSR assumes compact to avoid a table flash on phones. */
export function useCompactLayout(): boolean {
  return useSyncExternalStore(subscribeCompact, compactSnapshot, () => true);
}

export function useSameTabNav(): boolean {
  const [sameTab, setSameTab] = useState(true);

  useEffect(() => {
    const mqCompact = window.matchMedia(
      `(max-width: ${COMPACT_LAYOUT_BREAKPOINT_PX - 1}px)`,
    );
    const mqStand = window.matchMedia("(display-mode: standalone)");
    const mqFull = window.matchMedia("(display-mode: fullscreen)");
    const sync = () => setSameTab(prefersSameTabNav());
    sync();
    mqCompact.addEventListener("change", sync);
    mqStand.addEventListener("change", sync);
    mqFull.addEventListener("change", sync);
    return () => {
      mqCompact.removeEventListener("change", sync);
      mqStand.removeEventListener("change", sync);
      mqFull.removeEventListener("change", sync);
    };
  }, []);

  return sameTab;
}

export function inAppLinkProps(sameTab: boolean): InAppLinkTargetProps {
  if (sameTab) return {};
  return { target: "_blank", rel: "noopener noreferrer" };
}

export function useInAppLinkProps(): InAppLinkTargetProps {
  return inAppLinkProps(useSameTabNav());
}

/** Current path + query without `useSearchParams` (safe in Header / layout). */
export function livePathKey(): string {
  if (typeof window === "undefined") return "/";
  const path = window.location.pathname;
  const q = window.location.search.replace(/^\?/, "");
  return q ? `${path}?${q}` : path;
}

export function useCurrentReturnTo(): string {
  const pathname = usePathname() ?? "/";
  const [search, setSearch] = useState("");

  useLayoutEffect(() => {
    setSearch(window.location.search.replace(/^\?/, ""));
  }, [pathname]);

  return search ? `${pathname}?${search}` : pathname;
}

type ScrollBox = { id: string; top: number; left: number };

type ScrollSnapshot = {
  windowY: number;
  boxes: ScrollBox[];
};

function readSnapshot(pathKey: string): ScrollSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SCROLL_PREFIX + pathKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ScrollSnapshot;
    if (!parsed || !Array.isArray(parsed.boxes)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeSnapshot(pathKey: string, snap: ScrollSnapshot): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(SCROLL_PREFIX + pathKey, JSON.stringify(snap));
  } catch {
    /* quota / private mode */
  }
}

export function captureAppScroll(pathKey: string): void {
  if (typeof window === "undefined" || !pathKey) return;
  const boxes: ScrollBox[] = [];
  document.querySelectorAll(`[${APP_SCROLL_ATTR}]`).forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    const id = node.getAttribute(APP_SCROLL_ATTR) || "";
    if (!id) return;
    boxes.push({ id, top: node.scrollTop, left: node.scrollLeft });
  });
  writeSnapshot(pathKey, { windowY: window.scrollY, boxes });
}

function applySnapshot(snap: ScrollSnapshot): void {
  window.scrollTo(0, snap.windowY);
  for (const box of snap.boxes) {
    const el = document.querySelector(
      `[${APP_SCROLL_ATTR}="${CSS.escape(box.id)}"]`,
    );
    if (el instanceof HTMLElement) {
      el.scrollTop = box.top;
      el.scrollLeft = box.left;
    }
  }
}

export function restoreAppScroll(pathKey: string): void {
  const snap = readSnapshot(pathKey);
  if (!snap) return;
  applySnapshot(snap);
}

export function markCanBack(originPath: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(CAN_BACK_KEY, originPath);
  } catch {
    /* ignore */
  }
}

export function peekCanBack(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(CAN_BACK_KEY);
  } catch {
    return null;
  }
}

export function clearCanBack(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(CAN_BACK_KEY);
  } catch {
    /* ignore */
  }
}

function pathsAlign(stored: string, fallback: string): boolean {
  const a = sanitizeReturnTo(stored);
  const b = sanitizeReturnTo(fallback);
  if (!a || !b) return false;
  if (a === b) return true;
  return a.split("?")[0] === b.split("?")[0];
}

/** True when Volver can use history.back() instead of pushing returnTo. */
export function shouldHistoryBack(fallbackHref: string): boolean {
  const origin = peekCanBack();
  if (!origin) return false;
  return pathsAlign(origin, fallbackHref);
}

export function consumeHistoryBack(fallbackHref: string): boolean {
  if (!shouldHistoryBack(fallbackHref)) return false;
  clearCanBack();
  return true;
}

function isModifiedClick(event: MouseEvent): boolean {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

function isSameTabAnchor(anchor: HTMLAnchorElement): boolean {
  if (anchor.target === "_blank" || anchor.hasAttribute("download")) {
    return false;
  }
  const href = anchor.getAttribute("href");
  if (!href || href.startsWith("#") || href.startsWith("mailto:")) return false;
  return true;
}

/**
 * Persist overflow/window scroll across same-tab in-app navigation and restore
 * it when the origin path remounts (Volver / WebView back).
 */
export function useAppScrollMemory(): void {
  const pathname = usePathname() ?? "/";

  useEffect(() => {
    const nav = performance.getEntriesByType("navigation")[0] as
      | PerformanceNavigationTiming
      | undefined;
    if (nav?.type === "reload") clearCanBack();
  }, []);

  useEffect(() => {
    const snap = readSnapshot(livePathKey());
    if (!snap) return;
    let cancelled = false;
    let tries = 0;
    const maxTries = 24;
    const tick = () => {
      if (cancelled) return;
      applySnapshot(snap);
      tries += 1;
      if (tries < maxTries) timer = window.setTimeout(tick, 50);
    };
    let timer = window.setTimeout(tick, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [pathname]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || isModifiedClick(event)) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (!isSameTabAnchor(anchor)) return;
      const origin = livePathKey();
      captureAppScroll(origin);
      const href = anchor.getAttribute("href") || "";
      if (prefersSameTabNav() && href.startsWith("/") && !href.startsWith("//")) {
        markCanBack(origin);
      }
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);
}

export function useOpenInApp(): (href: string) => void {
  const sameTab = useSameTabNav();
  const router = useRouter();

  return useCallback(
    (href: string) => {
      const origin = livePathKey();
      captureAppScroll(origin);
      if (sameTab) {
        markCanBack(origin);
        router.push(href);
        return;
      }
      window.open(href, "_blank", "noopener,noreferrer");
    },
    [router, sameTab],
  );
}
