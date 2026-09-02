export type PaxConceptGuideRow = {
  id: "capacity" | "actual" | "planned" | "reports";
  name: string;
  rule: string;
};

/** What each PAX field is — short essence for operators. */
export const PAX_CONCEPTS_GUIDE: PaxConceptGuideRow[] = [
  {
    id: "capacity",
    name: "Cap. máx.",
    rule: "Capacidad máxima de pasajeros de ese barco en el catálogo. No viene del manifiesto ni del muelle.",
  },
  {
    id: "actual",
    name: "PAX real",
    rule: "Pasajeros que realmente viajaron en esa escala, según el manifiesto o cierre post-arribo. Solo existe cuando la escala ya ocurrió.",
  },
  {
    id: "planned",
    name: "Planificado / Prom. PAX",
    rule: "Estimación de pasajeros para la reserva: promedio de los PAX reales históricos de ese barco hasta hoy. Si aún no hay historial, se usa la Cap. máx.",
  },
];

/** Reports-only: how Base PAX feeds PASSENGER matrices. */
export const PAX_REPORTS_BASIS_GUIDE: PaxConceptGuideRow = {
  id: "reports",
  name: "Base PAX",
  rule: "Qué número usan los reportes de pasajeros cuando la escala aún no tiene PAX real: el planificado o la Cap. máx. Si ya hay real, siempre se usa el real.",
};
