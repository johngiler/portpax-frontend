"use client";

import Modal from "@/components/ui/Modal";

type ActivityHistoryModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** Optional filters / actions above the feed. */
  toolbar?: React.ReactNode;
};

/**
 * Shared shell for CRUD movement history (opened from FilterSidebar → Historial).
 * Each view supplies its own feed via SWR (`use*ActivityInfinite` + `swrKeys`),
 * plus filters and detail modals as children/toolbar.
 */
export default function ActivityHistoryModal({
  open,
  onClose,
  title = "Historial de movimientos",
  children,
  toolbar,
}: ActivityHistoryModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      panelClassName="max-w-5xl"
      footer={
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer rounded-md border border-zinc-200/80 bg-white px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Cerrar
        </button>
      }
    >
      {toolbar ? <div className="mb-4">{toolbar}</div> : null}
      <div className="max-h-[min(60vh,32rem)] overflow-y-auto overscroll-contain">
        {children}
      </div>
    </Modal>
  );
}
