"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import ViewErrorBanner from "@/components/layout/ViewErrorBanner";
import { ApiError } from "@/services/apiClient";
import {
  deleteShippingLine,
  fetchShippingLineByCode,
  updateShippingLine,
} from "@/services/catalogs/shippingLineService";
import type { ShippingLineDetail } from "@/types/cruise";
import type { ShippingLineFormSubmitPayload } from "@/views/ShippingLinesView/ShippingLineFormModal";
import ShippingLineFormModal from "@/views/ShippingLinesView/ShippingLineFormModal";
import ShippingLineDetailHero from "./ShippingLineDetailHero";
import ShippingLineDetailSkeleton from "./ShippingLineDetailSkeleton";
import ShippingLineDetailsSection from "./ShippingLineDetailsSection";
import ShippingLineVesselsSection from "./ShippingLineVesselsSection";

export default function ShippingLineDetailView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code")?.trim() ?? "";

  const [line, setLine] = useState<ShippingLineDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewError, setViewError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadLine = useCallback(async () => {
    if (!code) {
      setViewError("Código de naviera no especificado.");
      setLine(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setViewError(null);
    try {
      const detail = await fetchShippingLineByCode(code);
      setLine(detail);
    } catch (err) {
      setViewError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "No se pudo cargar la naviera.",
      );
      setLine(null);
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    loadLine();
  }, [loadLine]);

  async function handleSave({ payload, logoFile, removeLogo }: ShippingLineFormSubmitPayload) {
    if (!line) return;
    setSaving(true);
    setViewError(null);
    try {
      await updateShippingLine(line.id, payload, { logoFile, removeLogo });
      setEditOpen(false);
      await loadLine();
    } catch (err) {
      setViewError(err instanceof ApiError ? err.message : "No se pudo guardar la naviera.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!line) return;
    setViewError(null);
    try {
      await deleteShippingLine(line.id);
      router.push("/shipping-lines");
    } catch (err) {
      setViewError(err instanceof ApiError ? err.message : "No se pudo eliminar la naviera.");
    }
  }

  if (loading) return <ShippingLineDetailSkeleton />;

  if (!line) {
    return (
      <ViewErrorBanner
        message={viewError ?? "Naviera no disponible."}
        onDismiss={() => router.push("/shipping-lines")}
      />
    );
  }

  return (
    <div className="pb-8">
      {viewError && <ViewErrorBanner message={viewError} onDismiss={() => setViewError(null)} />}

      <ShippingLineDetailHero line={line} onEdit={() => setEditOpen(true)} onDelete={handleDelete} />

      <div className="mt-6 space-y-6">
        <ShippingLineDetailsSection line={line} />
        <ShippingLineVesselsSection line={line} onChange={loadLine} />
      </div>

      <ShippingLineFormModal
        open={editOpen}
        mode="edit"
        initial={line}
        saving={saving}
        onClose={() => !saving && setEditOpen(false)}
        onSubmit={handleSave}
      />
    </div>
  );
}
