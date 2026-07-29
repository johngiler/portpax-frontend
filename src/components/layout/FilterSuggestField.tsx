"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { FilterSuggestion } from "@/lib/filterSuggestions";

const DEBOUNCE_MS = 280;
const MIN_QUERY_LENGTH = 2;

const labelCompactClass =
  "mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-200";
const inputCompactClass =
  "w-full rounded-md border border-[var(--admin-border)] bg-gradient-to-b from-white to-[var(--admin-surface-muted)] px-3 py-2 text-xs text-zinc-900 placeholder-zinc-400 shadow-[inset_0_1px_2px_rgba(15,23,42,0.06)] transition-all focus:border-[var(--admin-accent)] focus:from-white focus:to-white focus:outline-none focus:ring-2 focus:ring-[var(--admin-accent)]/20 dark:border-zinc-700/70 dark:from-zinc-900 dark:to-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:from-zinc-900 dark:focus:to-zinc-900";

type FilterSuggestFieldProps = {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  loadSuggestions: (query: string) => Promise<FilterSuggestion[]>;
  placeholder?: string;
  /** After picking a suggestion (field already updated with applyValue). */
  onPick?: (suggestion: FilterSuggestion) => void;
};

export default function FilterSuggestField({
  label,
  name,
  value,
  onChange,
  loadSuggestions,
  placeholder,
  onPick,
}: FilterSuggestFieldProps) {
  const listId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<FilterSuggestion[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    const trimmed = value.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      setSuggestions([]);
      setLoading(false);
      setActiveIndex(-1);
      return;
    }

    setLoading(true);
    timeoutRef.current = setTimeout(async () => {
      const reqId = ++requestIdRef.current;
      try {
        const rows = await loadSuggestions(trimmed);
        if (reqId !== requestIdRef.current) return;
        setSuggestions(rows);
        setActiveIndex(rows.length > 0 ? 0 : -1);
        setOpen(true);
      } catch {
        if (reqId !== requestIdRef.current) return;
        setSuggestions([]);
        setActiveIndex(-1);
      } finally {
        if (reqId === requestIdRef.current) setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [value, loadSuggestions]);

  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  function pick(suggestion: FilterSuggestion) {
    onChange(suggestion.applyValue);
    setOpen(false);
    setSuggestions([]);
    setActiveIndex(-1);
    onPick?.(suggestion);
  }

  const showPanel = open && value.trim().length >= MIN_QUERY_LENGTH;

  const grouped = groupSuggestions(suggestions);

  return (
    <div ref={containerRef} className="relative mb-3">
      <label htmlFor={name} className={labelCompactClass}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type="search"
        value={value}
        autoComplete="off"
        aria-autocomplete="list"
        aria-controls={listId}
        aria-expanded={showPanel}
        placeholder={placeholder}
        className={inputCompactClass}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          if (value.trim().length >= MIN_QUERY_LENGTH) setOpen(true);
        }}
        onKeyDown={(e) => {
          if (!showPanel || suggestions.length === 0) {
            if (e.key === "Escape") setOpen(false);
            return;
          }
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIndex((i) => (i + 1) % suggestions.length);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex((i) =>
              i <= 0 ? suggestions.length - 1 : i - 1,
            );
          } else if (e.key === "Enter" && activeIndex >= 0) {
            e.preventDefault();
            pick(suggestions[activeIndex]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
      />

      {showPanel ? (
        <div
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 z-50 mt-1 max-h-56 overflow-y-auto rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
        >
          {loading && suggestions.length === 0 ? (
            <p className="px-3 py-2.5 text-xs text-zinc-500 dark:text-zinc-400">
              Buscando…
            </p>
          ) : suggestions.length === 0 ? (
            <p className="px-3 py-2.5 text-xs text-zinc-500 dark:text-zinc-400">
              Sin coincidencias
            </p>
          ) : (
            grouped.map(({ group, items }) => (
              <div key={group ?? "_"} className="py-1">
                {group ? (
                  <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    {group}
                  </p>
                ) : null}
                {items.map((item) => {
                  const flatIndex = suggestions.indexOf(item);
                  const active = flatIndex === activeIndex;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="option"
                      aria-selected={active}
                      className={`flex w-full cursor-pointer flex-col gap-0.5 px-3 py-2 text-left text-xs transition-colors ${
                        active
                          ? "bg-[var(--admin-accent)]/10 text-zinc-900 dark:text-zinc-100"
                          : "text-zinc-700 hover:bg-[var(--admin-accent)]/10 dark:text-zinc-300"
                      }`}
                      onMouseEnter={() => setActiveIndex(flatIndex)}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => pick(item)}
                    >
                      <span className="truncate font-medium">{item.label}</span>
                      {item.hint ? (
                        <span className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                          {item.hint}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}

function groupSuggestions(items: FilterSuggestion[]) {
  if (!items.some((i) => i.group)) {
    return [{ group: undefined as string | undefined, items }];
  }
  const map = new Map<string, FilterSuggestion[]>();
  for (const item of items) {
    const group = item.group ?? "Otros";
    if (!map.has(group)) map.set(group, []);
    map.get(group)!.push(item);
  }
  return Array.from(map.entries()).map(([group, rows]) => ({
    group,
    items: rows,
  }));
}
