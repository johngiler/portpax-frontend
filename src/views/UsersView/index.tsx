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
import { getApiErrorMessage } from "@/lib/apiFormErrors";
import { roleHomePath } from "@/lib/navAccess";
import {
  createUser,
  deleteUser,
  fetchUsers,
  updateUser,
} from "@/services/accounts/userService";
import { fetchPorts } from "@/services/catalogs/portService";
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

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [portOptions, setPortOptions] = useState<
    { value: number; label: string; logoUrl?: string | null }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [viewError, setViewError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<UserFormMode>("create");
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [saving, setSaving] = useState(false);
  const [expandedUserId, setExpandedUserId] = useState<number | null>(null);

  useEffect(() => {
    if (user && !isAdmin) {
      router.replace(roleHomePath(user?.role));
    }
  }, [user, isAdmin, router]);

  useEffect(() => {
    fetchPorts({ pageSize: 100 })
      .then((data) =>
        setPortOptions(
          data.results.map((port) => ({
            value: port.id,
            label: portDisplayName(port),
            logoUrl: port.logo,
          })),
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

      {!loading && users.length === 0 ? (
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
            {loading ? (
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
