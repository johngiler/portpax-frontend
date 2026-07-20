import StatusMessage from "@/components/ui/StatusMessage";

type FormErrorAlertProps = {
  message: string | null;
  className?: string;
};

/** Section/block-level error — place at the top of the `ViewSection` body or form block. */
export default function FormErrorAlert({ message, className = "" }: FormErrorAlertProps) {
  return (
    <StatusMessage
      tone="error"
      scope="section"
      message={message}
      className={className}
    />
  );
}
