"use client";

import { BarChart3 } from "lucide-react";
import ComingSoonView from "@/views/ComingSoonView";

export default function ReportsRoute() {
  return (
    <ComingSoonView
      title="Reportes"
      description="Informes avanzados, exportación de datos y cuadros de mando personalizables."
      phase={6}
      icon={BarChart3}
    />
  );
}
