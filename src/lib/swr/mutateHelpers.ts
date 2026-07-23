"use client";

import { mutate } from "swr";
import { swrKeys } from "./keys";

/** Clear entire SWR cache (logout / session expired). */
export async function clearSwrCache(): Promise<void> {
  await mutate(() => true, undefined, { revalidate: false });
}

export async function revalidateNavCounts(): Promise<void> {
  await mutate(swrKeys.navCounts);
}

export async function revalidatePortsLists(): Promise<void> {
  await mutate(
    (key) => Array.isArray(key) && key[0] === "ports",
    undefined,
    { revalidate: true },
  );
  await revalidateNavCounts();
}

export async function revalidateShippingLinesLists(): Promise<void> {
  await mutate(
    (key) => Array.isArray(key) && key[0] === "shipping-lines",
    undefined,
    { revalidate: true },
  );
  await revalidateNavCounts();
}

export async function revalidateUsersLists(): Promise<void> {
  await mutate(
    (key) => Array.isArray(key) && key[0] === "users",
    undefined,
    { revalidate: true },
  );
  await revalidateNavCounts();
}

export async function revalidateBookingsLists(): Promise<void> {
  await mutate(
    (key) => Array.isArray(key) && key[0] === "bookings",
    undefined,
    { revalidate: true },
  );
  await revalidateNavCounts();
}

export async function revalidateDashboard(): Promise<void> {
  await mutate(
    (key) => Array.isArray(key) && key[0] === "dashboard",
    undefined,
    { revalidate: true },
  );
}
