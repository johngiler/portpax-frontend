type FormErrorAlertProps = {
  message: string | null;
  className?: string;
};

export default function FormErrorAlert({ message, className = "" }: FormErrorAlertProps) {
  if (!message) return null;

  return (
    <div
      className={`rounded-xl border border-red-200/90 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300 ${className}`}
      role="alert"
    >
      {message}
    </div>
  );
}
