"use client";

import { createContext, useContext, useState } from "react";

type MainLayoutContextValue = {
  filterOpen: boolean;
  setFilterOpen: (open: boolean) => void;
  /** Contenido del panel de filtros (lo inyecta la vista que tiene filtros). */
  filterContent: React.ReactNode | null;
  setFilterContent: (content: React.ReactNode | null) => void;
};

const MainLayoutContext = createContext<MainLayoutContextValue | null>(null);

export function MainLayoutProvider({ children }: { children: React.ReactNode }) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterContent, setFilterContent] = useState<React.ReactNode | null>(null);

  const value: MainLayoutContextValue = {
    filterOpen,
    setFilterOpen,
    filterContent,
    setFilterContent,
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
