"use client";

import { Plus, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import DefaultButton from "@/components/buttons/DefaultButton";
import FilterActions from "@/components/layout/FilterActions";
import { FilterSidebarContent } from "@/components/layout/FilterSidebar";
import ViewErrorBanner from "@/components/layout/ViewErrorBanner";
import ViewPageHeader from "@/components/layout/ViewPageHeader";
import MainTable, {
  MainTableBody,
  MainTableEmpty,
  MainTableHeader,
  MainTableRow,
  MainTableTd,
  MainTableTh,
} from "@/components/tables/MainTable";
import TableActionButtons from "@/components/tables/TableActionButtons";
import TablePagination from "@/components/tables/TablePagination";
import EntityThumb from "@/components/ui/EntityThumb";
import { FormField } from "@/components/ui/FormField";
import { useAuth } from "@/contexts/AuthContext";
import { getApiErrorMessage } from "@/lib/apiFormErrors";
import {
  createUser,
  deleteUser,
  fetchUsers,
  updateUser,
} from "@/services/accounts/userService";
import { fetchPorts } from "@/services/catalogs/portService";
import type { ManagedUser, ManagedUserPayload } from "@/types/accounts";
import { userRoleLabel } from "@/types/accounts";
import { portDisplayName } from "@/types/catalog";
import UserFormModal, { type UserFormMode } from "./UserFormModal";
import UsersViewSkeleton from "./UsersViewSkeleton";

const PAGE_SIZE = 20;

export default function UsersView() {
  const { user } = useAuth();
  const router = useRouter();
  const isAdmin = user?.role === "admin";

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [portOptions, setPortOptions] = useState<{ value: number; label: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewError, setViewError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<UserFormMode>("create");
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user && !isAdmin) {
      router.replace("/");
    }
  }, [user, isAdmin, router]);

  useEffect(() => {
    fetchPorts({ pageSize: 100 })
      .then((data) =>
        setPortOptions(
          data.results.map((port) => ({ value: port.id, label: portDisplayName(port) })),
        ),
      )
      .catch(() => setPortOptions([]));
  }, []);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setViewError(null);
    try {
      const data = await fetchUsers({
        page,
        search: appliedSearch,
        pageSize: PAGE_SIZE,
      });
      setUsers(data.results);
      setTotalCount(data.count);
    } catch (err) {
      setViewError(getApiErrorMessage(err, "No se pudieron cargar los usuarios."));
      setUsers([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [page, appliedSearch]);

  useEffect(() => {
    if (!isAdmin) return;
    loadUsers();
  }, [isAdmin, loadUsers]);

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
      await loadUsers();
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
      await loadUsers();
    } catch (err) {
      setViewError(getApiErrorMessage(err, "No se pudo eliminar el usuario."));
    }
  }

  function applyFilters() {
    setPage(1);
    setAppliedSearch(search);
  }

  function clearFilters() {
    setSearch("");
    setAppliedSearch("");
    setPage(1);
  }

  if (!isAdmin) {
    return null;
  }

  if (loading && users.length === 0 && !viewError) {
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

      {viewError && <ViewErrorBanner message={viewError} onDismiss={() => setViewError(null)} />}

      <MainTable>
        <table className="w-full min-w-[48rem]">
          <MainTableHeader>
            <MainTableTh>Usuario</MainTableTh>
            <MainTableTh>Nombre</MainTableTh>
            <MainTableTh>Correo</MainTableTh>
            <MainTableTh>Rol</MainTableTh>
            <MainTableTh>Estado</MainTableTh>
            <MainTableTh className="text-center">Acciones</MainTableTh>
          </MainTableHeader>
          <MainTableBody>
            {loading ? (
              <MainTableEmpty colSpan={6}>Cargando…</MainTableEmpty>
            ) : users.length === 0 ? (
              <MainTableEmpty colSpan={6}>
                {appliedSearch
                  ? "Ningún usuario coincide con la búsqueda."
                  : "No hay usuarios registrados."}
              </MainTableEmpty>
            ) : (
              users.map((managed) => {
                const fullName = [managed.first_name, managed.last_name]
                  .filter(Boolean)
                  .join(" ");
                return (
                  <MainTableRow key={managed.id}>
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
                    <MainTableTd>{userRoleLabel(managed.role)}</MainTableTd>
                    <MainTableTd>
                      {managed.is_active ? "Activo" : "Inactivo"}
                    </MainTableTd>
                    <MainTableTd>
                      <TableActionButtons
                        onEdit={() => openEdit(managed)}
                        onDelete={
                          managed.id === user?.id
                            ? undefined
                            : () => handleDelete(managed)
                        }
                        deleteLabel={`el usuario ${managed.username}`}
                      />
                    </MainTableTd>
                  </MainTableRow>
                );
              })
            )}
          </MainTableBody>
        </table>
      </MainTable>

      <TablePagination
        page={page}
        pageSize={PAGE_SIZE}
        totalCount={totalCount}
        onPageChange={setPage}
      />

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
