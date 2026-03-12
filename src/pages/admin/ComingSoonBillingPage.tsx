"use client";

import { FileText } from "lucide-react";
import ComingSoonView from "@/components/ComingSoonView";

export default function ComingSoonBillingPage() {
  return (
    <ComingSoonView
      title="Facturación"
      description="Facturación por escala, tarifas y reportes financieros del puerto."
      phase={4}
      icon={FileText}
    />
  );
}
