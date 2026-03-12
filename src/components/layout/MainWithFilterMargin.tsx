"use client";

type MainWithFilterMarginProps = { children: React.ReactNode };

export default function MainWithFilterMargin({ children }: MainWithFilterMarginProps) {
  return (
    <main className="h-full min-h-0 min-w-0 flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
      {children}
    </main>
  );
}
