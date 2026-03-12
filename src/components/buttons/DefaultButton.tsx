import type { ButtonHTMLAttributes } from "react";

type DefaultButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
};

export default function DefaultButton({ children, className = "", ...props }: DefaultButtonProps) {
  return (
    <button
      type="button"
      className={`rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
