import { ApiError } from "@/services/apiClient";

const MESSAGE_TRANSLATIONS: Record<string, string> = {
  "The fields port, code must make a unique set.":
    "Ya existe un registro con ese código en el puerto seleccionado.",
  "The fields port, code must make a unique set":
    "Ya existe un registro con ese código en el puerto seleccionado.",
  "position with this port and code already exists.":
    "Ya existe una posición con ese código en este puerto.",
  "berth with this port and code already exists.":
    "Ya existe un muelle con ese código en el puerto seleccionado.",
  "port with this code already exists.":
    "Ya existe un puerto con ese código.",
  "shipping line with this code already exists.":
    "Ya existe una naviera con ese código.",
  "vessel with this shipping line and name already exists.":
    "Ya existe un barco con ese nombre en la naviera seleccionada.",
  "This field is required.": "Este campo es obligatorio.",
  "This field may not be blank.": "Este campo es obligatorio.",
  "This field may not be null.": "Este campo es obligatorio.",
  "Not found.": "No encontrado.",
  "Authentication credentials were not provided.":
    "Debes iniciar sesión para continuar.",
  "No active account found with the given credentials":
    "Usuario o contraseña incorrectos.",
  "No active account found with the given credentials.":
    "Usuario o contraseña incorrectos.",
  // Booking validation codes (when API sends code without message)
  filo_eta_violation:
    "First-in / last-out: la posición interior no puede arribar antes que la exterior.",
  filo_etd_violation:
    "First-in / last-out: la posición interior no puede zarpar después que la exterior.",
  position_occupied: "La posición ya está ocupada en esa fecha/horario.",
  lta_priority_conflict:
    "La posición está ocupada por un call CL (LTA inamovible).",
  lta_slot_reserved: "La posición está reservada por un acuerdo LTA.",
  lta_beyond_horizon: "La fecha supera el horizonte máximo del LTA.",
  lta_horizon_denied:
    "En este periodo solo navieras con LTA vigente pueden reservar con prioridad; se creará en Hold.",
  loa_exceeds_position: "La eslora del barco excede el máximo de la posición.",
  loa_below_combined_min:
    "Esta posición combinada ya no está disponible para reservar.",
  loa_requires_combined:
    "Usa una posición física del muelle; las combinadas ya no se reservan.",
  combined_position_retired:
    "Esta posición combinada ya no está disponible para reservar.",
  loa_recalc_sum_yellow: "Suma de esloras en zona amarilla del muelle.",
  loa_recalc_sum_red: "Suma de esloras en zona roja del muelle.",
  loa_shared_pier:
    "La eslora supera el máximo de la posición; se recalcula la vecina.",
  loa_recalc_exceeds:
    "La eslora supera el espacio restante del muelle compartido.",
  beam_exceeds_position: "La manga del barco excede el máximo de la posición.",
  draft_too_deep: "El calado del barco supera la profundidad disponible.",
  combined_loa_red: "La eslora combinada alcanza o supera el límite rojo.",
  multi_port_conflict:
    "El mismo barco ya tiene escala en otro puerto en esta fecha.",
  multi_port_proximity:
    "El salto entre escalas es menor al tiempo mínimo de viaje entre puertos.",
  shipping_line_group_mismatch:
    "El barco y la naviera deben pertenecer al mismo grupo de naviera.",
  vessel_line_mismatch:
    "El barco debe pertenecer a la naviera seleccionada.",
  duplicate_port_vessel_date:
    "Ya existe una reserva para ese puerto, barco y fecha.",
  booking_cancelled: "No se puede editar una reserva cancelada.",
};

const MESSAGE_PATTERNS: Array<{
  pattern: RegExp;
  translate: (match: RegExpMatchArray) => string;
}> = [
  {
    pattern: /^The fields (.+) must make a unique set\.?$/i,
    translate: (match) => {
      const fields = match[1].toLowerCase();
      if (fields.includes("port") && fields.includes("code")) {
        return "Ya existe un registro con ese código en el puerto seleccionado.";
      }
      return `Ya existe un registro con esos datos (${match[1]}).`;
    },
  },
  {
    pattern: /^Ensure this value is greater than or equal to ([\d.]+)\.?$/i,
    translate: (match) => `El valor debe ser mayor o igual a ${match[1]}.`,
  },
  {
    pattern: /^Ensure this value is less than or equal to ([\d.]+)\.?$/i,
    translate: (match) => `El valor debe ser menor o igual a ${match[1]}.`,
  },
  {
    pattern: /^"([^"]+)" is not a valid choice\.?$/i,
    translate: (match) => `"${match[1]}" no es una opción válida.`,
  },
  {
    pattern: /^Invalid pk "(.+)" - object does not exist\.?$/i,
    translate: () => "Uno de los valores seleccionados ya no existe.",
  },
];

const FIELD_ALIASES: Record<string, string> = {
  component_position_ids: "component",
  port_bollard: "bollard_allocations",
  port_fender: "fender_allocations",
  port_bollard_ids: "bollard_allocations",
  port_fender_ids: "fender_allocations",
};

const CODE_FIELD_MESSAGE_PATTERNS = [
  /unique set/i,
  /already exists/i,
  /código en este puerto/i,
  /código en el puerto/i,
  /nombre en este puerto/i,
  /ese código/i,
];

function normalizeMessages(value: unknown): string[] {
  if (value == null) return [];
  if (Array.isArray(value)) return value.flatMap(normalizeMessages);
  if (typeof value === "object") {
    const rec = value as Record<string, unknown>;
    if (typeof rec.message === "string" && rec.message.trim()) {
      return [rec.message.trim()];
    }
    if (typeof rec.code === "string" && rec.code.trim()) {
      return [rec.code.trim()];
    }
    return Object.values(rec).flatMap(normalizeMessages);
  }
  const text = String(value).trim();
  return text ? [text] : [];
}

export function normalizeApiFieldErrors(
  fieldErrors?: Record<string, string[]>,
): Record<string, string[]> {
  if (!fieldErrors) return {};
  const normalized: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(fieldErrors)) {
    const messages = normalizeMessages(value);
    if (messages.length) normalized[key] = messages;
  }
  return normalized;
}

export function translateApiMessage(message: string): string {
  const trimmed = message.trim();
  if (!trimmed) return trimmed;

  const exact = MESSAGE_TRANSLATIONS[trimmed];
  if (exact) return exact;

  for (const { pattern, translate } of MESSAGE_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match) return translate(match);
  }

  return trimmed;
}

function shouldMapToCodeField(message: string): boolean {
  return CODE_FIELD_MESSAGE_PATTERNS.some((pattern) => pattern.test(message));
}

function resolveTargetField(key: string): string {
  return FIELD_ALIASES[key] ?? key;
}

export function getApiErrorMessage(err: unknown, fallback: string): string {
  if (!(err instanceof ApiError)) return fallback;

  const fieldErrors = normalizeApiFieldErrors(err.fieldErrors);
  const nonField = fieldErrors.non_field_errors?.[0];
  if (nonField) return translateApiMessage(nonField);

  for (const key of [
    "code",
    "port",
    "status",
    "name",
    "position",
    "component_position_ids",
  ]) {
    const message = fieldErrors[key]?.[0];
    if (message) return translateApiMessage(message);
  }

  for (const [key, messages] of Object.entries(fieldErrors)) {
    if (key === "non_field_errors" || !messages[0]) continue;
    return translateApiMessage(messages[0]);
  }

  const translated = translateApiMessage(err.message);
  return translated || fallback;
}

export function getModalSubmitError(err: unknown, fallback: string): string {
  return getApiErrorMessage(err, fallback);
}

export function applyModalApiError<T extends Record<string, string | undefined>>(
  err: unknown,
  fallback: string,
  setSubmitError: (message: string | null) => void,
  setFieldErrors?: (updater: (prev: T) => T) => void,
): void {
  const message = getModalSubmitError(err, fallback);
  setSubmitError(message);

  if (!(err instanceof ApiError) || !setFieldErrors) return;

  const fieldErrors = normalizeApiFieldErrors(err.fieldErrors);
  if (Object.keys(fieldErrors).length === 0) return;

  setFieldErrors((prev) => {
    const next = { ...prev } as Record<string, string | undefined>;

    for (const [key, messages] of Object.entries(fieldErrors)) {
      if (key === "non_field_errors" || !messages[0]) continue;
      const targetKey = resolveTargetField(key);
      next[targetKey] = translateApiMessage(messages[0]);
    }

    if (shouldMapToCodeField(message)) {
      next.code = message;
    }

    return next as T;
  });
}

export async function submitModalForm<T extends Record<string, string | undefined>>(
  action: () => Promise<void>,
  options: {
    fallback: string;
    setSubmitError: (message: string | null) => void;
    setFieldErrors?: (updater: (prev: T) => T) => void;
  },
): Promise<boolean> {
  options.setSubmitError(null);
  try {
    await action();
    return true;
  } catch (err) {
    applyModalApiError(err, options.fallback, options.setSubmitError, options.setFieldErrors);
    return false;
  }
}
