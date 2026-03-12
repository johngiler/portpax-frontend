/**
 * Landing page (público).
 * Reúne secciones de sections/landing/.
 */
export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <main className="mx-auto max-w-4xl px-4 py-16">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          PortPax
        </h1>
        <p className="mt-4 text-zinc-600 dark:text-zinc-400">
          Landing: secciones desde sections/landing/.
        </p>
      </main>
    </div>
  );
}
