"use client";

import { ClipboardPaste, Trash2 } from "lucide-react";
import { useEffect, useRef } from "react";

const EMPTY_PREVIEW_ROWS = 6;

export function parseClipboardMatrix(text: string): string[][] {
  const raw = (text || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  if (!raw) return [];
  return raw
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => {
      if (line.includes("\t")) return line.split("\t").map((c) => c.trim());
      if (line.includes(";")) return line.split(";").map((c) => c.trim());
      return [line.trim()];
    });
}

export function matrixToTsv(headers: string[], rows: string[][]): string {
  const width = Math.max(
    headers.length,
    0,
    ...rows.map((r) => r.length),
  );
  const pad = (cells: string[]) =>
    Array.from({ length: width }, (_, i) => cells[i] ?? "");
  return [pad(headers), ...rows.map(pad)]
    .map((row) => row.join("\t"))
    .join("\n");
}

function rowLooksLikeHeader(row: string[], expected: string[]): boolean {
  if (!row.length) return false;
  const lower = row.map((c) => c.toLowerCase());
  const expectedLower = expected.map((c) => c.toLowerCase());
  if (expectedLower.some((h) => lower.includes(h))) return true;
  const first = lower[0] ?? "";
  if (/^(ship|port|fecha|fechas|date|arrival|barco)/.test(first)) return true;
  return false;
}

export function normalizePasteMatrix(
  matrix: string[][],
  fallbackColumns: string[],
): { headers: string[]; rows: string[][] } {
  if (!matrix.length) {
    return { headers: fallbackColumns, rows: [] };
  }
  const first = matrix[0];
  if (rowLooksLikeHeader(first, fallbackColumns)) {
    return { headers: first.map((c) => c || "—"), rows: matrix.slice(1) };
  }
  const width = Math.max(fallbackColumns.length, ...matrix.map((r) => r.length));
  const headers =
    fallbackColumns.length >= width
      ? fallbackColumns.slice(0, width)
      : [
          ...fallbackColumns,
          ...Array.from(
            { length: width - fallbackColumns.length },
            (_, i) => `Col ${fallbackColumns.length + i + 1}`,
          ),
        ];
  return { headers, rows: matrix };
}

type ImportPasteGridProps = {
  columns: string[];
  headers: string[];
  rows: string[][];
  disabled?: boolean;
  onMatrixChange: (headers: string[], rows: string[][]) => void;
};

export default function ImportPasteGrid({
  columns,
  headers,
  rows,
  disabled = false,
  onMatrixChange,
}: ImportPasteGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const displayHeaders = headers.length ? headers : columns;
  const hasData = rows.length > 0;
  const previewRows = hasData
    ? rows
    : Array.from({ length: EMPTY_PREVIEW_ROWS }, () =>
        displayHeaders.map(() => ""),
      );

  useEffect(() => {
    if (!disabled) containerRef.current?.focus();
  }, [disabled, columns]);

  function applyClipboardText(text: string) {
    const matrix = parseClipboardMatrix(text);
    if (!matrix.length) return;
    const next = normalizePasteMatrix(matrix, columns);
    onMatrixChange(next.headers, next.rows);
  }

  function handlePaste(e: React.ClipboardEvent) {
    if (disabled) return;
    const text = e.clipboardData.getData("text/plain");
    if (!text.trim()) return;
    if (!hasData || text.includes("\t") || text.includes("\n")) {
      e.preventDefault();
      applyClipboardText(text);
    }
  }

  function updateCell(rowIndex: number, colIndex: number, value: string) {
    if (!hasData || disabled) return;
    const next = rows.map((row, ri) =>
      ri === rowIndex
        ? displayHeaders.map((_, ci) =>
            ci === colIndex ? value : (row[ci] ?? ""),
          )
        : [...row],
    );
    onMatrixChange(displayHeaders, next);
  }

  function removeRow(rowIndex: number) {
    if (!hasData || disabled) return;
    const next = rows.filter((_, i) => i !== rowIndex);
    onMatrixChange(next.length ? displayHeaders : columns, next);
  }

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onPasteCapture={handlePaste}
      className="outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-accent)]/40 focus-visible:ring-offset-1 rounded-lg"
      aria-label="Cuadrícula de pegado. Pega con Ctrl+V o Cmd+V."
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
          {hasData
            ? `${rows.length} fila${rows.length === 1 ? "" : "s"} · puedes editar o quitar filas`
            : "Haz clic aquí y pega (⌘/Ctrl + V) desde Excel"}
        </p>
        {hasData ? (
          <button
            type="button"
            disabled={disabled}
            onClick={() => onMatrixChange(columns, [])}
            className="cursor-pointer text-[11px] font-medium text-zinc-500 underline-offset-2 hover:text-zinc-800 hover:underline dark:hover:text-zinc-200"
          >
            Limpiar
          </button>
        ) : null}
      </div>

      <div className="relative max-h-[min(50vh,420px)] overflow-auto rounded-lg border border-zinc-200/80 dark:border-zinc-700">
        {!hasData ? (
          <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-white/70 px-4 text-center dark:bg-zinc-950/70">
            <ClipboardPaste
              className="h-8 w-8 text-[var(--admin-accent)]"
              strokeWidth={1.75}
            />
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
              Pega las celdas de Excel
            </p>
            <p className="max-w-xs text-xs text-zinc-500">
              Se mostrarán en columnas como una hoja de cálculo.
            </p>
          </div>
        ) : null}

        <table className="min-w-full border-collapse text-left text-xs">
          <thead className="sticky top-0 z-[1]">
            <tr className="bg-zinc-100 dark:bg-zinc-800">
              <th className="w-10 border-b border-r border-zinc-200/80 px-2 py-1.5 text-center font-medium text-zinc-400 dark:border-zinc-700">
                #
              </th>
              {displayHeaders.map((header, i) => (
                <th
                  key={`${header}-${i}`}
                  className="whitespace-nowrap border-b border-r border-zinc-200/80 px-2.5 py-1.5 font-semibold text-zinc-700 dark:border-zinc-700 dark:text-zinc-200"
                >
                  {header}
                </th>
              ))}
              <th className="sticky right-0 w-10 border-b border-zinc-200/80 bg-zinc-100 px-1 py-1.5 dark:border-zinc-700 dark:bg-zinc-800">
                <span className="sr-only">Quitar fila</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {previewRows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="group odd:bg-white even:bg-zinc-50/80 dark:odd:bg-zinc-950 dark:even:bg-zinc-900/80"
              >
                <td className="border-b border-r border-zinc-200/60 px-2 py-0.5 text-center text-[10px] text-zinc-400 dark:border-zinc-800">
                  {rowIndex + 1}
                </td>
                {displayHeaders.map((_, colIndex) => (
                  <td
                    key={colIndex}
                    className="min-w-[7rem] border-b border-r border-zinc-200/60 p-0 dark:border-zinc-800"
                  >
                    {hasData ? (
                      <input
                        type="text"
                        value={row[colIndex] ?? ""}
                        disabled={disabled}
                        onChange={(e) =>
                          updateCell(rowIndex, colIndex, e.target.value)
                        }
                        className="w-full bg-transparent px-2 py-1.5 text-xs text-zinc-800 outline-none focus:bg-[var(--admin-accent)]/5 dark:text-zinc-100"
                      />
                    ) : (
                      <span className="block min-h-[1.75rem] px-2 py-1.5 text-transparent">
                        .
                      </span>
                    )}
                  </td>
                ))}
                <td
                  className={`sticky right-0 border-b border-zinc-200/60 px-1 py-0.5 text-center dark:border-zinc-800 ${
                    hasData
                      ? "bg-inherit group-odd:bg-white group-even:bg-zinc-50/80 dark:group-odd:bg-zinc-950 dark:group-even:bg-zinc-900/80"
                      : ""
                  }`}
                >
                  {hasData ? (
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => removeRow(rowIndex)}
                      aria-label={`Quitar fila ${rowIndex + 1}`}
                      title="Quitar fila"
                      className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:pointer-events-none disabled:opacity-50 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                    </button>
                  ) : (
                    <span className="inline-block h-7 w-7" aria-hidden />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
