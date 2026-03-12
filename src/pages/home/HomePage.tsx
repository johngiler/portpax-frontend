/**
 * Página de inicio.
 * Las páginas en src/pages/ reúnen secciones (y las secciones reúnen componentes).
 */
export default function HomePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
          PortPax
        </h1>
        <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          Dashboard de gestión de puertos. Las rutas en <code className="text-sm">app/</code>{" "}
          importan las páginas desde <code className="text-sm">src/pages/</code>.
        </p>
      </main>
    </div>
  );
}
