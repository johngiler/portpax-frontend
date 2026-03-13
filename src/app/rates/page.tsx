"use client";

import { CircleDollarSign } from "lucide-react";
import ComingSoonView from "@/views/ComingSoonView";

export default function RatesRoute() {
  return (
    <ComingSoonView
      title="Tarifas"
      description="Gestión de tarifas de muellaje, servicios y precios por temporada."
      phase={2}
      icon={CircleDollarSign}
    />
  );
}
