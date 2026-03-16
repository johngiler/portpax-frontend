"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Anchor, Building2, CalendarDays, Search, Ship } from "lucide-react";
import type { GlobalSearchResult } from "@/lib/docking";
import { globalSearch } from "@/lib/docking";

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;
const EXPANDED_WIDTH = 420;

function formatScaleDate(d: string | null): string {
  if (!d) return "—";
  try {
    return new Date(d + "T12:00:00").toLocaleDateString("es", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return d;
  }
}

export default function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GlobalSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      setResults(null);
      return;
    }
    setLoading(true);
    try {
      const data = await globalSearch(trimmed);
      setResults(data);
    } catch {
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (query.trim().length < MIN_QUERY_LENGTH) {
      setResults(null);
      return;
    }
    timeoutRef.current = setTimeout(() => {
      runSearch(query);
    }, DEBOUNCE_MS);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [query, runSearch]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setExpanded(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleExpand = () => {
    setExpanded(true);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  };

  const hasAny =
    results &&
    (results.ships.length > 0 ||
      results.shipping_lines.length > 0 ||
      results.ports.length > 0 ||
      results.scales.length > 0);

  return (
    <div ref={containerRef} className="relative flex items-center">
      <div
        className={`relative flex items-center overflow-hidden rounded-full transition-[width] duration-300 ease-out motion-reduce:duration-0 md:duration-200 ${
          expanded ? "border border-zinc-200/60 dark:border-zinc-600/60" : "border-0"
        }`}
        style={{
          width: expanded ? EXPANDED_WIDTH : 40,
          background: "transparent",
          boxShadow: expanded ? "0 2px 10px rgba(0,0,0,.06)" : "none",
        }}
      >
        <button
          type="button"
          onClick={handleExpand}
          className={`relative z-10 flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-zinc-500 transition-colors hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 ${!expanded ? "cursor-pointer" : "pointer-events-none"}`}
          style={{ background: "none" }}
          aria-label="Abrir buscador"
          tabIndex={expanded ? -1 : 0}
        >
          <Search className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
        </button>
        <div
          className={`overflow-hidden rounded-r-full ${expanded ? "bg-white/95 dark:bg-zinc-800/95" : ""}`}
          style={
            expanded
              ? {
                  position: "absolute",
                  left: 40,
                  top: 0,
                  width: EXPANDED_WIDTH - 40,
                  height: 40,
                }
              : { width: 0, height: 40, overflow: "hidden" }
          }
        >
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onBlur={() => {
              if (!query.trim()) setExpanded(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                if (!query.trim()) {
                  setExpanded(false);
                  inputRef.current?.blur();
                } else {
                  setQuery("");
                }
              }
            }}
            placeholder="Barco, naviera, puerto, escala..."
            className="h-10 w-full cursor-pointer bg-transparent pr-4 pl-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none dark:text-zinc-100 dark:placeholder:text-zinc-500"
            aria-label="Buscador global"
            aria-expanded={expanded && (loading || results !== null)}
            aria-autocomplete="list"
            style={{ opacity: expanded ? 1 : 0 }}
          />
        </div>
      </div>
      {expanded &&
        query.trim().length >= MIN_QUERY_LENGTH &&
        (loading || results !== null) && (
          <div
            className="absolute left-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
            style={{
              width: EXPANDED_WIDTH,
              maxHeight: "min(70vh, 440px)",
            }}
            role="listbox"
          >
            <div className="max-h-[min(70vh,440px)] overflow-y-auto">
              {loading ? (
                <div className="px-5 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
                  Buscando...
                </div>
              ) : !hasAny ? (
                <div className="px-5 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
                  Sin resultados para &quot;{query.trim()}&quot;
                </div>
              ) : (
                <div className="py-2">
                  {results!.ships.length > 0 && (
                    <div className="px-2 pb-1 pt-1">
                      <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                        Barcos
                      </p>
                      {results!.ships.map((s) => (
                        <Link
                          key={s.id}
                          href="/ships"
                          className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-700 transition-colors hover:bg-[var(--admin-accent)]/10 dark:text-zinc-300 dark:hover:bg-[var(--admin-accent)]/15"
                          onClick={() => setExpanded(false)}
                        >
                          <Ship className="h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500" />
                          <span className="font-medium">{s.name}</span>
                          {s.shipping_line_name && (
                            <span className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                              {s.shipping_line_name}
                            </span>
                          )}
                        </Link>
                      ))}
                    </div>
                  )}
                  {results!.shipping_lines.length > 0 && (
                    <div className="px-2 pb-1 pt-1">
                      <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                        Navieras
                      </p>
                      {results!.shipping_lines.map((sl) => (
                        <Link
                          key={sl.id}
                          href="/shipping-lines"
                          className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-700 transition-colors hover:bg-[var(--admin-accent)]/10 dark:text-zinc-300 dark:hover:bg-[var(--admin-accent)]/15"
                          onClick={() => setExpanded(false)}
                        >
                          <Building2 className="h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500" />
                          <span className="font-medium">{sl.name}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                  {results!.ports.length > 0 && (
                    <div className="px-2 pb-1 pt-1">
                      <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                        Puertos
                      </p>
                      {results!.ports.map((p) => (
                        <Link
                          key={p.id}
                          href="/ports"
                          className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-700 transition-colors hover:bg-[var(--admin-accent)]/10 dark:text-zinc-300 dark:hover:bg-[var(--admin-accent)]/15"
                          onClick={() => setExpanded(false)}
                        >
                          <Anchor className="h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500" />
                          <span className="font-medium">{p.name}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                  {results!.scales.length > 0 && (
                    <div className="px-2 pb-1 pt-1">
                      <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                        Escalas
                      </p>
                      {results!.scales.map((sc) => (
                        <Link
                          key={sc.id}
                          href="/scales"
                          className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-700 transition-colors hover:bg-[var(--admin-accent)]/10 dark:text-zinc-300 dark:hover:bg-[var(--admin-accent)]/15"
                          onClick={() => setExpanded(false)}
                        >
                          <CalendarDays className="h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500" />
                          <span className="font-medium">{sc.ship_name}</span>
                          <span className="text-zinc-500 dark:text-zinc-400">
                            @ {sc.port_name}
                          </span>
                          <span className="ml-auto shrink-0 text-xs text-zinc-400 dark:text-zinc-500">
                            {formatScaleDate(sc.date)}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
    </div>
  );
}
