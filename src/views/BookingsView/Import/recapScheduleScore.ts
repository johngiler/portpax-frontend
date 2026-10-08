/**
 * Live recap schedule score against a mass-edit draft.
 * Mirrors backend `booking_recap.match` `_avisos` / `_match_summary`.
 */

export type RecapScheduleRef = {
  call_date: string | null;
  eta: string | null;
  etd: string | null;
};

export type RecapScheduleScore = {
  matchPercent: number;
  matchReason: string;
  avisos: string[];
};

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"] as const;
const MONTHS = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
] as const;

function hhmm(value: string | null | undefined): string | null {
  if (!value) return null;
  const text = value.trim();
  if (!text) return null;
  return text.length >= 5 ? text.slice(0, 5) : text;
}

function parseIso(value: string | null | undefined): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  if (
    dt.getFullYear() !== y ||
    dt.getMonth() !== m - 1 ||
    dt.getDate() !== d
  ) {
    return null;
  }
  return dt;
}

function dateLabel(iso: string): string {
  const dt = parseIso(iso);
  if (!dt) return iso;
  const weekday = WEEKDAYS[dt.getDay() === 0 ? 6 : dt.getDay() - 1];
  return `${weekday} ${dt.getDate()} ${MONTHS[dt.getMonth()]} ${dt.getFullYear()}`;
}

function joinClauses(parts: string[]): string {
  if (parts.length <= 1) return parts[0] ?? "";
  return `${parts.slice(0, -1).join(", ")} y ${parts[parts.length - 1]}`;
}

/** Score draft schedule vs the recap row that matched this booking. */
export function scoreDraftAgainstRecap(
  draft: {
    call_date: string | null;
    eta: string | null;
    etd: string | null;
  },
  recap: RecapScheduleRef | null | undefined,
): RecapScheduleScore | null {
  if (!recap) return null;

  const draftDate = parseIso(draft.call_date);
  const recapDate = parseIso(recap.call_date);
  const draftEta = hhmm(draft.eta);
  const draftEtd = hhmm(draft.etd);
  const recapEta = hhmm(recap.eta);
  const recapEtd = hhmm(recap.etd);

  const avisos: string[] = [];
  if (draftDate && recapDate && draft.call_date !== recap.call_date) {
    avisos.push(
      `Fecha: PortPax ${dateLabel(draft.call_date!)} · recap ${dateLabel(recap.call_date!)}`,
    );
  }
  if (recapEta) {
    const current = draftEta || "—";
    if (current !== recapEta) {
      avisos.push(`Llegada: PortPax ${current} · recap ${recapEta}`);
    }
  }
  if (recapEtd) {
    const current = draftEtd || "—";
    if (current !== recapEtd) {
      avisos.push(`Salida: PortPax ${current} · recap ${recapEtd}`);
    }
  }

  const clauses: string[] = [];
  let points = 0;
  let total = 0;

  if (recapDate && draftDate) {
    total += 1;
    if (draft.call_date === recap.call_date) {
      points += 1;
      clauses.push("la fecha coincide");
    } else {
      points += 0.5;
      clauses.push("la fecha está a un día (cuenta la mitad)");
    }
  }

  const hits: string[] = [];
  const misses: string[] = [];
  for (const [label, current, imported] of [
    ["la llegada", draftEta, recapEta],
    ["la salida", draftEtd, recapEtd],
  ] as const) {
    if (!imported) continue;
    total += 1;
    if (current === imported) {
      points += 1;
      hits.push(label);
    } else {
      misses.push(label);
    }
  }

  if (hits[0] === "la llegada" && hits[1] === "la salida") {
    clauses.push("la llegada y la salida coinciden");
  } else {
    for (const label of hits) clauses.push(`${label} coincide`);
  }
  if (misses[0] === "la llegada" && misses[1] === "la salida") {
    clauses.push("la llegada y la salida no coinciden");
  } else {
    for (const label of misses) clauses.push(`${label} no coincide`);
  }

  const matchPercent = total === 0 ? 100 : Math.round((100 * points) / total);
  const because = joinClauses(clauses) || "el barco y el puerto coinciden";
  return {
    matchPercent,
    matchReason: `${matchPercent}% porque ${because}.`,
    avisos,
  };
}
