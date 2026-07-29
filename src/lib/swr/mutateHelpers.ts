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
    (key) =>
      Array.isArray(key) &&
      (key[0] === "bookings" ||
        key[0] === "calendar" ||
        key[0] === "availability"),
    undefined,
    { revalidate: true },
  );
  await revalidateNavCounts();
}

export async function revalidateLtaAgreements(): Promise<void> {
  await mutate(
    (key) => Array.isArray(key) && key[0] === "lta-agreements",
    undefined,
    { revalidate: true },
  );
  await revalidateNavCounts();
}

export async function revalidateLtaLinkedBookings(
  agreementId: number,
): Promise<void> {
  await mutate(swrKeys.ltaLinkedBookings(agreementId));
}

export async function revalidateDashboard(): Promise<void> {
  await mutate(
    (key) => Array.isArray(key) && key[0] === "dashboard",
    undefined,
    { revalidate: true },
  );
}
