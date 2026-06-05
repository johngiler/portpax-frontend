/**
 * Skeleton for API-backed views. Mirror the real layout in a colocated *Skeleton.tsx.
 */
export default function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-zinc-200/80 dark:bg-zinc-700/50 ${className}`}
      aria-hidden
    />
  );
}

export function SkeletonText({ className = "", lines = 1 }: { className?: string; lines?: number }) {
  if (lines <= 1) {
    return <Skeleton className={`h-4 max-w-[theme(spacing.48)] ${className}`} />;
  }
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-4 ${i === lines - 1 && lines > 1 ? "max-w-[theme(spacing.32)]" : ""}`}
        />
      ))}
    </div>
  );
}

export function SkeletonCircle({ className = "" }: { className?: string }) {
  return <Skeleton className={`rounded-full ${className}`} />;
}

/** Preferred import name per frontend design rules. */
export { Skeleton as SkeletonLoader };
