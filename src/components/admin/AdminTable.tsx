/**
 * Tabla de datos del admin: estilo consistente y moderno.
 */
type AdminTableProps = {
  children: React.ReactNode;
  className?: string;
};

export default function AdminTable({ children, className = "" }: AdminTableProps) {
  return (
    <div
      className={`min-w-0 overflow-x-auto rounded-xl border border-[var(--admin-border)]/65 bg-[var(--admin-surface)] shadow-[var(--admin-card-shadow)] ${className}`}
    >
      {children}
    </div>
  );
}

export function AdminTableHeader({ children }: { children: React.ReactNode }) {
  return (
    <thead>
      <tr className="border-b border-[var(--admin-border)]/60 bg-[var(--admin-surface-muted)]">
        {children}
      </tr>
    </thead>
  );
}

export function AdminTableTh({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={`px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 ${className}`}
    >
      {children}
    </th>
  );
}

export function AdminTableBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-[var(--admin-border)]/45">{children}</tbody>;
}

export function AdminTableRow({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <tr
      className={`transition-colors hover:bg-[var(--admin-surface-muted)]/75 ${className}`}
    >
      {children}
    </tr>
  );
}

export function AdminTableTd({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={`px-5 py-3.5 text-sm text-zinc-700 dark:text-zinc-200 ${className}`}>
      {children}
    </td>
  );
}

export function AdminTableEmpty({ colSpan, children }: { colSpan: number; children: React.ReactNode }) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className="px-5 py-12 text-center text-sm text-zinc-500 dark:text-zinc-400"
      >
        {children}
      </td>
    </tr>
  );
}
