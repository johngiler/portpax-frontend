import type { InputHTMLAttributes } from "react";

type DefaultSearchProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  onSearch?: (value: string) => void;
};

export default function DefaultSearch({
  placeholder = "Buscar…",
  className = "",
  onChange,
  onSearch,
  ...props
}: DefaultSearchProps) {
  return (
    <input
      type="search"
      placeholder={placeholder}
      className={`rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 ${className}`}
      onChange={(e) => {
        onChange?.(e);
        onSearch?.(e.target.value);
      }}
      {...props}
    />
  );
}
