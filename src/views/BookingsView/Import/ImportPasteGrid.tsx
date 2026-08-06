"use client";

import { Plus, Trash2 } from "lucide-react";
import { useEffect, useRef } from "react";

const EMPTY_PREVIEW_ROWS = 6;

export function parseClipboardMatrix(text: string): string[][] {
  const raw = (text || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  if (!raw) return [];
  const lines = raw.split("\n").filter((line) => line.trim());
  const vertical = reshapeVerticalItmLines(lines);
  if (vertical) return vertical;

  return lines.map((line) => {
    if (line.includes("\t")) return line.split("\t").map((c) => c.trim());
    if (line.includes(";")) return line.split(";").map((c) => c.trim());
    return [line.trim()];
  });
}

/** Canonical ITM headers when pasting from email (one field per line). */
const VERTICAL_ITM_HEADERS = [
  "Ship",
  "Port",
  "Arrival",
  "Departure",
  "Vendor Name",
  "Call Type",
] as const;

const VERTICAL_ITM_HEADER_KEYS = new Set(
  VERTICAL_ITM_HEADERS.map((h) => h.toLowerCase()),
);

/**
 * Email / Outlook often copies ITM tables as one cell per line:
 * Ship / Port / Arrival / … then repeating value blocks.
 * Returns a row matrix (header + data) or null if not that shape.
 */
export function reshapeVerticalItmLines(lines: string[]): string[][] | null {
  const trimmed = lines.map((l) => l.trim()).filter(Boolean);
  if (trimmed.length < 8) return null;

  const mostlySingle =
    trimmed.filter((l) => !l.includes("\t") && !l.includes(";")).length >=
    trimmed.length * 0.85;
  if (!mostlySingle) return null;

  let headerCount = 0;
  const headers: string[] = [];
  for (const line of trimmed) {
    const key = line.toLowerCase();
    if (!VERTICAL_ITM_HEADER_KEYS.has(key)) break;
    const canonical =
      VERTICAL_ITM_HEADERS.find((h) => h.toLowerCase() === key) ?? line;
    headers.push(canonical);
    headerCount += 1;
  }

  // Need at least Ship, Port, Arrival, Departure as first four header labels.
  if (headerCount < 4) return null;
  const required = ["ship", "port", "arrival", "departure"];
  const headerKeys = headers.map((h) => h.toLowerCase());
  if (!required.every((r) => headerKeys.includes(r))) return null;

  const width = headers.length;
  const data = trimmed.slice(headerCount);
  if (data.length < width) return null;
  if (data.length % width !== 0) return null;

  const rows: string[][] = [];
  for (let i = 0; i < data.length; i += width) {
    rows.push(data.slice(i, i + width));
  }
  return [headers, ...rows];
}

export function matrixToTsv(headers: string[], rows: string[][]): string {
  const width = Math.max(headers.length, 0, ...rows.map((r) => r.length));
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

function emptyRows(columnCount: number, count = EMPTY_PREVIEW_ROWS): string[][] {
  return Array.from({ length: count }, () =>
    Array.from({ length: columnCount }, () => ""),
  );
}

function rowHasContent(row: string[]): boolean {
  return row.some((cell) => cell.trim() !== "");
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
  const focusCellRef = useRef<{ row: number; col: number }>({ row: 0, col: 0 });
  const displayHeaders = headers.length ? headers : columns;
  const hasData = rows.some(rowHasContent);
  const workingRows =
    rows.length > 0 ? rows : emptyRows(displayHeaders.length);

  useEffect(() => {
    if (!disabled) containerRef.current?.focus();
  }, [disabled, columns]);

  function cloneWorkingMatrix(): string[][] {
    const base =
      rows.length > 0
        ? rows.map((row) => displayHeaders.map((_, ci) => row[ci] ?? ""))
        : emptyRows(displayHeaders.length);
    return base;
  }

  /** Paste multi-cell clipboard starting at the focused cell (column/row fill). */
  function applyClipboardAtFocus(text: string) {
    const matrix = parseClipboardMatrix(text);
    if (!matrix.length) return;

    // Empty table + looks like a full sheet → replace whole matrix (headers included).
    if (!hasData && rowLooksLikeHeader(matrix[0], columns)) {
      const next = normalizePasteMatrix(matrix, columns);
      onMatrixChange(next.headers, next.rows);
      return;
    }
    if (!hasData && matrix.length > 1 && matrix[0].length >= columns.length) {
      const next = normalizePasteMatrix(matrix, columns);
      onMatrixChange(next.headers, next.rows);
      return;
    }

    const { row: startRow, col: startCol } = focusCellRef.current;
    const base = cloneWorkingMatrix();
    const colCount = displayHeaders.length;

    for (let r = 0; r < matrix.length; r++) {
      const targetRow = startRow + r;
      while (base.length <= targetRow) {
        base.push(displayHeaders.map(() => ""));
      }
      const src = matrix[r];
      for (let c = 0; c < src.length; c++) {
        const targetCol = startCol + c;
        if (targetCol < 0 || targetCol >= colCount) continue;
        base[targetRow] = displayHeaders.map((_, ci) =>
          ci === targetCol ? src[c] : (base[targetRow][ci] ?? ""),
        );
      }
    }
    commitRows(base);
  }

  function handlePaste(e: React.ClipboardEvent) {
    if (disabled) return;
    const text = e.clipboardData.getData("text/plain");
    if (!text.trim()) return;
    if (!hasData || text.includes("\t") || text.includes("\n")) {
      e.preventDefault();
      applyClipboardAtFocus(text);
    }
  }

  function commitRows(nextRows: string[][]) {
    const meaningful = nextRows.filter(rowHasContent);
    onMatrixChange(
      displayHeaders,
      meaningful.length > 0 ? nextRows : [],
    );
  }

  function updateCell(rowIndex: number, colIndex: number, value: string) {
    if (disabled) return;
    const base = cloneWorkingMatrix();
    while (base.length <= rowIndex) {
      base.push(displayHeaders.map(() => ""));
    }
    base[rowIndex] = displayHeaders.map((_, ci) =>
      ci === colIndex ? value : (base[rowIndex][ci] ?? ""),
    );
    commitRows(base);
  }

  function removeRow(rowIndex: number) {
    if (disabled) return;
    const base = cloneWorkingMatrix();
    if (base.length <= 1) {
      onMatrixChange(columns, []);
      return;
    }
    const next = base.filter((_, i) => i !== rowIndex);
    onMatrixChange(displayHeaders, next);
  }

  function addRow() {
    if (disabled) return;
    const base = cloneWorkingMatrix();
    base.push(displayHeaders.map(() => ""));
    onMatrixChange(displayHeaders, base);
  }

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onPasteCapture={handlePaste}
      className="outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-accent)]/40 focus-visible:ring-offset-1 rounded-lg"
      aria-label="Tabla de importación"
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
          {hasData
            ? `${rows.filter(rowHasContent).length} fila${rows.filter(rowHasContent).length === 1 ? "" : "s"} con datos · pega desde la celda activa`
            : "Tabla vacía · pega la hoja completa o empieza a escribir"}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={disabled}
            onClick={addRow}
            className="inline-flex cursor-pointer items-center gap-1 text-[11px] font-medium text-[var(--admin-accent)] underline-offset-2 hover:underline disabled:pointer-events-none disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            Agregar fila
          </button>
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
      </div>

      <div className="relative max-h-[min(70vh,640px)] overflow-auto rounded-lg border border-zinc-200/80 dark:border-zinc-700">
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
            {workingRows.map((row, rowIndex) => (
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
                    <input
                      type="text"
                      value={row[colIndex] ?? ""}
                      disabled={disabled}
                      onFocus={() => {
                        focusCellRef.current = { row: rowIndex, col: colIndex };
                      }}
                      onChange={(e) =>
                        updateCell(rowIndex, colIndex, e.target.value)
                      }
                      className="w-full bg-transparent px-2 py-1.5 text-xs text-zinc-800 outline-none focus:bg-[var(--admin-accent)]/5 dark:text-zinc-100"
                    />
                  </td>
                ))}
                <td className="sticky right-0 border-b border-zinc-200/60 bg-inherit px-1 py-0.5 text-center group-odd:bg-white group-even:bg-zinc-50/80 dark:border-zinc-800 dark:group-odd:bg-zinc-950 dark:group-even:bg-zinc-900/80">
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
