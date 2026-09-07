"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Tags } from "lucide-react";
import DefaultButton from "@/components/buttons/DefaultButton";
import ConfirmDeleteButton from "@/components/buttons/ConfirmDeleteButton";
import { FormField } from "@/components/ui/FormField";
import Modal from "@/components/ui/Modal";
import ModalFormError from "@/components/ui/ModalFormError";
import Skeleton from "@/components/ui/Skeleton";
import { getApiErrorMessage, submitModalForm } from "@/lib/apiFormErrors";
import {
  createBookingTag,
  deleteBookingTag,
  fetchBookingTags,
  updateBookingTag,
  type BookingTagOption,
} from "@/services/bookings/bookingTagService";

type BookingTagsModalProps = {
  open: boolean;
  onClose: () => void;
};

type FormMode = "list" | "create" | "edit";

type FormState = { name: string };

type FieldErrors = Partial<Record<keyof FormState, string>>;

function emptyForm(): FormState {
  return { name: "" };
}

function validate(form: FormState): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.name.trim()) errors.name = "Requerido";
  return errors;
}

export default function BookingTagsModal({ open, onClose }: BookingTagsModalProps) {
  const [tags, setTags] = useState<BookingTagOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>("list");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  const sortedTags = useMemo(
    () => [...tags].sort((a, b) => a.name.localeCompare(b.name, "es")),
    [tags],
  );

  async function reload() {
    setIsLoading(true);
    setListError(null);
    try {
      setTags(await fetchBookingTags());
    } catch (err) {
      setListError(getApiErrorMessage(err, "No se pudieron cargar los tags."));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    setFormMode("list");
    setEditingId(null);
    setForm(emptyForm());
    setErrors({});
    setSubmitError(null);
    setListError(null);
    setDeletingId(null);
    void reload();
  }, [open]);

  function setField(value: string) {
    setForm({ name: value });
    setErrors((prev) => {
      if (!prev.name) return prev;
      const next = { ...prev };
      delete next.name;
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

  function openEdit(tag: BookingTagOption) {
    setFormMode("edit");
    setEditingId(tag.id);
    setForm({ name: tag.name });
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

    setSaving(true);
    await submitModalForm(
      async () => {
        if (formMode === "edit" && editingId != null) {
          await updateBookingTag(editingId, { name: form.name.trim() });
        } else {
          await createBookingTag({ name: form.name.trim() });
        }
        await reload();
        backToList();
      },
      {
        fallback:
          formMode === "edit"
            ? "No se pudo actualizar el tag."
            : "No se pudo crear el tag.",
        setSubmitError,
        setFieldErrors: setErrors,
      },
    );
    setSaving(false);
  }

  async function handleDelete(tag: BookingTagOption) {
    setListError(null);
    setDeletingId(tag.id);
    try {
      await deleteBookingTag(tag.id);
      await reload();
      if (editingId === tag.id) backToList();
    } catch (err) {
      setListError(
        getApiErrorMessage(
          err,
          "No se pudo eliminar el tag. Puede estar asociado a reservas.",
        ),
      );
    } finally {
      setDeletingId(null);
    }
  }

  const showForm = formMode === "create" || formMode === "edit";
  const formTitle = formMode === "edit" ? "Editar tag" : "Nuevo tag";

  return (
    <Modal
      open={open}
      onClose={() => !saving && onClose()}
      title={showForm ? formTitle : "Tags"}
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
            <DefaultButton type="submit" form="booking-tag-form" disabled={saving}>
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
                Agregar tag
              </span>
            </DefaultButton>
          </>
        )
      }
    >
      {showForm ? (
        <form id="booking-tag-form" onSubmit={(e) => void handleSubmit(e)}>
          <ModalFormError message={submitError} />
          <FormField
            label="Nombre"
            name="tag_name"
            value={form.name}
            onChange={(value) => setField(String(value))}
            required
            error={errors.name}
            disabled={saving}
            placeholder="Temporada alta 2026"
          />
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
          ) : sortedTags.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-300 px-4 py-10 text-center dark:border-zinc-700">
              <Tags
                className="mx-auto h-8 w-8 text-zinc-300 dark:text-zinc-600"
                strokeWidth={1.75}
                aria-hidden
              />
              <p className="mt-3 text-sm font-medium text-zinc-700 dark:text-zinc-200">
                Sin tags registrados
              </p>
            </div>
          ) : (
            <ul className="max-h-[min(24rem,60vh)] space-y-2 overflow-y-auto pr-1">
              {sortedTags.map((tag) => (
                <li
                  key={tag.id}
                  className="flex items-center gap-3 rounded-xl border border-zinc-200/80 px-3 py-2.5 dark:border-zinc-800"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                      {tag.name}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openEdit(tag)}
                    disabled={deletingId === tag.id}
                    className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                    aria-label={`Editar ${tag.name}`}
                    title="Editar"
                  >
                    <Pencil className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                  <ConfirmDeleteButton
                    deleteLabel={tag.name}
                    onDelete={() => void handleDelete(tag)}
                    disabled={deletingId === tag.id}
                    className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/40"
                    ariaLabel={`Eliminar ${tag.name}`}
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
