"use client";

import ViewPageHeader from "@/components/layout/ViewPageHeader";
import MainTable, {
  MainTableBody,
  MainTableHeader,
  MainTableRow,
  MainTableTh,
} from "@/components/tables/MainTable";
import Skeleton, { SkeletonCircle, SkeletonLoader } from "@/components/ui/Skeleton";
import { Users } from "lucide-react";

const COLUMNS = 6;
const ROWS = 6;

export default function UsersViewSkeleton() {
  return (
    <>
      <ViewPageHeader
        icon={Users}
        title="Usuarios"
        description="Alta y gestión de cuentas del sistema, roles y acceso por puerto."
        actions={<SkeletonLoader className="h-10 w-40 rounded-md" />}
      />

      <MainTable>
        <table className="w-full min-w-[48rem]">
          <MainTableHeader>
            {["Usuario", "Nombre", "Correo", "Rol", "Estado", "Acciones"].map((label) => (
              <MainTableTh key={label}>
                <Skeleton className="h-4 w-16 rounded" />
              </MainTableTh>
            ))}
          </MainTableHeader>
          <MainTableBody>
            {Array.from({ length: ROWS }).map((_, rowIndex) => (
              <MainTableRow key={rowIndex}>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <SkeletonCircle className="h-8 w-8 shrink-0" />
                    <Skeleton className="h-4 w-24 rounded" />
                  </div>
                </td>
                {Array.from({ length: COLUMNS - 1 }).map((_, colIndex) => (
                  <td key={colIndex} className="px-5 py-3.5">
                    <Skeleton
                      className={`h-4 rounded ${
                        colIndex === COLUMNS - 2
                          ? "mx-auto w-16"
                          : "w-full max-w-[theme(spacing.40)]"
                      }`}
                    />
                  </td>
                ))}
              </MainTableRow>
            ))}
          </MainTableBody>
        </table>
      </MainTable>

      <div className="mt-4 flex justify-center">
        <SkeletonLoader className="h-9 w-48 rounded-md" />
      </div>
    </>
  );
}
