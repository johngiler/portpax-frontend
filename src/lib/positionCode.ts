export function normalizePositionShortCode(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

export function positionCodePrefix(portCode: string): string {
  return `${portCode.trim().toLowerCase()}-`;
}

export function positionShortCode(portCode: string, fullCode: string): string {
  const prefix = positionCodePrefix(portCode);
  if (fullCode.toLowerCase().startsWith(prefix)) {
    return fullCode.slice(prefix.length);
  }
  return fullCode;
}

export function buildPositionCode(portCode: string, userCode: string): string {
  let short = normalizePositionShortCode(userCode);
  const prefix = positionCodePrefix(portCode);
  if (short.toLowerCase().startsWith(prefix)) {
    short = short.slice(prefix.length);
  }
  return `${portCode.trim().toLowerCase()}-${short}`;
}

export function buildCombinedPositionCode(
  portCode: string,
  firstShort: string,
  secondShort: string,
): string {
  const combinedShort = `${normalizePositionShortCode(firstShort)}+${normalizePositionShortCode(secondShort)}`;
  return buildPositionCode(portCode, combinedShort);
}

type PositionCodeFields = {
  code: string;
  port_code: string;
  short_code?: string;
};

export function positionDisplayCode(position: PositionCodeFields): string {
  return position.short_code ?? positionShortCode(position.port_code, position.code);
}

export function formatPositionStoredCode(code: string): string {
  return code.trim().toUpperCase();
}
