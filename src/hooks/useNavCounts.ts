"use client";

import { useEffect, useState } from "react";
import { fetchNavCounts, type NavCounts } from "@/services/core/navCountsService";

/** Load sidebar counts once per mount (layout lifetime). */
export function useNavCounts(enabled: boolean): NavCounts | null {
  const [counts, setCounts] = useState<NavCounts | null>(null);

  useEffect(() => {
    if (!enabled) {
      setCounts(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchNavCounts();
        if (!cancelled) setCounts(data);
      } catch {
        if (!cancelled) setCounts(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return counts;
}
