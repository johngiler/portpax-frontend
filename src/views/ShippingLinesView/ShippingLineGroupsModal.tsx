"use client";

import { useEffect, useMemo, useState } from "react";
import { Layers, Pencil, Plus } from "lucide-react";
import DefaultButton from "@/components/buttons/DefaultButton";
import ConfirmDeleteButton from "@/components/buttons/ConfirmDeleteButton";
import { FormField } from "@/components/ui/FormField";
import Modal from "@/components/ui/Modal";
import ModalFormError from "@/components/ui/ModalFormError";
import Skeleton from "@/components/ui/Skeleton";
import { useShippingLineGroupsCatalog } from "@/hooks/swr/useCatalogs";
import { getApiErrorMessage, submitModalForm } from "@/lib/apiFormErrors";
import { revalidateShippingLinesLists } from "@/lib/swr/mutateHelpers";
import {
  createShippingLineGroup,
  deleteShippingLineGroup,
  updateShippingLineGroup,
} from "@/services/catalogs/shippingLineGroupService";
import type { ShippingLineGroup, ShippingLineGroupPayload } from "@/types/cruise";

type ShippingLineGroupsModalProps = {
  open: boolean;
  onClose: () => void;
};

type FormMode = "list" | "create" | "edit";

type FormState = ShippingLineGroupPayload;

type FieldErrors = Partial<Record<keyof FormState, string>>;

function catalogCodeFromName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, "_");
}

function emptyForm(): FormState {
  return {
    name: "",
    code: "",
    is_active: true,
  };
}

function groupToForm(group: ShippingLineGroup): FormState {
  return {
    name: group.name,
    code: group.code,
    is_active: group.is_active,
  };
}

function validate(form: FormState): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.name.trim()) errors.name = "Requerido";
  if (!form.code.trim()) errors.code = "Requerido";
  return errors;
}

function groupStatusLabel(isActive: boolean): string {
  return isActive ? "Activo" : "Inactivo";
}

export default function ShippingLineGroupsModal({
  open,
  onClose,
}: ShippingLineGroupsModalProps) {
  const { groups, isLoading, mutate } = useShippingLineGroupsCatalog(open);
  const [formMode, setFormMode] = useState<FormMode>("list");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  const sortedGroups = useMemo(
    () => [...groups].sort((a, b) => a.name.localeCompare(b.name, "es")),
    [groups],
  );

  useEffect(() => {
    if (!open) return;
    setFormMode("list");
    setEditingId(null);
    setForm(emptyForm());
    setErrors({});
    setSubmitError(null);
    setListError(null);
    setDeletingId(null);
  }, [open]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (formMode === "create" && key === "name" && typeof value === "string") {
        next.code = catalogCodeFromName(value);
      }
      return next;
    });
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function openCreate() {
    setFormMode("create");
    setEditingId(null);
    setForm(emptyForm());
    setErrors({});
    setSubmitError(null);
  }

  function openEdit(group: ShippingLineGroup) {
    setFormMode("edit");
    setEditingId(group.id);
    setForm(groupToForm(group));
    setErrors({});
    setSubmitError(null);
  }

  function backToList() {
    if (saving) return;
    setFormMode("list");
    setEditingId(null);
    setForm(emptyForm());
    setErrors({});
    setSubmitError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors = validate(form);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const payload: ShippingLineGroupPayload = {
      name: form.name.trim(),
      code: form.code.trim(),
      is_active: form.is_active,
    };

    setSaving(true);
    await submitModalForm(
      async () => {
        if (formMode === "edit" && editingId != null) {
          await updateShippingLineGroup(editingId, payload);
        } else {
          await createShippingLineGroup(payload);
        }
        await mutate();
        await revalidateShippingLinesLists();
        backToList();
      },
      {
        fallback:
          formMode === "edit"
            ? "No se pudo actualizar el grupo."
            : "No se pudo crear el grupo.",
        setSubmitError,
        setFieldErrors: setErrors,
      },
    );
    setSaving(false);
  }

  async function handleDelete(group: ShippingLineGroup) {
    setListError(null);
    setDeletingId(group.id);
    try {
      await deleteShippingLineGroup(group.id);
      await mutate();
      await revalidateShippingLinesLists();
      if (editingId === group.id) backToList();
    } catch (err) {
      setListError(
        getApiErrorMessage(
          err,
          "No se pudo eliminar el grupo. Puede tener navieras asociadas.",
        ),
      );
    } finally {
      setDeletingId(null);
    }
  }

  const showForm = formMode === "create" || formMode === "edit";
  const formTitle = formMode === "edit" ? "Editar grupo" : "Nuevo grupo";

  return (
    <Modal
      open={open}
      onClose={() => !saving && onClose()}
      title={showForm ? formTitle : "Grupos"}
      panelClassName="max-w-lg"
      footer={
        showForm ? (
          <>
            <button
              type="button"
              onClick={backToList}
              disabled={saving}
              className="cursor-pointer rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Cancelar
            </button>
            <DefaultButton type="submit" form="shipping-line-group-form" disabled={saving}>
              {saving ? "Guardando…" : "Guardar"}
            </DefaultButton>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Cerrar
            </button>
            <DefaultButton type="button" onClick={openCreate}>
              <span className="inline-flex items-center gap-2">
                <Plus className="h-4 w-4" strokeWidth={2} />
                Agregar grupo
              </span>
            </DefaultButton>
          </>
        )
      }
    >
      {showForm ? (
        <form id="shipping-line-group-form" onSubmit={(e) => void handleSubmit(e)}>
          <ModalFormError message={submitError} />
          <div className="space-y-4">
            <FormField
              label="Nombre"
              name="group_name"
              value={form.name}
              onChange={(value) => setField("name", String(value))}
              required
              error={errors.name}
              disabled={saving}
              placeholder="Carnival Corporation"
            />
            <FormField
              label="Código"
              name="group_code"
              value={form.code}
              onChange={(value) => setField("code", String(value))}
              required
              error={errors.code}
              disabled={saving || formMode === "edit"}
              placeholder="carnival_corporation"
            />
            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-zinc-200/80 bg-zinc-50/40 p-4 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950/30 dark:text-zinc-200">
              <span className="font-medium">Grupo activo</span>
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(event) => setField("is_active", event.target.checked)}
                disabled={saving}
                className="h-4 w-4 cursor-pointer rounded border-[var(--admin-border)]"
              />
            </label>
          </div>
        </form>
      ) : (
        <>
          <ModalFormError message={listError} />
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          ) : sortedGroups.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-300 px-4 py-10 text-center dark:border-zinc-700">
              <Layers
                className="mx-auto h-8 w-8 text-zinc-300 dark:text-zinc-600"
                strokeWidth={1.75}
                aria-hidden
              />
              <p className="mt-3 text-sm font-medium text-zinc-700 dark:text-zinc-200">
                Sin grupos registrados
              </p>
            </div>
          ) : (
            <ul className="max-h-[min(24rem,60vh)] space-y-2 overflow-y-auto pr-1">
              {sortedGroups.map((group) => (
                <li
                  key={group.id}
                  className="flex items-center gap-3 rounded-xl border border-zinc-200/80 px-3 py-2.5 dark:border-zinc-800"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                      {group.name}
                    </p>
                    <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                      {group.code} · {groupStatusLabel(group.is_active)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openEdit(group)}
                    disabled={deletingId === group.id}
                    className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                    aria-label={`Editar ${group.name}`}
                    title="Editar"
                  >
                    <Pencil className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                  <ConfirmDeleteButton
                    deleteLabel={group.name}
                    onDelete={() => void handleDelete(group)}
                    disabled={deletingId === group.id}
                    className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/40"
                    ariaLabel={`Eliminar ${group.name}`}
                  />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </Modal>
  );
}
