import type { BookingValidationIssue } from "@/types/booking";
import NoticeAlert from "@/components/ui/NoticeAlert";

type ValidationIssuesAlertProps = {
  errors?: BookingValidationIssue[];
  warnings?: BookingValidationIssue[];
  className?: string;
};

export default function ValidationIssuesAlert({
  errors = [],
  warnings = [],
  className = "",
}: ValidationIssuesAlertProps) {
  if (errors.length === 0 && warnings.length === 0) return null;

  return (
    <div className={`space-y-3 ${className}`}>
      <NoticeAlert variant="error" messages={errors.map((issue) => issue.message)} />
      <NoticeAlert variant="warning" messages={warnings.map((issue) => issue.message)} />
    </div>
  );
}
