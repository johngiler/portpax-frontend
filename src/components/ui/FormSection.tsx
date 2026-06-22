import type { ReactNode } from "react";

type FormSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
  columns?: 1 | 2;
};

export default function FormSection({
  title,
  description,
  children,
  columns = 2,
}: FormSectionProps) {
  return (
    <section className="rounded-xl border border-zinc-200/80 bg-zinc-50/40 p-4 sm:p-5 dark:border-zinc-800 dark:bg-zinc-950/30">
      <div className="mb-4">
        <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {title}
        </h3>
        {description && (
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{description}</p>
        )}
      </div>
      <div
        className={
          columns === 2 ? "grid gap-x-4 sm:grid-cols-2" : "grid gap-x-4 grid-cols-1"
        }
      >
        {children}
      </div>
    </section>
  );
}
