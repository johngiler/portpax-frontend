import { ApiError } from "@/services/apiClient";

const MESSAGE_TRANSLATIONS: Record<string, string> = {
  "The fields port, code must make a unique set.":
    "Ya existe una posición con ese código en este puerto.",
  "The fields port, code must make a unique set":
    "Ya existe una posición con ese código en este puerto.",
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
};

export function translateApiMessage(message: string): string {
  const trimmed = message.trim();
  return MESSAGE_TRANSLATIONS[trimmed] ?? trimmed;
}

export function getModalSubmitError(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    const nonField = err.fieldErrors?.non_field_errors?.[0];
    if (nonField) return translateApiMessage(nonField);
    return translateApiMessage(err.message);
  }
  return fallback;
}

export function applyModalApiError<T extends Record<string, string | undefined>>(
  err: unknown,
  fallback: string,
  setSubmitError: (message: string | null) => void,
  setFieldErrors?: (updater: (prev: T) => T) => void,
): void {
  const message = getModalSubmitError(err, fallback);
  setSubmitError(message);

  if (!(err instanceof ApiError) || !err.fieldErrors || !setFieldErrors) {
    return;
  }

  setFieldErrors((prev) => {
    const next = { ...prev };
    for (const [key, messages] of Object.entries(err.fieldErrors!)) {
      if (key === "non_field_errors" || !messages?.[0]) continue;
      const translated = translateApiMessage(messages[0]);
      if (key in next) {
        (next as Record<string, string>)[key] = translated;
      }
    }
    if (message.includes("código en este puerto") && "code" in next) {
      (next as Record<string, string>).code = message;
    }
    return next;
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
