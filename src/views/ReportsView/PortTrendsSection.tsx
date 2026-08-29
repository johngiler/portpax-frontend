"use client";

import { Fragment, useRef, type ReactNode, type RefObject } from "react";
import ViewSection from "@/components/layout/ViewSection";
import InfiniteScrollFooter from "@/components/ui/InfiniteScrollFooter";
import CatalogLogoThumb from "@/components/ui/CatalogLogoThumb";
import ReportEntityLabel from "@/components/reports/ReportEntityLabel";
import {
  formatGrowthPct,
  formatMatrixValue,
  reportMatrix,
  reportViewSectionBody,
} from "@/components/reports/reportMatrixStyles";
import { TrendingUp } from "lucide-react";
import type { PortTrendsReport } from "@/services/bookings/bookingService";
import ReportsEmptyState from "./ReportsEmptyState";

type PaginationProps = {
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  loadedCount: number;
  totalCount: number;
};

type Props = PaginationProps & {
  data: PortTrendsReport;
  hasActiveFilters: boolean;
  onClearFilters?: () => void;
};

function PortContextHeader({ port }: { port: PortTrendsReport["port"] }) {
  return (
    <div className={reportMatrix.sectionGroupHeader}>
      <CatalogLogoThumb
        src={port.logo}
        alt={port.name}
        kind="port"
        size="md"
      />
      <div className="min-w-0">
        <p className={reportMatrix.sectionGroupKicker}>Puerto</p>
        <p className={reportMatrix.sectionGroupTitle}>{port.name}</p>
      </div>
    </div>
  );
}

type TrendsPaginatedPanelProps = PaginationProps & {
  scrollRootRef: RefObject<HTMLDivElement | null>;
  children: ReactNode;
};

function TrendsPaginatedPanel({
  scrollRootRef,
  hasMore,
  loadingMore,
  onLoadMore,
  loadedCount,
  totalCount,
  children,
}: TrendsPaginatedPanelProps) {
  return (
    <div ref={scrollRootRef} className={reportMatrix.scrollPanel}>
      <div className={reportMatrix.scroll}>{children}</div>
      <InfiniteScrollFooter
        hasMore={hasMore}
        loading={loadingMore}
        onLoadMore={onLoadMore}
        loadedCount={loadedCount}
        totalCount={totalCount}
        itemLabel="navieras"
        scrollRootRef={scrollRootRef}
        rootMargin="120px 0px"
        className="mt-0 border-t border-zinc-200/80 py-3 dark:border-zinc-800"
      />
    </div>
  );
}

export default function PortTrendsSection({
  data,
  hasActiveFilters,
  onClearFilters,
  hasMore,
  loadingMore,
  onLoadMore,
  loadedCount,
  totalCount,
}: Props) {
  const trendsScrollRef = useRef<HTMLDivElement>(null);
  const growthScrollRef = useRef<HTMLDivElement>(null);

  const pagination: PaginationProps = {
    hasMore,
    loadingMore,
    onLoadMore,
    loadedCount,
    totalCount,
  };

  if (totalCount === 0) {
    return (
      <ReportsEmptyState
        variant={hasActiveFilters ? "filtered" : "empty"}
        onClearFilters={onClearFilters}
      />
    );
  }

  return (
    <div className="space-y-4">
      <ViewSection
        icon={TrendingUp}
        title={data.title}
        description={
          data.without_lta
            ? `${data.note} Excluye LTA / CL / LTD.`
            : data.note
        }
        bodyClassName={reportViewSectionBody}
      >
        <div className={reportMatrix.sectionGroup}>
          <PortContextHeader port={data.port} />
          <div className={reportMatrix.sectionGroupBody}>
            <div className={reportMatrix.shellNested}>
              <div className="border-b border-zinc-200/70 bg-zinc-50/50 px-4 py-2.5 text-sm font-semibold text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-100">
                Trends por naviera
              </div>
              <TrendsPaginatedPanel
                scrollRootRef={trendsScrollRef}
                {...pagination}
              >
                <table className={reportMatrix.table}>
                  <thead>
                    <tr>
                      <th className={reportMatrix.cornerHeader} rowSpan={2}>
                        Naviera
                      </th>
                      {data.years.map((year) => (
                        <th
                          key={year}
                          className={reportMatrix.monthHeader}
                          colSpan={2}
                        >
                          {year}
                        </th>
                      ))}
                      <th className={reportMatrix.totalHeader} colSpan={2}>
                        Total
                      </th>
                    </tr>
                    <tr>
                      {data.years.map((year) => (
                        <Fragment key={`sub-${year}`}>
                          <th className={reportMatrix.subHeader}>Ships</th>
                          <th className={reportMatrix.subHeader}>PAX</th>
                        </Fragment>
                      ))}
                      <th className={reportMatrix.totalHeader}>Ships</th>
                      <th className={reportMatrix.totalHeader}>PAX</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.lines.map((line, idx) => (
                      <tr key={line.shipping_line_id}>
                        <td
                          className={
                            idx % 2 === 0
                              ? reportMatrix.rowLabel
                              : reportMatrix.rowLabelAlt
                          }
                        >
                          <ReportEntityLabel
                            name={line.name}
                            logo={line.logo}
                            logoKind="shipping_line"
                          />
                        </td>
                        {line.by_year.map((cell) => (
                          <Fragment key={`${line.shipping_line_id}-${cell.year}`}>
                            <td
                              className={
                                idx % 2 === 0
                                  ? reportMatrix.dataCell
                                  : reportMatrix.dataCellAlt
                              }
                            >
                              {formatMatrixValue(cell.ships)}
                            </td>
                            <td
                              className={
                                idx % 2 === 0
                                  ? reportMatrix.dataCell
                                  : reportMatrix.dataCellAlt
                              }
                            >
                              {formatMatrixValue(cell.pax, true)}
                            </td>
                          </Fragment>
                        ))}
                        <td className={reportMatrix.totalDataCell}>
                          {formatMatrixValue(line.total_ships)}
                        </td>
                        <td className={reportMatrix.totalDataCell}>
                          {formatMatrixValue(line.total_pax, true)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TrendsPaginatedPanel>
            </div>
          </div>
        </div>
      </ViewSection>

      <ViewSection
        icon={TrendingUp}
        title="Growth percentage"
        description="Variación interanual de PAX por naviera."
        bodyClassName={reportViewSectionBody}
      >
        <div className={reportMatrix.sectionGroup}>
          <PortContextHeader port={data.port} />
          <div className={reportMatrix.sectionGroupBody}>
            <div className={reportMatrix.shellNested}>
              <TrendsPaginatedPanel
                scrollRootRef={growthScrollRef}
                {...pagination}
              >
                <table className={reportMatrix.table}>
                  <thead>
                    <tr>
                      <th className={reportMatrix.cornerHeader}>Naviera</th>
                      {data.years.map((year) => (
                        <th key={year} className={reportMatrix.monthHeader}>
                          {year}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.lines.map((line, idx) => (
                      <tr key={`growth-${line.shipping_line_id}`}>
                        <td
                          className={
                            idx % 2 === 0
                              ? reportMatrix.rowLabel
                              : reportMatrix.rowLabelAlt
                          }
                        >
                          <ReportEntityLabel
                            name={line.name}
                            logo={line.logo}
                            logoKind="shipping_line"
                          />
                        </td>
                        {line.growth.map((cell) => {
                          const pct = cell.pct;
                          const tone =
                            pct == null
                              ? reportMatrix.growthNeutral
                              : pct > 0
                                ? reportMatrix.growthPositive
                                : pct < 0
                                  ? reportMatrix.growthNegative
                                  : reportMatrix.growthNeutral;
                          return (
                            <td
                              key={`${line.shipping_line_id}-g-${cell.year}`}
                              className={`${idx % 2 === 0 ? reportMatrix.dataCell : reportMatrix.dataCellAlt} ${tone}`}
                            >
                              {formatGrowthPct(pct)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TrendsPaginatedPanel>
            </div>
          </div>
        </div>
      </ViewSection>
    </div>
  );
}
