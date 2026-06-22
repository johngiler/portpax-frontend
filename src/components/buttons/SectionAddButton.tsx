"use client";

import { Plus } from "lucide-react";
import DefaultButton from "./DefaultButton";

type SectionAddButtonProps = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
};

/** Primary "+ Agregar …" action for ViewSection headers. */
export default function SectionAddButton({ label, onClick, disabled }: SectionAddButtonProps) {
  return (
    <DefaultButton type="button" onClick={onClick} disabled={disabled}>
      <span className="inline-flex items-center gap-2">
        <Plus className="h-4 w-4" strokeWidth={2} />
        {label}
      </span>
    </DefaultButton>
  );
}
