export default function LtaAgreementsViewSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-16 rounded-2xl bg-zinc-200/80 dark:bg-zinc-800" />
      <ul className="space-y-3 md:hidden">
        {[0, 1, 2].map((key) => (
          <li
            key={key}
            className="h-36 rounded-2xl bg-zinc-200/70 dark:bg-zinc-800/80"
          />
        ))}
      </ul>
      <div className="hidden h-72 rounded-xl bg-zinc-200/60 md:block dark:bg-zinc-800/80" />
    </div>
  );
}
