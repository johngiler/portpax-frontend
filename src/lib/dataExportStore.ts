"use client";

import { useCallback, useSyncExternalStore } from "react";

export type DataExportFormat = "xlsx" | "csv" | "pdf";

export type DataExportHandler = (format: DataExportFormat) => void | Promise<void>;

const DEFAULT_FORMATS: DataExportFormat[] = ["xlsx", "csv"];

let handler: DataExportHandler | null = null;
let availableFormats: DataExportFormat[] = DEFAULT_FORMATS;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

/** Register from a view. Does not re-render the registering view when filters update. */
export function setDataExportHandler(
  next: DataExportHandler | null,
  options?: { formats?: DataExportFormat[] },
): void {
  handler = next;
  availableFormats = options?.formats?.length
    ? [...options.formats]
    : [...DEFAULT_FORMATS];
  emit();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getCanExportSnapshot(): boolean {
  return handler != null;
}

function getFormatsSnapshot(): DataExportFormat[] {
  return availableFormats;
}

function getServerSnapshot(): boolean {
  return false;
}

function getFormatsServerSnapshot(): DataExportFormat[] {
  return DEFAULT_FORMATS;
}

export function useDataExport() {
  const canExport = useSyncExternalStore(
    subscribe,
    getCanExportSnapshot,
    getServerSnapshot,
  );
  const formats = useSyncExternalStore(
    subscribe,
    getFormatsSnapshot,
    getFormatsServerSnapshot,
  );

  const runExport = useCallback(async (format: DataExportFormat) => {
    await handler?.(format);
  }, []);

  return { canExport, formats, runExport };
}
