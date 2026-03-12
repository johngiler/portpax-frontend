"use client";

import { useState, useEffect } from "react";
import type { ShippingLine } from "@/lib/docking";
import { createShippingLine, updateShippingLine } from "@/lib/docking";
import Modal from "@/components/ui/Modal";
import { FormField } from "@/components/ui/FormField";

type Props = {
  open: boolean;
  onClose: () => void;
  edit: ShippingLine | null;
  onSuccess: () => void;
};

export default function ShippingLineFormModal({ open, onClose, edit, onSuccess }: Props) {
  const [name, setName] = useState(edit?.name ?? "");
  const [code, setCode] = useState(edit?.code ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = edit != null;

  useEffect(() => {
    if (open) {
      setName(edit?.name ?? "");
      setCode(edit?.code ?? "");
      setError(null);
    }
  }, [open, edit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      if (isEdit) {
        await updateShippingLine(edit.id, { name: name.trim(), code: code.trim() || undefined });
      } else {
        await createShippingLine({ name: name.trim(), code: code.trim() || undefined });
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Editar naviera" : "Nueva naviera"}
      panelClassName="max-w-2xl"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-full px-4 py-2.5 text-sm font-medium text-zinc-600 transition-colors duration-200 hover:bg-black/5 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-zinc-100"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="shipping-line-form"
            disabled={saving || !name.trim()}
            className="btn-primary-gradient cursor-pointer rounded-md px-4 py-2.5 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(15,23,42,0.18)] transition-all hover:brightness-105 hover:shadow-[0_8px_22px_-14px_rgba(52,120,181,0.7)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Guardando…" : isEdit ? "Guardar" : "Crear"}
          </button>
        </>
      }
    >
      <form id="shipping-line-form" onSubmit={handleSubmit}>
        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
            {error}
          </div>
        )}
        <FormField label="Nombre" name="name" value={name} onChange={setName} required />
        <FormField label="Código" name="code" value={code} onChange={setCode} placeholder="Ej. CCL" />
      </form>
    </Modal>
  );
}
