"use client";

import { useCallback, useSyncExternalStore } from "react";

/** Opens the view's activity / movement history modal. */
export type DataActivityHandler = () => void | Promise<void>;

let handler: DataActivityHandler | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

/** Register from a view. Does not re-render the registering view when filters update. */
export function setDataActivityHandler(next: DataActivityHandler | null): void {
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

export function useDataActivity() {
  const canOpenActivity = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const runActivity = useCallback(async () => {
    await handler?.();
  }, []);

  return { canOpenActivity, runActivity };
}
