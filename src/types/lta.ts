export type LongTermAgreement = {
  id: number;
  code: string;
  name: string;
  port: number;
  port_code: string;
  port_name: string;
  shipping_line: number;
  shipping_line_code: string;
  shipping_line_name: string;
  all_vessels: boolean;
  vessel_ids: number[];
  vessel_names: string[];
  position_ids: number[];
  position_codes: string[];
  weekdays: number[];
  interval_days: number | null;
  cadence_anchor: string | null;
  min_packs: number | null;
  advance_months_min: number;
  advance_months_max: number;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  notes: string;
  /** Bookings with this agreement FK (match / link result). */
  linked_bookings_count: number;
  contract_file_url: string | null;
  contract_file_name: string | null;
  created_at: string;
  updated_at: string;
};

export type LongTermAgreementPayload = {
  code: string;
  name: string;
  port: number;
  shipping_line: number;
  all_vessels: boolean;
  vessel_ids: number[];
  position_ids: number[];
  weekdays: number[];
  interval_days: number | null;
  cadence_anchor: string | null;
  min_packs: number | null;
  advance_months_min: number;
  advance_months_max: number;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  notes: string;
};

export type LongTermAgreementSaveOptions = {
  contractFile?: File | null;
  removeContract?: boolean;
};

export const LTA_WEEKDAY_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: "Lunes" },
  { value: 1, label: "Martes" },
  { value: 2, label: "Miércoles" },
  { value: 3, label: "Jueves" },
  { value: 4, label: "Viernes" },
  { value: 5, label: "Sábado" },
  { value: 6, label: "Domingo" },
];

export function formatLtaWeekdays(weekdays: number[]): string {
  if (!weekdays.length) return "Todos los días";
  const labels = LTA_WEEKDAY_OPTIONS.filter((o) => weekdays.includes(o.value)).map(
    (o) => o.label,
  );
  return labels.join(", ");
}
