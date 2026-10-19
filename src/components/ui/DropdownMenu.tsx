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
  /** Classes on the floating panel wrapper (e.g. dropdown-panel). */
  panelClassName?: string;
  /**
   * On narrow screens, pin the panel to the viewport so it is not clipped
   * when the trigger sits near the right edge.
   */
  containToViewport?: boolean;
};

export default function DropdownMenu({
  open,
  onClose,
  trigger,
  children,
  width = "min-w-[theme(spacing.80)]",
  align = "right",
  panelClassName = "",
  containToViewport = false,
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

  const panelPositionClass = containToViewport
    ? [
        "fixed left-3 right-3 z-[200] mt-0 w-auto max-w-none",
        "top-[calc(env(safe-area-inset-top,0px)+3.5rem)]",
        "sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-auto",
        align === "left" ? "sm:left-0 sm:right-auto" : "sm:right-0 sm:left-auto",
        width,
      ].join(" ")
    : [
        "absolute top-full z-[200] mt-2",
        width,
        align === "right" ? "right-0" : "left-0",
      ].join(" ");

  return (
    <div className="relative inline-block" ref={containerRef}>
      {trigger}
      {open && (
        <div
          className={`dropdown-panel-enter ${panelPositionClass} ${panelClassName}`.trim()}
          role="menu"
        >
          {children}
        </div>
      )}
    </div>
  );
}
