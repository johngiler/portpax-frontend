export default function BookingsViewSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-4 rounded-2xl border border-zinc-200/80 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/80"
        >
          <div className="h-14 w-14 rounded-xl bg-zinc-200/80 dark:bg-zinc-800" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-48 rounded bg-zinc-200/80 dark:bg-zinc-800" />
            <div className="h-3 w-64 rounded bg-zinc-200/60 dark:bg-zinc-800/80" />
            <div className="h-3 w-32 rounded bg-zinc-200/60 dark:bg-zinc-800/80" />
          </div>
        </div>
      ))}
    </div>
  );
}
