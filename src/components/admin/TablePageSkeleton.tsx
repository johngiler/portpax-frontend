"use client";

import AdminTable, {
  AdminTableBody,
  AdminTableHeader,
  AdminTableRow,
  AdminTableTh,
} from "@/components/admin/AdminTable";
import Skeleton from "@/components/ui/Skeleton";

type TablePageSkeletonProps = {
  /** Número de columnas de la tabla (debe coincidir con la vista real). */
  columns: number;
  /** Número de filas de skeleton (por defecto 5). */
  rows?: number;
  /** Mostrar bloque de botón primario en el header (p. ej. "Nuevo X"). */
  withButton?: boolean;
};

/**
 * Skeleton con la misma estructura que las páginas de listado con tabla.
 * Si la vista cambia (columnas, botón, etc.), actualizar estos props.
 */
export default function TablePageSkeleton({
  columns,
  rows = 5,
  withButton = true,
}: TablePageSkeletonProps) {
  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-7 shrink-0 rounded" />
            <Skeleton className="h-8 w-40 rounded" />
          </div>
          <Skeleton className="mt-2 h-4 w-24 rounded" />
        </div>
        {withButton && <Skeleton className="h-10 w-36 rounded-md" />}
      </div>
      <AdminTable>
        <table className="w-full min-w-[theme(spacing.96)]">
          <AdminTableHeader>
            {Array.from({ length: columns }).map((_, i) => (
              <AdminTableTh key={i}>
                <Skeleton className="h-4 w-16 rounded" />
              </AdminTableTh>
            ))}
          </AdminTableHeader>
          <AdminTableBody>
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <AdminTableRow key={rowIndex}>
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <td key={colIndex} className="px-5 py-3.5">
                    <Skeleton
                      className={`h-4 rounded ${colIndex === columns - 1 ? "w-24" : "w-full max-w-[theme(spacing.48)]"}`}
                    />
                  </td>
                ))}
              </AdminTableRow>
            ))}
          </AdminTableBody>
        </table>
      </AdminTable>
    </div>
  );
}
