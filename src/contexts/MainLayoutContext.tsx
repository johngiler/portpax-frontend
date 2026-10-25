"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import {
  HEADER_MOBILE_FILTERS_ID,
  MOBILE_FILTER_DRAWER_ID,
} from "@/components/layout/filterSidebarIds";
import {
  COMPACT_LAYOUT_BREAKPOINT_PX,
  useAppScrollMemory,
} from "@/lib/inAppNav";

type MainLayoutContextValue = {
  filterOpen: boolean;
  setFilterOpen: (open: boolean) => void;
  filterContent: React.ReactNode | null;
  setFilterContent: (content: React.ReactNode | null) => void;
  /** En móvil: sidebar izquierdo abierto/cerrado por hamburger. */
  sidebarMobileOpen: boolean;
  setSidebarMobileOpen: (open: boolean) => void;
  isMobile: boolean;
};

const MainLayoutContext = createContext<MainLayoutContextValue | null>(null);

/**
 * Stable setter only — views can close the filter panel without subscribing to
 * filterContent (which would re-render the view and loop FilterSidebarContent).
 */
const SetFilterOpenContext = createContext<
  ((open: boolean) => void) | null
>(null);

export function MainLayoutProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterContent, setFilterContent] = useState<React.ReactNode | null>(
    null,
  );
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  useAppScrollMemory();

  useEffect(() => {
    const mq = window.matchMedia(
      `(max-width: ${COMPACT_LAYOUT_BREAKPOINT_PX - 1}px)`,
    );
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const setFilterOpenSafe = useCallback((next: boolean) => {
    if (!next && typeof document !== "undefined") {
      const active = document.activeElement;
      const drawer = document.getElementById(MOBILE_FILTER_DRAWER_ID);
      // Blur before aria-hidden/inert so the browser does not warn.
      if (active instanceof HTMLElement && drawer?.contains(active)) {
        active.blur();
        setFilterOpen(false);
        requestAnimationFrame(() => {
          document.getElementById(HEADER_MOBILE_FILTERS_ID)?.focus();
        });
        return;
      }
    }
    setFilterOpen(next);
  }, []);

  // Close mobile overlays on navigation (desktop filter rail stays as-is).
  useEffect(() => {
    setSidebarMobileOpen(false);
    if (
      typeof window !== "undefined" &&
      window.innerWidth < COMPACT_LAYOUT_BREAKPOINT_PX
    ) {
      setFilterOpenSafe(false);
    }
  }, [pathname, setFilterOpenSafe]);

  const value = useMemo<MainLayoutContextValue>(
    () => ({
      filterOpen,
      setFilterOpen: setFilterOpenSafe,
      filterContent,
      setFilterContent,
      sidebarMobileOpen,
      setSidebarMobileOpen,
      isMobile,
    }),
    [filterOpen, filterContent, sidebarMobileOpen, isMobile, setFilterOpenSafe],
  );

  return (
    <SetFilterOpenContext.Provider value={setFilterOpenSafe}>
      <MainLayoutContext.Provider value={value}>
        {children}
      </MainLayoutContext.Provider>
    </SetFilterOpenContext.Provider>
  );
}

export function useMainLayout() {
  const ctx = useContext(MainLayoutContext);
  if (!ctx) {
    throw new Error("useMainLayout must be used within MainLayoutProvider");
  }
  return ctx;
}

export function useMainLayoutOptional() {
  return useContext(MainLayoutContext);
}

/** Close/open filter sidebar without re-rendering on filterContent updates. */
export function useSetFilterOpen(): ((open: boolean) => void) | null {
  return useContext(SetFilterOpenContext);
}
