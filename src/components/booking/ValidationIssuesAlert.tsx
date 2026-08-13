import type {
  BookingConflictSeverity,
  BookingValidationIssue,
} from "@/types/booking";
import { issueSeverity } from "@/lib/bookingConflictSeverity";
import { AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react";

type ValidationIssuesAlertProps = {
  errors?: BookingValidationIssue[];
  warnings?: BookingValidationIssue[];
  className?: string;
};

const ISSUE_TITLE: Record<string, string> = {
  loa_recalc_exceeds: "Recálculo de eslora",
  loa_recalc_sum_red: "Semáforo rojo (LOA combinada)",
  loa_recalc_sum_yellow: "Semáforo amarillo (LOA combinada)",
  loa_recalc_sum_green: "Semáforo verde (LOA combinada)",
  combined_loa_red: "LOA combinada en zona roja",
  combined_loa_orange: "LOA combinada en zona amarilla",
  multi_port_conflict: "Conflicto multi-puerto",
  multi_port_proximity: "Proximidad multi-puerto",
  position_occupied: "Posición ocupada",
  lta_beyond_horizon: "Fuera del horizonte LTA",
  lta_horizon_denied: "Horizonte LTA denegado",
};

const SEVERITY_STYLES: Record<
  BookingConflictSeverity,
  {
    container: string;
    icon: string;
    title: string;
    Icon: typeof AlertCircle;
  }
> = {
  red: {
    container:
      "border-red-200/90 bg-red-50 text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200",
    icon: "text-red-600 dark:text-red-400",
    title: "text-red-900 dark:text-red-100",
    Icon: AlertCircle,
  },
  yellow: {
    container:
      "border-amber-200/90 bg-amber-50 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/25 dark:text-amber-100",
    icon: "text-amber-600 dark:text-amber-400",
    title: "text-amber-950 dark:text-amber-50",
    Icon: AlertTriangle,
  },
  green: {
    container:
      "border-emerald-200/90 bg-emerald-50 text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/25 dark:text-emerald-100",
    icon: "text-emerald-600 dark:text-emerald-400",
    title: "text-emerald-950 dark:text-emerald-50",
    Icon: CheckCircle2,
  },
};

function issueTitle(issue: BookingValidationIssue): string {
  return ISSUE_TITLE[issue.code] ?? "Aviso operativo";
}

function IssueCard({ issue }: { issue: BookingValidationIssue }) {
  const severity = issueSeverity(issue);
  const styles = SEVERITY_STYLES[severity];
  const { Icon } = styles;
  const formula =
    issue.detail && typeof issue.detail.formula === "string"
      ? issue.detail.formula
      : null;
  const overhang =
    issue.detail && issue.detail.overhang_m != null
      ? String(issue.detail.overhang_m)
      : null;
  let body = issue.message.trim();
  if (formula) {
    body = body
      .replace(formula, "")
      .replace(/\s*\.\s*\.?$/u, ".")
      .replace(/\s{2,}/g, " ")
      .trim();
  }

  return (
    <div
      className={`rounded-xl border px-4 py-3.5 ${styles.container}`}
      role={severity === "red" ? "alert" : "status"}
    >
      <div className="flex gap-3">
        <Icon
          className={`mt-0.5 h-5 w-5 shrink-0 ${styles.icon}`}
          strokeWidth={2}
          aria-hidden
        />
        <div className="min-w-0 flex-1 space-y-2.5">
          <p className={`text-sm font-semibold leading-snug ${styles.title}`}>
            {issueTitle(issue)}
          </p>
          <p className="text-sm leading-relaxed opacity-95">{body}</p>
          {formula ? (
            <p className="rounded-lg border border-black/5 bg-white/60 px-3 py-2 font-mono text-[12px] leading-relaxed text-zinc-700 dark:border-white/10 dark:bg-black/20 dark:text-zinc-200">
              {formula}
            </p>
          ) : null}
          {overhang ? (
            <p className="text-xs font-semibold uppercase tracking-wide opacity-90">
              Overhang: {overhang} m
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function ValidationIssuesAlert({
  errors = [],
  warnings = [],
  className = "",
}: ValidationIssuesAlertProps) {
  const all = [...errors, ...warnings];
  if (all.length === 0) return null;

  const order: BookingConflictSeverity[] = ["red", "yellow", "green"];
  const grouped = order
    .map((severity) => ({
      severity,
      issues: all.filter((i) => issueSeverity(i) === severity),
    }))
    .filter((g) => g.issues.length > 0);

  return (
    <div className={`space-y-3 ${className}`}>
      {grouped.map(({ severity, issues }) => (
        <div key={severity} className="space-y-2.5">
          {issues.map((issue) => (
            <IssueCard
              key={`${issue.code}:${issue.message}`}
              issue={issue}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
