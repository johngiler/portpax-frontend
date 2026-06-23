export default function CalendarOccupancyLegend() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2 border-t border-zinc-200/80 px-4 py-3 text-[11px] text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-amber-500/80" aria-hidden />
        Otras escalas en el puerto
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-violet-500/80" aria-hidden />
        Este barco en otro puerto
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="text-xs font-semibold text-amber-700/80 line-through dark:text-amber-400/80">
          23
        </span>
        Mismo barco ya reservado aquí
      </span>
    </div>
  );
}
