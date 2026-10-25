"use client";

type MainWithFilterMarginProps = { children: React.ReactNode };

export default function MainWithFilterMargin({ children }: MainWithFilterMarginProps) {
  return (
    <main
      data-app-scroll="main"
      className="main-waves-top h-full min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-x-none p-2.5 pb-[4.5rem] sm:p-6 sm:pb-6 lg:p-8"
    >
      {children}
    </main>
  );
}
