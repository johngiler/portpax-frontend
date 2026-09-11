"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getLocalAppBuildId } from "@/lib/appBuildId";

type AppUpdateContextValue = {
  updateAvailable: boolean;
  remoteBuildId: string | null;
  dismissUpdate: () => void;
  reloadForUpdate: () => void;
  notifyRemoteBuild: (buildId: string) => void;
};

const AppUpdateContext = createContext<AppUpdateContextValue | null>(null);

export function AppUpdateProvider({ children }: { children: ReactNode }) {
  const localBuildId = getLocalAppBuildId();
  const [remoteBuildId, setRemoteBuildId] = useState<string | null>(null);
  const [dismissedBuildId, setDismissedBuildId] = useState<string | null>(null);

  const notifyRemoteBuild = useCallback(
    (buildId: string) => {
      const cleaned = buildId.trim();
      if (!cleaned) return;
      // Same as this tab → clear any pending update banner.
      if (cleaned === localBuildId) {
        setRemoteBuildId(null);
        setDismissedBuildId(null);
        return;
      }
      setRemoteBuildId(cleaned);
    },
    [localBuildId],
  );

  const updateAvailable =
    remoteBuildId != null &&
    remoteBuildId !== localBuildId &&
    dismissedBuildId !== remoteBuildId;

  const dismissUpdate = useCallback(() => {
    if (!remoteBuildId) return;
    setDismissedBuildId(remoteBuildId);
  }, [remoteBuildId]);

  const reloadForUpdate = useCallback(() => {
    window.location.reload();
  }, []);

  const value = useMemo(
    () => ({
      updateAvailable,
      remoteBuildId,
      dismissUpdate,
      reloadForUpdate,
      notifyRemoteBuild,
    }),
    [
      updateAvailable,
      remoteBuildId,
      dismissUpdate,
      reloadForUpdate,
      notifyRemoteBuild,
    ],
  );

  return (
    <AppUpdateContext.Provider value={value}>{children}</AppUpdateContext.Provider>
  );
}

export function useAppUpdate(): AppUpdateContextValue {
  const ctx = useContext(AppUpdateContext);
  if (!ctx) {
    throw new Error("useAppUpdate must be used within AppUpdateProvider");
  }
  return ctx;
}

export function useAppUpdateOptional(): AppUpdateContextValue | null {
  return useContext(AppUpdateContext);
}
