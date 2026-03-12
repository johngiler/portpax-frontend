"use client";

import { usePathname } from "next/navigation";

type PageTransitionProps = { children: React.ReactNode };

export default function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname() ?? "";

  return (
    <div key={pathname} className="w-full min-h-0 page-transition-enter">
      {children}
    </div>
  );
}
