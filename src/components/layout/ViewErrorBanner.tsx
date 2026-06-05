type ViewErrorBannerProps = {
  message: string;
  onDismiss?: () => void;
};

export default function ViewErrorBanner({
  message,
  onDismiss,
}: ViewErrorBannerProps) {
  return (
    <div
      className="mb-6 flex flex-wrap items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 dark:border-red-900/50 dark:bg-red-950/30"
      role="alert"
    >
      <p className="text-sm font-medium text-red-700 dark:text-red-400">
        {message}
      </p>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
        >
          Cerrar
        </button>
      ) : null}
    </div>
  );
}
