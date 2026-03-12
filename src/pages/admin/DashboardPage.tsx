/**
 * Página principal del admin de PortPax (core de la app).
 * Reúne secciones de sections/admin/.
 */
export default function DashboardPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 p-6">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Dashboard
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Aquí irán las secciones del admin (sections/admin/).
        </p>
      </main>
    </div>
  );
}
