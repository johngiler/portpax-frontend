/**
 * Barra lateral del layout (ej. admin dashboard).
 */
export default function Sidebar() {
  return (
    <aside className="w-56 border-r border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50">
      <nav className="flex flex-col gap-1 p-3">
        <span className="px-3 py-2 text-sm text-zinc-500 dark:text-zinc-400">Navegación</span>
        {/* Enlaces del admin según módulos */}
      </nav>
    </aside>
  );
}
