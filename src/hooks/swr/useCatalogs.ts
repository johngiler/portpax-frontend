"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import { fetchPorts } from "@/services/catalogs/portService";
import { fetchShippingLineGroups } from "@/services/catalogs/shippingLineGroupService";
import { fetchAllShippingLines } from "@/services/catalogs/shippingLineService";
import { fetchAllVessels } from "@/services/catalogs/vesselService";
import type { Port } from "@/types/catalog";
import type { ShippingLine, ShippingLineGroup, Vessel } from "@/types/cruise";

export function useActivePortsCatalog(enabled = true) {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    enabled ? swrKeys.portsCatalog(100) : null,
    async () => {
      const res = await fetchPorts({ pageSize: 100 });
      return res.results.filter((port) => port.is_active);
    },
  );
  return {
    ports: (data ?? []) as Port[],
    error,
    isLoading,
    isValidating,
    mutate,
  };
}

export function useShippingLineGroupsCatalog(enabled = true) {
  const { data, error, isLoading, mutate } = useSWR(
    enabled ? swrKeys.shippingLineGroups : null,
    () => fetchShippingLineGroups(),
  );
  return {
    groups: (data ?? []) as ShippingLineGroup[],
    error,
    isLoading,
    mutate,
  };
}

export function useActiveShippingLinesCatalog(enabled = true) {
  const { data, error, isLoading, mutate } = useSWR(
    enabled ? swrKeys.shippingLinesCatalog(100) : null,
    async () => {
      const lines = await fetchAllShippingLines({ pageSize: 100 });
      return lines.filter((line) => line.is_active);
    },
  );
  return {
    lines: (data ?? []) as ShippingLine[],
    error,
    isLoading,
    mutate,
  };
}

export function useActiveVesselsCatalog(
  shippingLineIds?: number | number[] | null,
  enabled = true,
) {
  const lineIds = (
    Array.isArray(shippingLineIds)
      ? shippingLineIds
      : shippingLineIds && shippingLineIds > 0
        ? [shippingLineIds]
        : []
  )
    .filter((id) => id > 0)
    .sort((a, b) => a - b);
  const { data, error, isLoading, mutate } = useSWR(
    enabled && lineIds.length > 0 ? swrKeys.vesselsCatalog(lineIds) : null,
    async () => {
      const vessels = await fetchAllVessels({
        shipping_lines: lineIds,
        pageSize: 100,
      });
      return vessels.filter((vessel) => vessel.is_active);
    },
  );
  return {
    vessels: (data ?? []) as Vessel[],
    error,
    isLoading: Boolean(enabled && lineIds.length > 0 && isLoading),
    mutate,
  };
}
