import { AlertCircle, AlertTriangle } from "lucide-react";

type NoticeVariant = "error" | "warning";

type NoticeAlertProps = {
  variant: NoticeVariant;
  messages: string[];
  className?: string;
};

const NOTICE_STYLES: Record<
  NoticeVariant,
  { container: string; icon: string; Icon: typeof AlertCircle }
> = {
  error: {
    container:
      "border-red-200/90 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300",
    icon: "text-red-600 dark:text-red-400",
    Icon: AlertCircle,
  },
  warning: {
    container:
      "border-amber-200/90 bg-amber-50 text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/25 dark:text-amber-300",
    icon: "text-amber-600 dark:text-amber-400",
    Icon: AlertTriangle,
  },
};

export default function NoticeAlert({ variant, messages, className = "" }: NoticeAlertProps) {
  if (messages.length === 0) return null;

  const { container, icon, Icon } = NOTICE_STYLES[variant];

  return (
    <div
      className={`flex gap-3 rounded-xl border px-4 py-3 ${container} ${className}`}
      role={variant === "error" ? "alert" : "status"}
    >
      <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${icon}`} strokeWidth={2} aria-hidden />
      <ul className="min-w-0 space-y-1.5 text-sm leading-snug">
        {messages.map((message, index) => (
          <li key={`${variant}-${index}`}>{message}</li>
        ))}
      </ul>
    </div>
  );
}
