"use client";

import {
  Fragment,
  useCallback,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
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
import { ChevronDown, ChevronRight, TrendingUp } from "lucide-react";
import type {
  PortTrendsGroup,
  PortTrendsMetricRow,
  PortTrendsReport,
} from "@/services/bookings/bookingService";
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
        itemLabel="grupos"
        scrollRootRef={scrollRootRef}
        rootMargin="120px 0px"
        className="mt-0 border-t border-zinc-200/80 py-3 dark:border-zinc-800"
      />
    </div>
  );
}

function labelClass(
  alt: boolean,
  nested = false,
  total = false,
): string {
  if (total) return reportMatrix.totalRowLabel;
  if (nested) {
    return alt ? reportMatrix.nestedRowLabelAlt : reportMatrix.nestedRowLabel;
  }
  return alt ? reportMatrix.groupRowLabelAlt : reportMatrix.groupRowLabel;
}

function dataClass(
  alt: boolean,
  nested = false,
  total = false,
): string {
  if (total) return reportMatrix.totalDataCell;
  if (nested) {
    return alt ? reportMatrix.nestedDataCellAlt : reportMatrix.nestedDataCell;
  }
  return alt ? reportMatrix.groupDataCellAlt : reportMatrix.groupDataCell;
}

function TrendsShipsCells({
  row,
  alt,
  nested = false,
  total = false,
}: {
  row: PortTrendsMetricRow;
  alt: boolean;
  nested?: boolean;
  total?: boolean;
}) {
  return (
    <>
      {row.by_year.map((cell) => (
        <Fragment key={`y-${cell.year}`}>
          <td className={dataClass(alt, nested, total)}>
            {formatMatrixValue(cell.ships)}
          </td>
          <td className={dataClass(alt, nested, total)}>
            {formatMatrixValue(cell.pax, true)}
          </td>
        </Fragment>
      ))}
      <td
        className={
          nested ? dataClass(alt, true) : reportMatrix.totalDataCell
        }
      >
        {formatMatrixValue(row.total_ships)}
      </td>
      <td
        className={
          nested ? dataClass(alt, true) : reportMatrix.totalDataCell
        }
      >
        {formatMatrixValue(row.total_pax, true)}
      </td>
    </>
  );
}

function GrowthCells({
  row,
  alt,
  nested = false,
  total = false,
}: {
  row: PortTrendsMetricRow;
  alt: boolean;
  nested?: boolean;
  total?: boolean;
}) {
  return (
    <>
      {row.growth.map((cell) => {
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
            key={`g-${cell.year}`}
            className={`${dataClass(alt, nested, total)} ${tone}`}
          >
            {formatGrowthPct(pct)}
          </td>
        );
      })}
    </>
  );
}

function GroupNameCell({
  expanded,
  onToggle,
  name,
  alt,
}: {
  expanded: boolean;
  onToggle: () => void;
  name: string;
  alt: boolean;
}) {
  return (
    <td className={`${labelClass(alt)} !p-0`}>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full min-w-0 cursor-pointer items-center gap-1.5 px-2.5 py-1.5 text-left transition hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60"
        aria-expanded={expanded}
        aria-label={expanded ? `Contraer ${name}` : `Expandir ${name}`}
        title={expanded ? "Contraer" : "Desglosar navieras"}
      >
        <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center text-zinc-500">
          {expanded ? (
            <ChevronDown className="h-4 w-4" strokeWidth={2} />
          ) : (
            <ChevronRight className="h-4 w-4" strokeWidth={2} />
          )}
        </span>
        <ReportEntityLabel name={name} logo={null} logoKind="shipping_line" />
      </button>
    </td>
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
  const [expandedIds, setExpandedIds] = useState<Set<number>>(() => new Set());

  const pagination: PaginationProps = {
    hasMore,
    loadingMore,
    onLoadMore,
    loadedCount,
    totalCount,
  };

  const toggleGroup = useCallback((groupId: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }, []);

  const groups = data.groups ?? [];
  const totals = data.totals;
  const hasRows = groups.length > 0;

  const groupAlt = useMemo(() => {
    const map = new Map<number, boolean>();
    groups.forEach((group, index) => {
      map.set(group.shipping_line_group_id, index % 2 === 1);
    });
    return map;
  }, [groups]);

  if (totalCount === 0 && !hasRows) {
    return (
      <ReportsEmptyState
        variant={hasActiveFilters ? "filtered" : "empty"}
        onClearFilters={onClearFilters}
      />
    );
  }

  function renderGroupBlock(group: PortTrendsGroup, mode: "ships" | "growth") {
    const gid = group.shipping_line_group_id;
    const expanded = expandedIds.has(gid);
    const gAlt = groupAlt.get(gid) ?? false;

    return (
      <Fragment key={`${mode}-${gid}`}>
        <tr>
          <GroupNameCell
            expanded={expanded}
            onToggle={() => toggleGroup(gid)}
            name={group.name}
            alt={gAlt}
          />
          {mode === "ships" ? (
            <TrendsShipsCells row={group} alt={gAlt} />
          ) : (
            <GrowthCells row={group} alt={gAlt} />
          )}
        </tr>
        {expanded
          ? group.lines.map((line, lineIndex) => {
              const lAlt = lineIndex % 2 === 1;
              return (
                <tr key={`${mode}-line-${line.shipping_line_id}`}>
                  <td className={labelClass(lAlt, true)}>
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className="h-2 w-2 shrink-0 self-center border-b border-l border-sky-300/80 dark:border-sky-500/40"
                        aria-hidden
                      />
                      <ReportEntityLabel
                        name={line.name}
                        logo={line.logo}
                        logoKind="shipping_line"
                      />
                    </div>
                  </td>
                  {mode === "ships" ? (
                    <TrendsShipsCells row={line} alt={lAlt} nested />
                  ) : (
                    <GrowthCells row={line} alt={lAlt} nested />
                  )}
                </tr>
              );
            })
          : null}
      </Fragment>
    );
  }

  return (
    <div className="space-y-4">
      <ViewSection
        icon={TrendingUp}
        title={data.title}
        description={
          data.without_lta ? `${data.note} Excluye LTA.` : data.note
        }
        bodyClassName={reportViewSectionBody}
      >
        <div className={reportMatrix.sectionGroup}>
          <PortContextHeader port={data.port} />
          <div className={reportMatrix.sectionGroupBody}>
            <div className={reportMatrix.shellNested}>
              <div className="border-b border-zinc-200/70 bg-zinc-50/50 px-4 py-2.5 text-sm font-semibold text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-100">
                Trends por grupo de naviera
              </div>
              <TrendsPaginatedPanel
                scrollRootRef={trendsScrollRef}
                {...pagination}
              >
                <table className={reportMatrix.table}>
                  <thead>
                    <tr>
                      <th className={reportMatrix.cornerHeader} rowSpan={2}>
                        Grupo
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
                    {groups.map((group) => renderGroupBlock(group, "ships"))}
                    {totals ? (
                      <tr>
                        <td className={labelClass(false, false, true)}>
                          Total
                        </td>
                        <TrendsShipsCells row={totals} alt={false} total />
                      </tr>
                    ) : null}
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
        description="Variación interanual de PAX por grupo de naviera."
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
                      <th className={reportMatrix.cornerHeader}>Grupo</th>
                      {data.years.map((year) => (
                        <th key={year} className={reportMatrix.monthHeader}>
                          {year}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {groups.map((group) => renderGroupBlock(group, "growth"))}
                    {totals ? (
                      <tr>
                        <td className={labelClass(false, false, true)}>
                          Total
                        </td>
                        <GrowthCells row={totals} alt={false} total />
                      </tr>
                    ) : null}
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
