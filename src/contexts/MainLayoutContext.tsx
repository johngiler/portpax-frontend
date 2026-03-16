"use client";

import { createContext, useContext, useEffect, useState } from "react";

const SIDEBAR_MOBILE_BREAKPOINT = 768;

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

export function MainLayoutProvider({ children }: { children: React.ReactNode }) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterContent, setFilterContent] = useState<React.ReactNode | null>(null);
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${SIDEBAR_MOBILE_BREAKPOINT - 1}px)`);
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const value: MainLayoutContextValue = {
    filterOpen,
    setFilterOpen,
    filterContent,
    setFilterContent,
    sidebarMobileOpen,
    setSidebarMobileOpen,
    isMobile,
  };

  return (
    <MainLayoutContext.Provider value={value}>
      {children}
    </MainLayoutContext.Provider>
  );
}

export function useMainLayout() {
  const ctx = useContext(MainLayoutContext);
  if (!ctx) throw new Error("useMainLayout must be used within MainLayoutProvider");
  return ctx;
}

export function useMainLayoutOptional() {
  return useContext(MainLayoutContext);
}
