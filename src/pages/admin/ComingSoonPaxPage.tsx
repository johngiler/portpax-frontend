"use client";

import { Users } from "lucide-react";
import ComingSoonView from "@/components/ComingSoonView";

export default function ComingSoonPaxPage() {
  return (
    <ComingSoonView
      title="Pasajeros (PAX)"
      description="Control de desembarque, conteo de pasajeros y flujos de movimiento en terminal."
      phase={3}
      icon={Users}
    />
  );
}
