/**
 * Shared options for useSWRInfinite (“Cargar más” lists).
 * Default revalidateFirstPage=true refetches page 1 on every setSize → request burst.
 */
export const swrInfiniteDefaults = {
  revalidateFirstPage: false,
} as const;
