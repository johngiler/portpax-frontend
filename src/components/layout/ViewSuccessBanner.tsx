import StatusMessage from "@/components/ui/StatusMessage";

type ViewSuccessBannerProps = {
  message: string;
  onDismiss?: () => void;
};

/** View-level success — place under `ViewPageHeader` when the whole view action succeeded. */
export default function ViewSuccessBanner({
  message,
  onDismiss,
}: ViewSuccessBannerProps) {
  return (
    <StatusMessage
      tone="success"
      scope="view"
      message={message}
      onDismiss={onDismiss}
    />
  );
}
