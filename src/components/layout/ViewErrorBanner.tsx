import StatusMessage from "@/components/ui/StatusMessage";

type ViewErrorBannerProps = {
  message: string;
  onDismiss?: () => void;
};

/** View-level error — place under `ViewPageHeader`, never inside a modal. */
export default function ViewErrorBanner({
  message,
  onDismiss,
}: ViewErrorBannerProps) {
  return (
    <StatusMessage
      tone="error"
      scope="view"
      message={message}
      onDismiss={onDismiss}
    />
  );
}
