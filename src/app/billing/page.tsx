"use client";

import { FileText } from "lucide-react";
import ComingSoonView from "@/views/ComingSoonView";

export default function BillingRoute() {
  return (
    <ComingSoonView
      title="Facturación"
      description="Facturación a navieras, reportes de ingresos y conciliación."
      phase={2}
      icon={FileText}
    />
  );
}
