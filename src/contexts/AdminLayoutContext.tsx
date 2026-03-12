"use client";

import { createContext, useContext, useState } from "react";

type AdminLayoutContextValue = {
  filterOpen: boolean;
  setFilterOpen: (open: boolean) => void;
  /** Contenido del panel de filtros (lo inyecta la página que tiene filtros). */
  filterContent: React.ReactNode | null;
  setFilterContent: (content: React.ReactNode | null) => void;
};

const AdminLayoutContext = createContext<AdminLayoutContextValue | null>(null);

export function AdminLayoutProvider({ children }: { children: React.ReactNode }) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterContent, setFilterContent] = useState<React.ReactNode | null>(null);

  const value: AdminLayoutContextValue = {
    filterOpen,
    setFilterOpen,
    filterContent,
    setFilterContent,
  };

  return (
    <AdminLayoutContext.Provider value={value}>
      {children}
    </AdminLayoutContext.Provider>
  );
}

export function useAdminLayout() {
  const ctx = useContext(AdminLayoutContext);
  if (!ctx) throw new Error("useAdminLayout must be used within AdminLayoutProvider");
  return ctx;
}

export function useAdminLayoutOptional() {
  return useContext(AdminLayoutContext);
}
