/**
 * Layout del admin: Header + Sidebar + contenido con transiciones.
 * El provider permite sincronizar sidebar izquierdo y panel de filtros.
 */
"use client";

import { AdminLayoutProvider, useAdminLayoutOptional } from "@/contexts/AdminLayoutContext";
import Header from "./Header";
import MainWithFilterMargin from "./MainWithFilterMargin";
import PageTransition from "./PageTransition";
import Sidebar from "./Sidebar";
import FilterSidebar from "./FilterSidebar";

type AdminLayoutProps = { children: React.ReactNode };

function LayoutContent({ children }: { children: React.ReactNode }) {
  const layout = useAdminLayoutOptional();
  const hasFilterSidebar = layout?.filterContent != null;

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 overflow-hidden">
      <Sidebar />
      <MainWithFilterMargin>
        <PageTransition>{children}</PageTransition>
      </MainWithFilterMargin>
      {hasFilterSidebar && <FilterSidebar>{layout!.filterContent}</FilterSidebar>}
    </div>
  );
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <AdminLayoutProvider>
      <div className="flex h-screen w-full flex-col overflow-hidden bg-[var(--admin-gradient-bg)]">
        <Header />
        <LayoutContent>{children}</LayoutContent>
      </div>
    </AdminLayoutProvider>
  );
}
