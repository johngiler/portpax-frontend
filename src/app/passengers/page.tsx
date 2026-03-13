"use client";

import { Users } from "lucide-react";
import ComingSoonView from "@/views/ComingSoonView";

export default function PassengersRoute() {
  return (
    <ComingSoonView
      title="Pasajeros"
      description="Gestión de pasajeros, manifiestos y datos de escala."
      phase={3}
      icon={Users}
    />
  );
}
