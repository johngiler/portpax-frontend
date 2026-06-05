"use client";

import type { ReactNode } from "react";

export default function PageHeader({ children }: { children: ReactNode }) {
  return (
    <div className="mb-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        {children}
      </div>
    </div>
  );
}
