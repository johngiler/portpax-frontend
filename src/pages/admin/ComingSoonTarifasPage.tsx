"use client";

import { CircleDollarSign } from "lucide-react";
import ComingSoonView from "@/components/ComingSoonView";

export default function ComingSoonTarifasPage() {
  return (
    <ComingSoonView
      title="Tarifas"
      description="Configuración de tarifas por muelle, tipo de escala y naviera. Precios y reglas de cobro."
      phase={5}
      icon={CircleDollarSign}
    />
  );
}
