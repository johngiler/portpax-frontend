"use client";

import { useEffect, useRef } from "react";

type DropdownMenuProps = {
  open: boolean;
  onClose: () => void;
  trigger: React.ReactNode;
  children: React.ReactNode;
  /** Ancho mínimo del panel */
  width?: string;
  align?: "left" | "right";
};

export default function DropdownMenu({
  open,
  onClose,
  trigger,
  children,
  width = "min-w-[theme(spacing.80)]",
  align = "right",
}: DropdownMenuProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      const el = containerRef.current;
      if (el && !el.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open, onClose]);

  return (
    <div className="relative inline-block" ref={containerRef}>
      {trigger}
      {open && (
        <div
          className={`dropdown-panel-enter absolute top-full z-[200] mt-2 ${width} ${align === "right" ? "right-0" : "left-0"}`}
          role="menu"
        >
          {children}
        </div>
      )}
    </div>
  );
}
