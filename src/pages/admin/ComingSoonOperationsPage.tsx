"use client";

import { Cog } from "lucide-react";
import ComingSoonView from "@/components/ComingSoonView";

export default function ComingSoonOperationsPage() {
  return (
    <ComingSoonView
      title="Operaciones"
      description="Gestión de operaciones portuarias, servicios en escala y asignación de recursos en tiempo real."
      phase={2}
      icon={Cog}
    />
  );
}
