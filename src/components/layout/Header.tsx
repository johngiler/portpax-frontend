/**
 * Cabecera global del layout (admin y/o landing).
 */
export default function Header() {
  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex h-14 items-center px-4">
        <span className="font-semibold text-zinc-900 dark:text-zinc-50">PortPax</span>
      </div>
    </header>
  );
}
