import type { BulkImportPreviewRow } from "@/services/bookings/bulkImportService";

export const GROUP_MAJORITY_MARK = "Grupo mayoritario:";

/**
 * Soft warning when most draft rows share one shipping-line group and this
 * row's vessel resolved to a different group (homonym / mixed paste).
 */
export function withDraftMajorityGroupWarnings(
  rows: BulkImportPreviewRow[],
): BulkImportPreviewRow[] {
  const withGroup = rows.filter(
    (row) => row.shipping_line_group_id != null,
  );
  if (withGroup.length < 2) {
    return rows.map((row) => ({
      ...row,
      warnings: (row.warnings ?? []).filter(
        (w) => !w.startsWith(GROUP_MAJORITY_MARK),
      ),
    }));
  }

  const counts = new Map<number, number>();
  for (const row of withGroup) {
    const id = row.shipping_line_group_id as number;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const [majorityId, majorityCount] = ranked[0];
  if (majorityCount <= withGroup.length / 2) {
    return rows.map((row) => ({
      ...row,
      warnings: (row.warnings ?? []).filter(
        (w) => !w.startsWith(GROUP_MAJORITY_MARK),
      ),
    }));
  }
  if (ranked.length >= 2 && ranked[1][1] === majorityCount) {
    return rows.map((row) => ({
      ...row,
      warnings: (row.warnings ?? []).filter(
        (w) => !w.startsWith(GROUP_MAJORITY_MARK),
      ),
    }));
  }

  const majorityName =
    withGroup.find((row) => row.shipping_line_group_id === majorityId)
      ?.shipping_line_group_name || "el grupo mayoritario";

  return rows.map((row) => {
    const kept = (row.warnings ?? []).filter(
      (w) => !w.startsWith(GROUP_MAJORITY_MARK),
    );
    const gid = row.shipping_line_group_id;
    if (gid == null || gid === majorityId) {
      return { ...row, warnings: kept };
    }
    const other = row.shipping_line_group_name || "otro grupo";
    return {
      ...row,
      warnings: [
        ...kept,
        `${GROUP_MAJORITY_MARK} parece que el barco en esta reserva pertenece a otra naviera (mayoría: ${majorityName}; esta fila: ${other}).`,
      ],
    };
  });
}
