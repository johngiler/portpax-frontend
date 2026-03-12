import type { HTMLAttributes } from "react";

type DefaultCardProps = HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode;
};

export default function DefaultCard({ children, className = "", ...props }: DefaultCardProps) {
  return (
    <div
      className={`rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-800 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
