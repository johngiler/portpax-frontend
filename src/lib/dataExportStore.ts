"use client";

import { useCallback, useSyncExternalStore } from "react";

export type DataExportFormat = "xlsx" | "csv";

export type DataExportHandler = (format: DataExportFormat) => void | Promise<void>;

let handler: DataExportHandler | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

/** Register from a view. Does not re-render the registering view when filters update. */
export function setDataExportHandler(next: DataExportHandler | null): void {
  handler = next;
  emit();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): boolean {
  return handler != null;
}

function getServerSnapshot(): boolean {
  return false;
}

export function useDataExport() {
  const canExport = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const runExport = useCallback(async (format: DataExportFormat) => {
    await handler?.(format);
  }, []);

  return { canExport, runExport };
}
