/**
 * Pie de página del layout.
 */
export default function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex h-12 items-center justify-center px-4 text-sm text-zinc-500 dark:text-zinc-400">
        PortPax © {new Date().getFullYear()}
      </div>
    </footer>
  );
}
