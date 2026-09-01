export function bookingAuditActionLabel(action: string): string {
  switch (action) {
    case "created":
      return "Creación";
    case "operational_update":
      return "Actualización operativa";
    case "identity_update":
      return "Actualización de escala";
    case "status_change":
      return "Cambio de estado";
    case "lta_linked":
      return "Vinculación LTA";
    case "lta_unlinked":
      return "Desvinculación LTA";
    case "deleted":
      return "Eliminación";
    case "conflict_detected":
      return "Conflicto detectado";
    case "conflict_resolved":
      return "Conflicto resuelto";
    case "conflict_updated":
      return "Conflicto actualizado";
    default:
      return action;
  }
}

export function catalogAuditActionLabel(action: string): string {
  const childMatch = action.match(
    /^(?:position|berth|bollard|fender|port_image|berth_image|position_image|nesting_rule|loa_recalc_rule|vessel)_(created|updated|deleted)$/,
  );
  const verb = childMatch ? childMatch[1] : action;
  switch (verb) {
    case "created":
      return "Creación";
    case "updated":
      return "Actualización";
    case "deleted":
      return "Eliminación";
    default:
      return action;
  }
}

export function userAuditActionLabel(action: string): string {
  switch (action) {
    case "created":
      return "Creación";
    case "updated":
      return "Actualización";
    case "deleted":
      return "Eliminación";
    case "login":
      return "Inicio de sesión";
    default:
      return action;
  }
}

export function ltaAuditActionLabel(action: string): string {
  switch (action) {
    case "created":
      return "Creación";
    case "updated":
      return "Actualización";
    case "deleted":
      return "Eliminación";
    case "link_bookings":
      return "Vinculación";
    case "generate_bookings":
      return "Generación";
    case "regenerate_bookings":
      return "Regeneración";
    default:
      return action;
  }
}
