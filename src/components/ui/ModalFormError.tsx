import StatusMessage from "@/components/ui/StatusMessage";

type ModalFormErrorProps = {
  message: string | null;
};

/** Modal-level error — always inside the open modal body, never behind it. */
export default function ModalFormError({ message }: ModalFormErrorProps) {
  return <StatusMessage tone="error" scope="modal" message={message} />;
}
