"use client";

import { Cog } from "lucide-react";
import ComingSoonView from "@/views/ComingSoonView";

export default function OperationsRoute() {
  return (
    <ComingSoonView
      title="Operaciones"
      description="Vista operativa del día, asignación de posiciones y coordinación en tiempo real."
      phase={1}
      icon={Cog}
    />
  );
}
