import type { ButtonHTMLAttributes } from "react";

type DefaultButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
};

export default function DefaultButton({ children, className = "", ...props }: DefaultButtonProps) {
  return (
    <button
      type="button"
      className={`btn-primary-gradient cursor-pointer rounded-md px-4 py-2 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(15,23,42,0.18)] transition-all hover:brightness-105 hover:shadow-[0_8px_22px_-14px_rgba(52,120,181,0.7)] ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
