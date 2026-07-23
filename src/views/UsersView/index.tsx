"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import DefaultButton from "@/components/buttons/DefaultButton";
import FilterActions from "@/components/layout/FilterActions";
import { FilterSidebarContent } from "@/components/layout/FilterSidebar";
import ViewErrorBanner from "@/components/layout/ViewErrorBanner";
import ViewPageHeader from "@/components/layout/ViewPageHeader";
import MainTable, {
  AccordionTableRow,
  MainTableBody,
  MainTableEmpty,
  MainTableHeader,
  MainTableTd,
  MainTableTh,
} from "@/components/tables/MainTable";
import TableActionButtons from "@/components/tables/TableActionButtons";
import TablePagination from "@/components/tables/TablePagination";
import EmptyState from "@/components/ui/EmptyState";
import EntityThumb from "@/components/ui/EntityThumb";
import { FormField } from "@/components/ui/FormField";
import { useAuth } from "@/contexts/AuthContext";
import { useActivePortsCatalog } from "@/hooks/swr/useCatalogs";
import { useUsersPage } from "@/hooks/swr/useUsersPage";
import { getApiErrorMessage } from "@/lib/apiFormErrors";
import { roleHomePath } from "@/lib/navAccess";
import { revalidateUsersLists } from "@/lib/swr/mutateHelpers";
import {
  createUser,
  deleteUser,
  updateUser,
} from "@/services/accounts/userService";
import type { ManagedUser, ManagedUserPayload } from "@/types/accounts";
import { portDisplayName } from "@/types/catalog";
import RoleLabelWithInfo from "./RoleLabelWithInfo";
import UserFormModal, { type UserFormMode } from "./UserFormModal";
import UserRowDetail from "./UserRowDetail";
import UsersViewSkeleton from "./UsersViewSkeleton";

const PAGE_SIZE = 20;

export default function UsersView() {
  const { user } = useAuth();
  const router = useRouter();
  const isAdmin = user?.role === "admin";

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [viewError, setViewError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<UserFormMode>("create");
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [saving, setSaving] = useState(false);
  const [expandedUserId, setExpandedUserId] = useState<number | null>(null);

  const { ports } = useActivePortsCatalog(isAdmin);
  const portOptions = useMemo(
    () =>
      ports.map((port) => ({
        value: port.id,
        label: portDisplayName(port),
        logoUrl: port.logo,
      })),
    [ports],
  );

  const { users, totalCount, isLoading, error, mutate } = useUsersPage(
    page,
    appliedSearch,
    isAdmin,
    PAGE_SIZE,
  );

  useEffect(() => {
    if (user && !isAdmin) {
      router.replace(roleHomePath(user?.role));
    }
  }, [user, isAdmin, router]);

  useEffect(() => {
    if (error) {
      setViewError(getApiErrorMessage(error, "No se pudieron cargar los usuarios."));
    }
  }, [error]);

  useEffect(() => {
    setExpandedUserId(null);
  }, [page, appliedSearch]);

  function openCreate() {
    setModalMode("create");
    setEditingUser(null);
    setModalOpen(true);
  }

  function openEdit(managed: ManagedUser) {
    setModalMode("edit");
    setEditingUser(managed);
    setModalOpen(true);
  }

  async function handleSave(payload: ManagedUserPayload) {
    setSaving(true);
    try {
      if (modalMode === "create") {
        await createUser(payload);
      } else if (editingUser) {
        await updateUser(editingUser.id, payload);
      }
      setModalOpen(false);
      await revalidateUsersLists();
      await mutate();
    } catch (err) {
      throw err;
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(managed: ManagedUser) {
    setViewError(null);
    try {
      await deleteUser(managed.id);
      await revalidateUsersLists();
      await mutate();
    } catch (err) {
      setViewError(getApiErrorMessage(err, "No se pudo eliminar el usuario."));
    }
  }

  function applyFilters() {
    setPage(1);
    setAppliedSearch(search);
    setViewError(null);
  }

  function clearFilters() {
    setSearch("");
    setAppliedSearch("");
    setPage(1);
    setViewError(null);
  }

  if (!isAdmin) {
    return null;
  }

  if (isLoading && users.length === 0 && !viewError) {
    return <UsersViewSkeleton />;
  }

  return (
    <>
      <FilterSidebarContent>
        <FormField
          label="Buscar"
          name="user_search"
          value={search}
          onChange={(v) => setSearch(String(v))}
          placeholder="Usuario, correo, nombre…"
          compact
        />
        <FilterActions
          onApply={applyFilters}
          onClear={clearFilters}
          canClear={Boolean(search.trim()) || Boolean(appliedSearch)}
        />
      </FilterSidebarContent>

      <ViewPageHeader
        icon={Users}
        title="Usuarios"
        description="Alta y gestión de cuentas del sistema, roles y acceso por puerto."
        actions={
          <DefaultButton type="button" onClick={openCreate}>
            <span className="inline-flex items-center gap-2">
              <Plus className="h-4 w-4" strokeWidth={2} />
              Nuevo usuario
            </span>
          </DefaultButton>
        }
      />

      {viewError && (
        <ViewErrorBanner message={viewError} onDismiss={() => setViewError(null)} />
      )}

      {!isLoading && users.length === 0 ? (
        <EmptyState
          icon={Users}
          filtered={Boolean(appliedSearch)}
          title={
            appliedSearch
              ? "Sin usuarios con esta búsqueda"
              : "Aún no hay usuarios"
          }
          description={
            appliedSearch
              ? "Ajusta la búsqueda o registra una nueva cuenta del sistema."
              : "Registra cuentas para asignar roles y acceso por puerto."
          }
          primaryAction={{
            label: "Nuevo usuario",
            onClick: openCreate,
            icon: Plus,
          }}
          onClearFilters={clearFilters}
        />
      ) : (
        <MainTable>
          <table className="w-full min-w-[48rem]">
            <MainTableHeader>
              <MainTableTh>Usuario</MainTableTh>
              <MainTableTh>Nombre</MainTableTh>
              <MainTableTh>Correo</MainTableTh>
              <MainTableTh>Rol</MainTableTh>
              <MainTableTh>Estado</MainTableTh>
              <MainTableTh>Acciones</MainTableTh>
            </MainTableHeader>
            <MainTableBody>
              {isLoading ? (
                <MainTableEmpty colSpan={6}>Cargando…</MainTableEmpty>
              ) : (
                users.map((managed) => {
                  const fullName = [managed.first_name, managed.last_name]
                    .filter(Boolean)
                    .join(" ");
                  const isExpanded = expandedUserId === managed.id;
                  const portLabels = managed.port_ids
                    .map(
                      (id) =>
                        portOptions.find((option) => option.value === id)?.label,
                    )
                    .filter((label): label is string => Boolean(label));
                  return (
                    <AccordionTableRow
                      key={managed.id}
                      colSpan={6}
                      showRowToggle={false}
                      open={isExpanded}
                      onOpenChange={(open) =>
                        setExpandedUserId(open ? managed.id : null)
                      }
                      expandContent={
                        <UserRowDetail user={managed} portLabels={portLabels} />
                      }
                    >
                      <MainTableTd className="font-medium">
                        <div className="flex items-center gap-2.5">
                          <EntityThumb
                            src={managed.avatar}
                            label={fullName || managed.username}
                            size="sm"
                          />
                          <span>{managed.username}</span>
                        </div>
                      </MainTableTd>
                      <MainTableTd>{fullName || "—"}</MainTableTd>
                      <MainTableTd>{managed.email || "—"}</MainTableTd>
                      <MainTableTd>
                        <RoleLabelWithInfo role={managed.role} />
                      </MainTableTd>
                      <MainTableTd>
                        {managed.is_active ? "Activo" : "Inactivo"}
                      </MainTableTd>
                      <MainTableTd>
                        <TableActionButtons
                          onView={() =>
                            setExpandedUserId(isExpanded ? null : managed.id)
                          }
                          viewActive={isExpanded}
                          onEdit={() => openEdit(managed)}
                          onDelete={
                            managed.id === user?.id
                              ? undefined
                              : () => handleDelete(managed)
                          }
                          deleteLabel={`el usuario ${managed.username}`}
                        />
                      </MainTableTd>
                    </AccordionTableRow>
                  );
                })
              )}
            </MainTableBody>
          </table>
        </MainTable>
      )}

      {users.length > 0 ? (
        <TablePagination
          page={page}
          pageSize={PAGE_SIZE}
          totalCount={totalCount}
          onPageChange={setPage}
        />
      ) : null}

      <UserFormModal
        open={modalOpen}
        mode={modalMode}
        initial={editingUser}
        portOptions={portOptions}
        saving={saving}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSave}
      />
    </>
  );
}
