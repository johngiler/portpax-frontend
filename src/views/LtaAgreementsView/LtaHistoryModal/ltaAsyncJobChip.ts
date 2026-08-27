/** Friendly chip copy for LTA Celery job audits (link / resync / destroy). */

export type LtaAsyncJobKind =
  | "link"
  | "resync"
  | "destroy"
  | "generate"
  | "regenerate";
export type LtaAsyncJobStatus = "queued" | "success" | "failed";

export type LtaAsyncJobChip = {
  label: string;
  tooltip: string;
  tone: "queued" | "success" | "failed";
};

const CHIP_BY_KIND: Record<
  LtaAsyncJobKind,
  Record<LtaAsyncJobStatus, Omit<LtaAsyncJobChip, "tone">>
> = {
  link: {
    queued: {
      label: "Enlazando LTA",
      tooltip:
        "Enlazando el acuerdo LTA con las reservas existentes que cumplen las reglas del contrato.",
    },
    success: {
      label: "LTA enlazado",
      tooltip:
        "Se vinculó el acuerdo a las reservas coincidentes (mismo puerto, naviera, cadencia y reglas).",
    },
    failed: {
      label: "Error al enlazar",
      tooltip:
        "No se pudo completar el enlace del acuerdo con las reservas. Revisa el detalle del error o vuelve a intentar.",
    },
  },
  resync: {
    queued: {
      label: "Re-sincronizando LTA",
      tooltip:
        "Actualizando vínculos: se desvinculan reservas que ya no aplican y se enlazan las que ahora coinciden.",
    },
    success: {
      label: "LTA re-sincronizado",
      tooltip:
        "Se actualizaron los vínculos del acuerdo: se quitaron reservas que ya no aplican y se añadieron las que ahora coinciden.",
    },
    failed: {
      label: "Error al re-sincronizar",
      tooltip:
        "No se pudo re-sincronizar los vínculos del acuerdo. Las reservas pueden quedar como estaban antes del job.",
    },
  },
  destroy: {
    queued: {
      label: "Eliminando LTA",
      tooltip:
        "Desvinculando reservas del acuerdo y eliminándolo en segundo plano.",
    },
    success: {
      label: "LTA eliminado",
      tooltip:
        "Se desvincularon las reservas asociadas y se eliminó el acuerdo.",
    },
    failed: {
      label: "Error al eliminar",
      tooltip:
        "No se pudo completar la eliminación. El acuerdo puede seguir existiendo hasta reintentar.",
    },
  },
  generate: {
    queued: {
      label: "Generando reservas LTA",
      tooltip:
        "Creando reservas en estado LTA para las fechas de la zona LTA × cada posición (primer barco del acuerdo).",
    },
    success: {
      label: "Reservas LTA generadas",
      tooltip:
        "Se crearon las reservas faltantes en estado LTA según las reglas del acuerdo.",
    },
    failed: {
      label: "Error al generar",
      tooltip:
        "No se pudieron generar las reservas. Revisa barcos/posiciones o el detalle del error.",
    },
  },
  regenerate: {
    queued: {
      label: "Regenerando LTA",
      tooltip:
        "Re-sincronizando vínculos y creando las reservas LTA que faltan en la zona del acuerdo.",
    },
    success: {
      label: "LTA regenerado",
      tooltip:
        "Se actualizaron los vínculos y se materializaron los huecos del acuerdo.",
    },
    failed: {
      label: "Error al regenerar",
      tooltip:
        "No se pudo regenerar. Revisa el historial o vuelve a intentar.",
    },
  },
};

const FALLBACK_BY_STATUS: Record<
  LtaAsyncJobStatus,
  Omit<LtaAsyncJobChip, "tone">
> = {
  queued: {
    label: "Procesando en segundo plano",
    tooltip: "La tarea asíncrona del acuerdo LTA está en cola o en ejecución.",
  },
  success: {
    label: "Proceso completado",
    tooltip: "La tarea asíncrona del acuerdo LTA terminó correctamente.",
  },
  failed: {
    label: "Proceso con error",
    tooltip: "La tarea asíncrona del acuerdo LTA falló. Revisa el detalle del error.",
  },
};

function asJobStatus(value: unknown): LtaAsyncJobStatus | null {
  if (value === "queued" || value === "success" || value === "failed") {
    return value;
  }
  return null;
}

function asJobKind(value: unknown): LtaAsyncJobKind | null {
  if (
    value === "link" ||
    value === "resync" ||
    value === "destroy" ||
    value === "generate" ||
    value === "regenerate"
  ) {
    return value;
  }
  return null;
}

/** Resolve chip label + tooltip from audit `changes` (job_status / job_kind). */
export function resolveLtaAsyncJobChip(
  changes: Record<string, unknown> | null | undefined,
): LtaAsyncJobChip | null {
  if (!changes || typeof changes !== "object") return null;
  const status = asJobStatus(changes.job_status);
  if (!status) return null;
  const kind = asJobKind(changes.job_kind);
  const copy = kind
    ? CHIP_BY_KIND[kind][status]
    : FALLBACK_BY_STATUS[status];
  return { ...copy, tone: status };
}
