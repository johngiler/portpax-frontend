import FormErrorAlert from "@/components/ui/FormErrorAlert";

type ModalFormErrorProps = {
  message: string | null;
};

export default function ModalFormError({ message }: ModalFormErrorProps) {
  return <FormErrorAlert message={message} />;
}
