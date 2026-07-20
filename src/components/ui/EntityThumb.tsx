"use client";

import { entityInitial } from "@/lib/entityInitial";

export type EntityThumbSize = "xs" | "sm" | "md" | "lg" | "xl";
export type EntityThumbShape = "circle" | "rounded";
export type EntityThumbFit = "cover" | "contain";

const SIZE_CLASS: Record<EntityThumbSize, string> = {
  xs: "h-5 w-5 text-[8px]",
  sm: "h-8 w-8 text-[10px]",
  md: "h-10 w-10 text-xs",
  lg: "h-16 w-16 text-lg",
  xl: "h-24 w-24 text-2xl",
};

const SHAPE_CLASS: Record<EntityThumbShape, string> = {
  circle: "rounded-full",
  rounded: "rounded-md",
};

type EntityThumbProps = {
  /** Image URL; when missing, shows the initial from `label`. */
  src?: string | null;
  /** Name/code used to derive the fallback initial. */
  label: string;
  alt?: string;
  size?: EntityThumbSize;
  shape?: EntityThumbShape;
  /** cover for photos/avatars; contain for logos. */
  fit?: EntityThumbFit;
  /** Fill parent box (ignores size); parent must set dimensions. */
  fill?: boolean;
  className?: string;
};

/**
 * User profile avatar: photo or letter initial when empty.
 * Only for users (header, users table, profile). Catalog logos use `CatalogLogoThumb`.
 */
export default function EntityThumb({
  src,
  label,
  alt = "",
  size = "sm",
  shape = "circle",
  fit = "cover",
  fill = false,
  className = "",
}: EntityThumbProps) {
  const initial = entityInitial(label);

  return (
    <span
      className={`flex shrink-0 items-center justify-center overflow-hidden border border-zinc-200/80 bg-zinc-100 font-semibold uppercase text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 ${fill ? "h-full w-full text-2xl" : SIZE_CLASS[size]} ${SHAPE_CLASS[shape]} ${className}`}
      aria-hidden={src ? undefined : true}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          className={`h-full w-full ${fit === "contain" ? "object-contain p-0.5" : "object-cover"}`}
        />
      ) : (
        <span>{initial}</span>
      )}
    </span>
  );
}
