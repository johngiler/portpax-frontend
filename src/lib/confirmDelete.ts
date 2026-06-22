type DeleteConfirmOptions = {
  title: string;
  message: string;
  confirmLabel: string;
  danger: boolean;
  onConfirm: () => void;
};

export function buildDeleteConfirmOptions(
  deleteLabel: string,
  onConfirm: () => void,
): DeleteConfirmOptions {
  return {
    title: "Confirmar eliminación",
    message: `¿Eliminar ${deleteLabel}? Esta acción no se puede deshacer.`,
    confirmLabel: "Eliminar",
    danger: true,
    onConfirm,
  };
}
