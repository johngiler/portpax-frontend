export default function ShippingLinesViewSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-16 rounded-2xl bg-zinc-200/80 dark:bg-zinc-800" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 12 }).map((_, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-2xl border border-zinc-200/80 dark:border-zinc-800"
          >
            <div className="aspect-[5/4] bg-zinc-200/80 dark:bg-zinc-800" />
            <div className="space-y-2 p-3">
              <div className="h-4 w-3/4 rounded bg-zinc-200/80 dark:bg-zinc-800" />
              <div className="h-3 w-1/2 rounded bg-zinc-200/60 dark:bg-zinc-800/80" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
