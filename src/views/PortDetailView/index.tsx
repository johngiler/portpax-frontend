"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import ViewErrorBanner from "@/components/layout/ViewErrorBanner";
import { useAuth } from "@/contexts/AuthContext";
import { getApiErrorMessage } from "@/lib/apiFormErrors";
import { canWriteApp } from "@/lib/navAccess";
import {
  deletePort,
  fetchPortDetail,
  fetchPorts,
  updatePort,
} from "@/services/catalogs/portService";
import type { PortDetail } from "@/types/catalog";
import PortFormModal, { type PortFormSubmitPayload } from "@/views/PortsView/PortFormModal";
import PortBerthsSection from "./PortBerthsSection";
import PortBollardsSection from "./PortBollardsSection";
import PortFendersSection from "./PortFendersSection";
import PortDetailHero from "./PortDetailHero";
import PortDetailSkeleton from "./PortDetailSkeleton";
import PortDetailsSection from "./PortDetailsSection";
import PortGallerySection from "./PortGallerySection";
import PortPositionsSection from "./PortPositionsSection";

export default function PortDetailView() {
  const router = useRouter();
  const { user } = useAuth();
  const canWrite = canWriteApp(user?.role);
  const searchParams = useSearchParams();
  const code = searchParams.get("code")?.trim() ?? "";

  const [port, setPort] = useState<PortDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewError, setViewError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadPort = useCallback(async () => {
    if (!code) {
      setViewError("Código de puerto no especificado.");
      setPort(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setViewError(null);
    try {
      const list = await fetchPorts({ pageSize: 100, search: code });
      const match =
        list.results.find((p) => p.code === code) ??
        list.results.find((p) => p.code.includes(code));
      if (!match) {
        setViewError("Puerto no encontrado.");
        setPort(null);
        return;
      }
      const detail = await fetchPortDetail(match.id);
      setPort(detail);
    } catch (err) {
      setViewError(
        getApiErrorMessage(err, "No se pudo cargar el puerto."),
      );
      setPort(null);
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    loadPort();
  }, [loadPort]);

  async function handleSave({ payload, logoFile, removeLogo }: PortFormSubmitPayload) {
    if (!port) return;
    setSaving(true);
    try {
      await updatePort(port.id, payload, { logoFile, removeLogo });
      setEditOpen(false);
      await loadPort();
    } catch (err) {
      throw err;
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!port) return;
    setViewError(null);
    try {
      await deletePort(port.id);
      router.push("/ports");
    } catch (err) {
      setViewError(getApiErrorMessage(err, "No se pudo eliminar el puerto."));
    }
  }

  if (loading) return <PortDetailSkeleton />;

  if (!port) {
    return (
      <ViewErrorBanner
        message={viewError ?? "Puerto no disponible."}
        onDismiss={() => router.push("/ports")}
      />
    );
  }

  return (
    <div className="pb-8">
      {viewError && <ViewErrorBanner message={viewError} onDismiss={() => setViewError(null)} />}

      <PortDetailHero
        port={port}
        canWrite={canWrite}
        onEdit={() => setEditOpen(true)}
        onDelete={handleDelete}
      />

      <div className="mt-6 space-y-6">
      <PortDetailsSection port={port} />

      <PortBollardsSection
        portId={port.id}
        bollards={port.bollards}
        total={port.bollard_total}
        onChange={loadPort}
        canWrite={canWrite}
      />

      <PortFendersSection
        portId={port.id}
        fenders={port.fenders}
        total={port.fender_total}
        onChange={loadPort}
        canWrite={canWrite}
      />

      <PortGallerySection
        portId={port.id}
        images={port.images}
        onChange={loadPort}
        canWrite={canWrite}
      />

      <PortBerthsSection
        portId={port.id}
        berths={port.berths}
        onChange={loadPort}
        canWrite={canWrite}
      />

      <PortPositionsSection port={port} onChange={loadPort} canWrite={canWrite} />
      </div>

      {canWrite ? (
        <PortFormModal
          open={editOpen}
          mode="edit"
          initial={port}
          saving={saving}
          onClose={() => !saving && setEditOpen(false)}
          onSubmit={handleSave}
        />
      ) : null}
    </div>
  );
}
