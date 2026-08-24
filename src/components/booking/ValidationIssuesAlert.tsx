import type {
  BookingConflictSeverity,
  BookingValidationIssue,
} from "@/types/booking";
import { formatIsoDateLabel } from "@/lib/bookingDates";
import { issueSeverity } from "@/lib/bookingConflictSeverity";
import { renderTextWithBookingCodeLinks } from "@/lib/renderBookingCodeLinks";
import { AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react";

type ValidationIssuesAlertProps = {
  errors?: BookingValidationIssue[];
  warnings?: BookingValidationIssue[];
  className?: string;
  returnTo?: string | null;
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
  filo_eta_violation: "FILO · arribo",
  filo_etd_violation: "FILO · zarpe",
  position_occupied: "Posición ocupada",
  lta_slot_reserved: "Posición reservada por LTA",
  lta_beyond_horizon: "Fuera del horizonte LTA",
  lta_horizon_denied: "Horizonte LTA denegado",
  lta_policy_denied: "Política LTA",
  lta_agreement_match: "Acuerdo LTA",
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

type LoaVesselLine = {
  name?: string;
  position?: string;
  loa_m?: string;
  booking_code?: string;
  role?: string;
};

function issueTitle(
  issue: BookingValidationIssue,
  severity: BookingConflictSeverity,
): string {
  if (ISSUE_TITLE[issue.code]) return ISSUE_TITLE[issue.code];
  if (severity === "red") return "Aviso crítico";
  if (severity === "green") return "Aviso informativo";
  return "Aviso operativo";
}

function parseVesselLines(detail: BookingValidationIssue["detail"]): LoaVesselLine[] {
  if (!detail || !Array.isArray(detail.vessel_lines)) return [];
  return detail.vessel_lines.filter(
    (row): row is LoaVesselLine =>
      Boolean(row) && typeof row === "object" && !Array.isArray(row),
  );
}

function LoaRecalcBody({
  issue,
  returnTo,
}: {
  issue: BookingValidationIssue;
  returnTo?: string | null;
}) {
  const detail = issue.detail ?? {};
  const lines = parseVesselLines(detail);
  const sumFormula =
    typeof detail.sum_formula === "string" ? detail.sum_formula : null;
  const remainingFormula =
    typeof detail.remaining_formula === "string"
      ? detail.remaining_formula
      : typeof detail.formula === "string"
        ? detail.formula
        : null;
  const overhang =
    detail.overhang_m != null ? String(detail.overhang_m) : null;
  const portLabel =
    typeof detail.port_label === "string" && detail.port_label
      ? detail.port_label
      : null;

  const bandMatch = issue.message.match(
    /^(?:.+? · )?(Semáforo (?:rojo|amarillo|verde):[^.]+)\./u,
  );
  const bandText = bandMatch?.[1] ?? null;

  return (
    <div className="space-y-2.5">
      {portLabel || bandText ? (
        <p className="text-sm leading-relaxed opacity-95">
          {portLabel ? <span className="font-medium">{portLabel}</span> : null}
          {portLabel && bandText ? " · " : null}
          {bandText
            ? renderTextWithBookingCodeLinks(bandText, { returnTo })
            : null}
        </p>
      ) : (
        <p className="text-sm leading-relaxed opacity-95">
          {renderTextWithBookingCodeLinks(issue.message.trim(), { returnTo })}
        </p>
      )}
      {lines.length > 0 ? (
        <ul className="space-y-1 text-sm leading-relaxed opacity-95">
          {lines.map((row) => {
            const code = (row.booking_code || "").trim();
            const label = [
              row.name || "Barco",
              row.position ? `en ${row.position}` : null,
              row.loa_m != null ? `(${row.loa_m} m)` : null,
            ]
              .filter(Boolean)
              .join(" ");
            const suffix = code
              ? ` · ${code}`
              : row.role === "self"
                ? " · esta reserva"
                : "";
            return (
              <li key={`${row.position}-${row.name}-${code || row.role}`}>
                {renderTextWithBookingCodeLinks(`${label}${suffix}`, {
                  returnTo,
                })}
              </li>
            );
          })}
        </ul>
      ) : null}
      {sumFormula ? (
        <p className="rounded-lg border border-black/5 bg-white/60 px-3 py-2 font-mono text-[12px] leading-relaxed text-zinc-700 dark:border-white/10 dark:bg-black/20 dark:text-zinc-200">
          {sumFormula}
        </p>
      ) : null}
      {overhang && remainingFormula ? (
        <p className="rounded-lg border border-black/5 bg-white/60 px-3 py-2 font-mono text-[12px] leading-relaxed text-zinc-700 dark:border-white/10 dark:bg-black/20 dark:text-zinc-200">
          {remainingFormula}
        </p>
      ) : null}
      {overhang ? (
        <p className="text-xs font-semibold uppercase tracking-wide opacity-90">
          Overhang: {overhang} m
        </p>
      ) : null}
    </div>
  );
}

function issueCallDateLabel(issue: BookingValidationIssue): string | null {
  const raw = issue.detail?.call_date;
  if (typeof raw !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  return formatIsoDateLabel(raw, "long");
}

function IssueCard({
  issue,
  returnTo = null,
}: {
  issue: BookingValidationIssue;
  returnTo?: string | null;
}) {
  const severity = issueSeverity(issue);
  const styles = SEVERITY_STYLES[severity];
  const { Icon } = styles;
  const callDateLabel = issueCallDateLabel(issue);
  const isLoaRecalcSum = issue.code.startsWith("loa_recalc_sum_");
  const isSumLight = isLoaRecalcSum;
  const formula =
    issue.detail &&
    typeof (isSumLight ? issue.detail.sum_formula : issue.detail.formula) ===
      "string"
      ? String(
          isSumLight
            ? issue.detail.sum_formula
            : issue.detail.formula,
        )
      : issue.detail && typeof issue.detail.formula === "string"
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
  if (
    issue.detail &&
    typeof issue.detail.sum_formula === "string" &&
    issue.detail.sum_formula !== formula
  ) {
    body = body
      .replace(String(issue.detail.sum_formula), "")
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
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <p className={`text-sm font-semibold leading-snug ${styles.title}`}>
              {issueTitle(issue, severity)}
            </p>
            {callDateLabel ? (
              <p className="text-xs font-medium opacity-80">{callDateLabel}</p>
            ) : null}
          </div>
          {isLoaRecalcSum ? (
            <LoaRecalcBody issue={issue} returnTo={returnTo} />
          ) : (
            <>
              <p className="text-sm leading-relaxed opacity-95">
                {renderTextWithBookingCodeLinks(body, { returnTo })}
              </p>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/** Drop legacy duplicate overhang when a unified LOA sum aviso is present. */
function dedupeLoaRecalcIssues(
  issues: BookingValidationIssue[],
): BookingValidationIssue[] {
  const hasSum = issues.some((i) => i.code.startsWith("loa_recalc_sum_"));
  if (!hasSum) return issues;
  return issues.filter((i) => i.code !== "loa_recalc_exceeds");
}

export default function ValidationIssuesAlert({
  errors = [],
  warnings = [],
  className = "",
  returnTo = null,
}: ValidationIssuesAlertProps) {
  const all = dedupeLoaRecalcIssues([...errors, ...warnings]);
  if (all.length === 0) return null;

  const order: BookingConflictSeverity[] = ["red", "yellow", "green"];
  const grouped = order
    .map((severity) => ({
      severity,
      issues: all
        .filter((i) => issueSeverity(i) === severity)
        .sort((a, b) => {
          const da =
            typeof a.detail?.call_date === "string" ? a.detail.call_date : "";
          const db =
            typeof b.detail?.call_date === "string" ? b.detail.call_date : "";
          return da.localeCompare(db) || a.code.localeCompare(b.code);
        }),
    }))
    .filter((g) => g.issues.length > 0);

  return (
    <div className={`space-y-3 ${className}`}>
      {grouped.map(({ severity, issues }) => (
        <div key={severity} className="space-y-2.5">
          {issues.map((issue) => {
            const callDate =
              typeof issue.detail?.call_date === "string"
                ? issue.detail.call_date
                : "";
            return (
              <IssueCard
                key={`${issue.code}:${callDate}:${issue.message}`}
                issue={issue}
                returnTo={returnTo}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
