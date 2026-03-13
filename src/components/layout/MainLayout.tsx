/**
 * Layout principal: Header + Sidebar + contenido con transiciones.
 * El provider permite sincronizar sidebar izquierdo y panel de filtros.
 */
"use client";

import { ConfirmProvider } from "@/contexts/ConfirmContext";
import { MainLayoutProvider, useMainLayoutOptional } from "@/contexts/MainLayoutContext";
import Header from "./Header";
import MainWithFilterMargin from "./MainWithFilterMargin";
import PageTransition from "./PageTransition";
import Sidebar from "./Sidebar";
import FilterSidebar from "./FilterSidebar";

type MainLayoutProps = { children: React.ReactNode };

function LayoutContent({ children }: { children: React.ReactNode }) {
  const layout = useMainLayoutOptional();
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

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <ConfirmProvider>
      <MainLayoutProvider>
        <div className="flex h-screen w-full flex-col overflow-hidden bg-[var(--admin-gradient-bg)]">
          <Header />
          <LayoutContent>{children}</LayoutContent>
        </div>
      </MainLayoutProvider>
    </ConfirmProvider>
  );
}
