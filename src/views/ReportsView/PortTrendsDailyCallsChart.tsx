"use client";

import { useMemo, useState } from "react";
import ChartCard from "@/views/DashboardView/charts/ChartCard";
import ChartTooltip from "@/views/DashboardView/charts/ChartTooltip";
import {
  formatIsoDateLabel,
  formatIsoWeekdayShort,
  parseIsoDate,
} from "@/lib/bookingDates";
import type { PortTrendsDailyCall } from "@/services/bookings/bookingService";

type Props = {
  days: PortTrendsDailyCall[];
};

const BAR_COLOR = "#3478b5";
const CHART_W = 1200;
const CHART_H = 260;
const PAD_TOP = 8;

function niceCeiling(value: number): number {
  if (value <= 0) return 1;
  const exp = Math.floor(Math.log10(value));
  const factor = 10 ** exp;
  const normalized = value / factor;
  const steps = [1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];
  const nice = steps.find((step) => normalized <= step) ?? 10;
  return nice * factor;
}

function tickIndices(count: number): number[] {
  if (count <= 1) return [0];
  const maxTicks = Math.min(12, count);
  const step = Math.max(1, Math.round((count - 1) / (maxTicks - 1)));
  const out: number[] = [];
  for (let i = 0; i < count; i += step) out.push(i);
  if (out[out.length - 1] !== count - 1) out.push(count - 1);
  return out;
}

function tickLabel(iso: string): string {
  const { day } = parseIsoDate(iso);
  return `${formatIsoWeekdayShort(iso)} ${day}`;
}

export default function PortTrendsDailyCallsChart({ days }: Props) {
  const [hovered, setHovered] = useState<number | null>(null);

  const maxCalls = useMemo(
    () => niceCeiling(Math.max(1, ...days.map((row) => row.calls))),
    [days],
  );
  const ticks = useMemo(() => {
    const values: number[] = [];
    for (let i = 0; i <= 4; i += 1) {
      values.push(Math.round((maxCalls * i) / 4));
    }
    return [...new Set(values)];
  }, [maxCalls]);
  const labelIdx = useMemo(() => new Set(tickIndices(days.length)), [days.length]);

  if (!days.length) return null;

  const n = days.length;
  const slot = CHART_W / n;
  const barW = Math.max(Math.min(slot * 0.72, 18), 1.5);

  const callsToY = (calls: number) =>
    PAD_TOP + CHART_H * (1 - Math.min(Math.max(calls, 0) / maxCalls, 1));

  return (
    <ChartCard title="Escalas por día" accent="#0d9488">
      <div className="relative w-full">
        <div className="flex h-[18rem] w-full flex-col sm:h-[22rem]">
          <div className="flex min-h-0 flex-1 gap-1">
            <div className="relative w-10 shrink-0 sm:w-12">
              {ticks.map((tick) => (
                <span
                  key={`d-${tick}`}
                  className="absolute right-0 -translate-y-1/2 text-[10px] tabular-nums text-zinc-500"
                  style={{ top: `${(1 - tick / maxCalls) * 100}%` }}
                >
                  {tick.toLocaleString("es")}
                </span>
              ))}
            </div>
            <div className="relative min-w-0 flex-1">
              <svg
                viewBox={`0 0 ${CHART_W} ${CHART_H + PAD_TOP + 4}`}
                className="block h-full w-full"
                preserveAspectRatio="none"
                role="img"
                aria-label="Cantidad de escalas por día"
              >
                {ticks.map((tick) => {
                  const y = callsToY(tick);
                  return (
                    <line
                      key={`grid-${tick}`}
                      x1={0}
                      x2={CHART_W}
                      y1={y}
                      y2={y}
                      stroke="#e4e4e7"
                      strokeWidth={1}
                      vectorEffect="non-scaling-stroke"
                    />
                  );
                })}
                {days.map((row, idx) => {
                  const h = (row.calls / maxCalls) * CHART_H;
                  const x = idx * slot + (slot - barW) / 2;
                  const active = hovered === null || hovered === idx;
                  return (
                    <rect
                      key={row.date}
                      x={x}
                      y={PAD_TOP + CHART_H - Math.max(h, row.calls > 0 ? 2 : 0)}
                      width={barW}
                      height={Math.max(h, row.calls > 0 ? 2 : 0)}
                      rx={1.25}
                      fill={BAR_COLOR}
                      opacity={active ? 0.72 : 0.22}
                      onMouseEnter={() => setHovered(idx)}
                      onMouseLeave={() => setHovered(null)}
                    />
                  );
                })}
              </svg>
            </div>
            <div className="w-2 shrink-0 sm:w-3" aria-hidden />
          </div>
          <div className="mt-4 flex gap-1 pt-1">
            <div className="w-10 shrink-0 sm:w-12" aria-hidden />
            <div
              className="grid h-12 min-w-0 flex-1 gap-0"
              style={{
                gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`,
              }}
            >
              {days.map((row, idx) => (
                <div
                  key={`lbl-${row.date}`}
                  className="relative flex items-start justify-center overflow-visible"
                >
                  {labelIdx.has(idx) ? (
                    <span
                      className="whitespace-nowrap text-[10px] font-semibold tracking-wide text-zinc-600 dark:text-zinc-300"
                      style={{
                        transform: "rotate(-35deg)",
                        transformOrigin: "center top",
                      }}
                    >
                      {tickLabel(row.date)}
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
            <div className="w-2 shrink-0 sm:w-3" aria-hidden />
          </div>
        </div>
        {hovered != null && days[hovered] ? (
          <div className="absolute left-1/2 top-2 z-20 -translate-x-1/2">
            <ChartTooltip
              title={formatIsoDateLabel(days[hovered].date, "short")}
              rows={[
                {
                  label: "Escalas",
                  value: String(days[hovered].calls),
                  color: BAR_COLOR,
                },
              ]}
            />
          </div>
        ) : null}
      </div>
    </ChartCard>
  );
}
