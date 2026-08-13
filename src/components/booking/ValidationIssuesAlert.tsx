import type {
  BookingConflictSeverity,
  BookingValidationIssue,
} from "@/types/booking";
import NoticeAlert from "@/components/ui/NoticeAlert";

type ValidationIssuesAlertProps = {
  errors?: BookingValidationIssue[];
  warnings?: BookingValidationIssue[];
  className?: string;
};

function severityOf(issue: BookingValidationIssue): BookingConflictSeverity {
  if (issue.severity) return issue.severity;
  if (issue.level === "error") return "red";
  if (issue.level === "info") return "green";
  return "yellow";
}

function formatMessage(issue: BookingValidationIssue): string {
  const formula =
    issue.detail && typeof issue.detail.formula === "string"
      ? issue.detail.formula
      : null;
  if (formula && !issue.message.includes(formula)) {
    return `${issue.message} (${formula})`;
  }
  return issue.message;
}

export default function ValidationIssuesAlert({
  errors = [],
  warnings = [],
  className = "",
}: ValidationIssuesAlertProps) {
  const all = [...errors, ...warnings];
  if (all.length === 0) return null;

  const red = all.filter((i) => severityOf(i) === "red").map(formatMessage);
  const yellow = all
    .filter((i) => severityOf(i) === "yellow")
    .map(formatMessage);
  const green = all.filter((i) => severityOf(i) === "green").map(formatMessage);

  return (
    <div className={`space-y-3 ${className}`}>
      {red.length > 0 ? (
        <NoticeAlert variant="error" messages={red} />
      ) : null}
      {yellow.length > 0 ? (
        <NoticeAlert variant="warning" messages={yellow} />
      ) : null}
      {green.length > 0 ? (
        <NoticeAlert variant="success" messages={green} />
      ) : null}
    </div>
  );
}
