/**
 * Layout principal: Header + Sidebar + contenido con transiciones.
 * El provider permite sincronizar sidebar izquierdo y panel de filtros.
 */
"use client";

import { AppUpdateProvider } from "@/contexts/AppUpdateContext";
import { ConfirmProvider } from "@/contexts/ConfirmContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { MainLayoutProvider, useMainLayoutOptional } from "@/contexts/MainLayoutContext";
import AppUpdateBanner from "./AppUpdateBanner";
import Header from "./Header";
import MainWithFilterMargin from "./MainWithFilterMargin";
import MobileBottomNav from "./MobileBottomNav";
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
      {hasFilterSidebar ? (
        <FilterSidebar>{layout!.filterContent}</FilterSidebar>
      ) : null}
    </div>
  );
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <ConfirmProvider>
      <AppUpdateProvider>
        <NotificationProvider>
          <MainLayoutProvider>
            <div className="flex h-screen w-full flex-col overflow-hidden bg-[var(--admin-gradient-bg)]">
              <Header />
              <LayoutContent>{children}</LayoutContent>
              <MobileBottomNav />
              <AppUpdateBanner />
            </div>
          </MainLayoutProvider>
        </NotificationProvider>
      </AppUpdateProvider>
    </ConfirmProvider>
  );
}
