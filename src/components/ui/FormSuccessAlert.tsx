import StatusMessage from "@/components/ui/StatusMessage";

type FormSuccessAlertProps = {
  message: string | null;
  onDismiss?: () => void;
  className?: string;
};

/** Section/block-level success — place at the top of the `ViewSection` body or form block. */
export default function FormSuccessAlert({
  message,
  onDismiss,
  className = "",
}: FormSuccessAlertProps) {
  return (
    <StatusMessage
      tone="success"
      scope="section"
      message={message}
      onDismiss={onDismiss}
      className={className}
    />
  );
}
