"use client";

import { useCallback, useSyncExternalStore } from "react";

/** Opens the view's import flow (options modal). File pick happens inside that flow. */
export type DataImportHandler = () => void | Promise<void>;

let handler: DataImportHandler | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

/** Register from a view. Does not re-render the registering view when filters update. */
export function setDataImportHandler(next: DataImportHandler | null): void {
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

export function useDataImport() {
  const canImport = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const runImport = useCallback(async () => {
    await handler?.();
  }, []);

  return { canImport, runImport };
}
